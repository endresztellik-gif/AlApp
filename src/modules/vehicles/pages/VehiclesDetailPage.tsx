import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Trash2, Shield, Calendar, AlertCircle, Truck, FileText, User, Loader2, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleForm } from '../components/VehicleForm';
import { useIncidents } from '@/modules/incidents/hooks/useIncidents';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { googleStorage } from '@/core/api/google-services';
import { useAuth } from '@/core/auth/useAuth';
import { ValidityStatusBadge } from '@/shared/components/ValidityStatusBadge';
import { MaintenanceLogSection } from '@/shared/components/MaintenanceLogSection';
import { QRCodeGenerator } from '@/shared/components/QRCodeGenerator';

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

export function VehiclesDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { update, remove } = useVehicles();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data: vehicle, isLoading, refetch } = useQuery({
        queryKey: ['vehicles', id],
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

    if (!vehicle) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
            >
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-primary-300" />
                </div>
                <p className="text-[14px] text-muted-foreground">Nem található a keresett jármű.</p>
                <button
                    onClick={() => navigate('/vehicles')}
                    className="text-[13px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                    ← Vissza a listához
                </button>
            </motion.div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdate = async (data: any) => {
        await update({
            id: vehicle.id,
            updates: data,
            fieldValues: data.field_values
        });
        refetch();
    };

    const handleDelete = async () => {
        if (confirm("Biztosan törölni szeretnéd?")) {
            await remove(vehicle.id);
            navigate('/vehicles');
        }
    };

    const getLabel = (key: string) => vehicle._schemaMap?.[key]?.field_name || key;
    const isTrackedDate = (key: string) => ['inspection_expiry', 'registration_expiry'].includes(key);

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
                    onClick={() => navigate('/vehicles')}
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
                    <div className={`h-[3px] w-full ${vehicle.is_active ? 'bg-gradient-to-r from-secondary-400/50 to-transparent' : 'bg-gradient-to-r from-status-critical/40 to-transparent'}`} />

                    <div className="p-6 text-center space-y-4">
                        {/* Nagy jármű ikon */}
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center mx-auto"
                            style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.25)' }}
                        >
                            <Truck className="w-9 h-9 text-white" strokeWidth={1.8} />
                        </motion.div>

                        <div>
                            <h1 className="text-[18px] font-bold text-text-primary leading-tight">
                                {vehicle.display_name}
                            </h1>
                            <p className="text-[12.5px] text-muted-foreground mt-0.5">
                                {vehicle.entity_type?.name}
                            </p>
                        </div>

                        {/* Rendszám badge */}
                        {vehicle.field_values?.license_plate && vehicle.field_values.license_plate !== vehicle.display_name && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[12px] font-bold text-text-primary"
                                style={{ background: 'rgba(90,110,95,0.10)', border: '1px solid rgba(90,110,95,0.20)' }}>
                                {vehicle.field_values.license_plate}
                            </div>
                        )}

                        {/* Státusz badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold ${vehicle.is_active ? 'status-ok' : 'status-critical'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vehicle.is_active ? 'bg-status-ok' : 'bg-status-critical'}`} />
                            {vehicle.is_active ? 'Aktív státusz' : 'Inaktív'}
                        </div>

                        {/* Felelős */}
                        {vehicle.responsible_user && (
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
                                        {vehicle.responsible_user.full_name}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Jobb oldali oszlop */}
                <div className="md:col-span-2 space-y-5">

                    {/* Adatok kártya */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-2xl overflow-hidden"
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
                                Műszaki adatok és információk
                            </h2>
                        </div>

                        {/* Mezők rács */}
                        <div className="p-6">
                            {Object.keys(vehicle.field_values || {}).length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-[13px] text-muted-foreground italic">Nincsenek rögzített adatok.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {Object.entries(vehicle.field_values || {}).map(([key, value], i) => {
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
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[13.5px] font-semibold text-text-primary break-words">
                                                        {key.includes('expiry') || key.includes('date')
                                                            ? format(new Date(String(value)), "yyyy. MMM d.", { locale: hu })
                                                            : String(value)}
                                                    </p>
                                                    {isTrackedDate(key) && (
                                                        <ValidityStatusBadge date={String(value)} />
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Karbantartási Napló Kártya */}
                    <MaintenanceLogSection entityId={vehicle.id} />

                    {/* Káresemények kártya */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}
                    >
                        <div className="px-6 py-4 border-b flex items-center gap-2.5"
                            style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.4)' }}>
                            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(201,120,59,0.12)' }}>
                                <AlertCircle className="w-4 h-4 text-status-urgent" />
                            </div>
                            <h2 className="text-[14px] font-semibold text-text-primary">
                                Káresemények és hibák
                            </h2>
                        </div>
                        <div className="p-6">
                            <VehicleIncidentsList vehicleId={vehicle.id} />
                        </div>
                    </motion.div>

                    {/* Dokumentumok kártya */}
                    <VehicleDocs vehicleId={vehicle.id} photos={vehicle.photos || []} onRefresh={refetch} />

                    {/* QR Code Generátor kártya */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-2xl overflow-hidden mt-6"
                        style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between"
                            style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.4)' }}>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-[14px] font-semibold text-text-primary">
                                    Gyors Bejelentő (QR)
                                </h2>
                            </div>
                        </div>
                        <div className="p-6 flex justify-center bg-slate-50">
                            <QRCodeGenerator
                                url={`${window.location.origin}/quick-report/${vehicle.id}`}
                                filename={`qr-${vehicle.display_name}.svg`}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isEditOpen && (
                    <VehicleForm
                        isOpen={isEditOpen}
                        initialData={vehicle}
                        onSave={handleUpdate}
                        onCancel={() => setIsEditOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ... (existing helper functions)

interface Photo {
    id: string;
    drive_file_id: string;
    drive_url: string;
    filename: string;
    description?: string;
    uploaded_at: string;
    uploaded_by?: string;
}

function VehicleDocs({ vehicleId, photos, onRefresh }: { vehicleId: string, photos: Photo[], onRefresh: () => void }) {
    const { user } = useAuth(); // Assuming useAuth is available or we pass user. 
    // Actually, VehiclesDetailPage doesn't explicitly use useAuth yet, checking imports...
    // We should import useAuth from '@/core/auth/useAuth'.
    // If not available easily, we can skip `uploaded_by` for now or get it from session.

    // Let's use local state for uploading
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!confirm(`Szeretnéd feltölteni a következő fájlt?\n${file.name}`)) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload to Drive
            const driveFile = await googleStorage.uploadFile(file, 'Vehicles', 'vehicles');

            // 2. Save to Supabase
            const { error } = await supabase
                .from('photos')
                .insert({
                    entity_id: vehicleId,
                    drive_file_id: driveFile.id,
                    drive_url: driveFile.webViewLink,
                    filename: file.name,
                    description: 'Feltöltve a Jármű adatlapról',
                    uploaded_by: user?.id
                });

            if (error) throw error;

            // 3. Refresh
            onRefresh();
            toast.success("Sikeres feltöltés!");
        } catch (err) {
            console.error(err);
            toast.error("Hiba történt a feltöltés során.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDelete = async (photoId: string, _driveId: string) => {
        if (!confirm("Biztosan törölni szeretnéd ezt a dokumentumot?")) return;

        try {
            // 1. Delete from Supabase (Cascade might not delete Drive file, but we should try)
            const { error } = await supabase.from('photos').delete().eq('id', photoId);
            if (error) throw error;

            // 2. Ideally delete from Drive too (but implementation missing in googleStorage currently)
            // await googleStorage.deleteFile(driveId); // This would require googleStorage.deleteFile implementation

            onRefresh();
            toast.success("Dokumentum sikeresen törölve!");
        } catch (err) {
            console.error(err);
            toast.error("Hiba történt a törlés során.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'var(--color-bg-card)',
                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
            }}
        >
            <div className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.4)' }}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: 'rgba(74,144,217,0.12)' }}>
                        <FileText className="w-4 h-4 text-primary-600" style={{ color: '#4A90D9' }} />
                    </div>
                    <h2 className="text-[14px] font-semibold text-text-primary">
                        Dokumentumok és Fotók
                    </h2>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : '+ Feltöltés'}
                    </button>
                </div>
            </div>
            <div className="p-6">
                {photos.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-[13px] text-muted-foreground italic">Nincs feltöltött dokumentum.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {photos.map(photo => (
                            <div key={photo.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 group">
                                <a href={photo.drive_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                                    <div className="p-2 rounded-lg bg-white border border-border/50">
                                        <ImageIcon className="w-4 h-4 text-primary-500" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-[13px] font-medium text-text-primary truncate">{photo.filename}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {format(new Date(photo.uploaded_at), "yyyy. MMM d.", { locale: hu })}
                                        </p>
                                    </div>
                                </a>
                                <button
                                    onClick={() => handleDelete(photo.id, photo.drive_file_id)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-status-critical hover:bg-status-critical/10 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Törlés"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function VehicleIncidentsList({ vehicleId }: { vehicleId: string }) {
    const { incidents, isLoading } = useIncidents(vehicleId);

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="skeleton h-16 rounded-xl" />
                <div className="skeleton h-16 rounded-xl" />
            </div>
        );
    }

    if (!incidents || incidents.length === 0) {
        return (
            <div className="text-center py-6">
                <AlertCircle className="w-7 h-7 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-[13px] text-muted-foreground italic">Nincs rögzített káresemény.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {incidents.map((incident, i) => (
                <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl flex flex-col gap-2"
                    style={{
                        background: 'rgba(240,245,241,0.5)',
                        border: '1px solid rgba(90,110,95,0.10)',
                    }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(201,120,59,0.10)', color: 'var(--color-status-urgent)', border: '1px solid rgba(201,120,59,0.20)' }}>
                            Nyitott
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(incident.created_at), "yyyy. MMM d.", { locale: hu })}
                        </span>
                    </div>
                    <p className="text-[13px] text-text-primary">{incident.description}</p>
                    <div className="pt-1 border-t flex items-center gap-2 text-[11.5px] text-muted-foreground"
                        style={{ borderColor: 'rgba(90,110,95,0.10)' }}>
                        <User className="w-3 h-3" />
                        <span>Bejelentő: {incident.reporter?.full_name || 'Ismeretlen'}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
