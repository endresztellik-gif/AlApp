import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Trash2, Shield, FileText, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePersonnel } from '../hooks/usePersonnel';
import { useState } from 'react';
import { PersonnelForm } from '../components/PersonnelForm';

/* Avatar szín ugyanaz mint a kártyán */
function avatarColor(name: string) {
    const palette = [
        { from: 'from-primary-400', to: 'to-primary-600' },
        { from: 'from-secondary-400', to: 'to-secondary-600' },
        { from: 'from-accent-dark', to: 'to-accent-base' },
        { from: 'from-primary-300', to: 'to-primary-500' },
    ]
    return palette[name.charCodeAt(0) % palette.length]
}

/* Részlap skeleton */
function DetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="skeleton h-9 w-36 rounded-xl" />
            <div className="grid gap-5 md:grid-cols-3">
                <div className="skeleton h-64 rounded-2xl" />
                <div className="md:col-span-2 skeleton h-64 rounded-2xl" />
            </div>
        </div>
    )
}

export function PersonnelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { update, remove } = usePersonnel();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data: person, isLoading, refetch } = useQuery({
        queryKey: ['personnel', id],
        queryFn: async () => {
            const { data: entity, error } = await supabase
                .from('entities')
                .select(`
    *,
    entity_type: entity_types(id, name),
        responsible_user: user_profiles(full_name),
            photos(*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!entity) return null;

            const { data: fieldValues } = await supabase
                .from('field_values')
                .select(`
value_text,
    value_date,
    value_json,
    field_schema: field_schemas(field_key, field_name, field_type)
                `)
                .eq('entity_id', id);

            const values: Record<string, unknown> = {};
            const schemaMap: Record<string, { field_key: string; field_name: string; field_type: string }> = {};

            fieldValues?.forEach(fv => {
                const val = fv.value_text ?? fv.value_date ?? fv.value_json;
                const schema = fv.field_schema as unknown as { field_key: string; field_name: string; field_type: string } | null;
                if (schema?.field_key) {
                    values[schema.field_key] = val;
                    schemaMap[schema.field_key] = schema;
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...entity, field_values: values, _schemaMap: schemaMap } as any;
        },
        enabled: !!id
    });

    if (isLoading) return <DetailSkeleton />;

    if (!person) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
            >
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary-300" />
                </div>
                <p className="text-[14px] text-muted-foreground">Nem található a keresett személy.</p>
                <button
                    onClick={() => navigate('/personnel')}
                    className="text-[13px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                    ← Vissza a listához
                </button>
            </motion.div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdate = async (data: any) => {
        await update({ id: person.id, updates: data, fieldValues: data.field_values });
        refetch();
    };

    const handleDelete = async () => {
        if (confirm("Biztosan törölni szeretnéd?")) {
            await remove(person.id);
            navigate('/personnel');
        }
    };

    const getLabel = (key: string) => person._schemaMap?.[key]?.field_name || key;
    const color = avatarColor(person.display_name)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl mx-auto space-y-6"
        >
            {/* ── Navigáció ── */}
            <div className="flex items-center justify-between">
                <motion.button
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/personnel')}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Vissza a listához
                </motion.button>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsEditOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-text-secondary border transition-colors hover:bg-bg-secondary"
                        style={{ borderColor: 'rgba(90,110,95,0.18)', background: 'var(--color-bg-card)' }}
                    >
                        <Edit className="w-3.5 h-3.5" />
                        Szerkesztés
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-status-critical transition-colors"
                        style={{ background: 'rgba(201,59,59,0.07)', border: '1px solid rgba(201,59,59,0.15)' }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Törlés
                    </motion.button>
                </div>
            </div>

            {/* ── Főrács ── */}
            <div className="grid gap-5 md:grid-cols-3">

                {/* Profil kártya */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="md:col-span-1 rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--color-bg-card)',
                        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                    }}
                >
                    {/* Állapot csík */}
                    <div className={`h-[3px] w-full ${person.is_active ? 'bg-gradient-to-r from-primary-400/50 to-transparent' : 'bg-gradient-to-r from-status-critical/40 to-transparent'}`} />

                    <div className="p-6 text-center space-y-4">
                        {/* Nagy avatar */}
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            className={`w-20 h-20 rounded-full bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center text-white text-3xl font-bold mx-auto`}
                            style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.25)' }}
                        >
                            {person.display_name.charAt(0).toUpperCase()}
                        </motion.div>

                        <div>
                            <h1 className="text-[18px] font-bold text-text-primary leading-tight">
                                {person.display_name}
                            </h1>
                            <p className="text-[12.5px] text-muted-foreground mt-0.5">
                                {person.entity_type?.name}
                            </p>
                        </div>

                        {/* Státusz badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold ${
                            person.is_active ? 'status-ok' : 'status-critical'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${person.is_active ? 'bg-status-ok' : 'bg-status-critical'}`} />
                            {person.is_active ? 'Aktív státusz' : 'Inaktív'}
                        </div>

                        {/* Felelős */}
                        {person.responsible_user && (
                            <div className="pt-4 border-t text-left"
                                style={{ borderColor: 'rgba(90,110,95,0.12)' }}>
                                <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Felelős
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary-100">
                                        <Shield className="w-3.5 h-3.5 text-primary-600" />
                                    </div>
                                    <span className="text-[13px] font-semibold text-text-primary">
                                        {person.responsible_user.full_name}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Adatok kártya */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="md:col-span-2 rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--color-bg-card)',
                        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                    }}
                >
                    {/* Fejléc */}
                    <div className="px-6 py-4 border-b flex items-center gap-2.5"
                        style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.4)' }}>
                        <div className="p-1.5 rounded-lg bg-primary-100">
                            <FileText className="w-4 h-4 text-primary-600" />
                        </div>
                        <h2 className="text-[14px] font-semibold text-text-primary">
                            Adatok és dokumentumok
                        </h2>
                    </div>

                    {/* Mezők rács */}
                    <div className="p-6">
                        {Object.keys(person.field_values || {}).length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-[13px] text-muted-foreground italic">Nincsenek rögzített adatok.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {Object.entries(person.field_values || {}).map(([key, value], i) => {
                                    if (!value) return null;
                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 + i * 0.04 }}
                                            className="p-3.5 rounded-xl"
                                            style={{
                                                background: 'rgba(240,245,241,0.5)',
                                                border: '1px solid rgba(90,110,95,0.10)',
                                            }}
                                        >
                                            <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                                {getLabel(key)}
                                            </p>
                                            <p className="text-[13.5px] font-semibold text-text-primary break-words">
                                                {String(value)}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {isEditOpen && (
                    <PersonnelForm
                        isOpen={isEditOpen}
                        initialData={person}
                        onSave={handleUpdate}
                        onCancel={() => setIsEditOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
