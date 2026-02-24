import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { useEntityTypesAdmin, useFieldSchemasAdmin } from '@/modules/admin/hooks/useFieldSchemasAdmin';
import { DynamicFieldInput } from '@/shared/components/DynamicFieldInput';
import { Personnel } from '../hooks/usePersonnel';

interface PersonnelFormData {
    display_name: string;
    responsible_user_id: string;
    is_active: boolean;
    entity_type_id: string;
    field_values: Record<string, unknown>;
    id?: string;
}

interface PersonnelFormProps {
    initialData?: Personnel;
    onSave: (data: PersonnelFormData) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
}

export function PersonnelForm({ initialData, onSave, onCancel, isOpen }: PersonnelFormProps) {
    const { entityTypes } = useEntityTypesAdmin();
    // Assuming 'Kolléga' is the type we want primarily, or allow selection.
    // For now, let's auto-select 'Kolléga' if available, or just filtering by module 'personnel'.
    const personnelTypes = entityTypes.filter(t => t.module === 'personnel');
    const defaultTypeId = personnelTypes.length > 0 ? personnelTypes[0].id : null;

    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialData?.entity_type_id || defaultTypeId);
    const { fields: fieldSchemas, isLoading: schemasLoading } = useFieldSchemasAdmin(selectedTypeId);

    const [formData, setFormData] = useState({
        display_name: '',
        responsible_user_id: '',
        is_active: true,
    });
    const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                display_name: initialData.display_name,
                responsible_user_id: initialData.responsible_user_id || '',
                is_active: initialData.is_active,
            });
            setSelectedTypeId(initialData.entity_type_id);
            setDynamicValues(initialData.field_values || {});
        } else if (defaultTypeId && !selectedTypeId) {
            setSelectedTypeId(defaultTypeId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedTypeId excluded to avoid resetting user selection
    }, [initialData, defaultTypeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTypeId) return;

        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                entity_type_id: selectedTypeId,
                field_values: dynamicValues,
                id: initialData?.id // Pass ID if updating
            });
            onCancel(); // Close on success
        } catch (error) {
            console.error(error);
            // Handle error (toast or alert)
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-border"
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur z-10">
                        <h2 className="text-lg font-semibold text-foreground">
                            {initialData ? 'Kolléga szerkesztése' : 'Új kolléga felvétele'}
                        </h2>
                        <button type="button" onClick={onCancel} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Alapadatok */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Típus kiválasztása (ha több van) */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Típus</label>
                                <select
                                    value={selectedTypeId || ''}
                                    onChange={(e) => setSelectedTypeId(e.target.value)}
                                    disabled={!!initialData || personnelTypes.length <= 1} // Disable if only 1 option or editing
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                    required
                                >
                                    {personnelTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Név *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.display_name}
                                    onChange={(e) => setFormData(p => ({ ...p, display_name: e.target.value }))}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                    placeholder="Teljes név"
                                />
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                                        className="rounded border-input text-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium">Aktív státusz</span>
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-border/50 pt-4">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Részletes adatok</h3>

                            {schemasLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                </div>
                            ) : fieldSchemas.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">
                                    Nincsenek definiált mezők ehhez a típushoz.
                                </p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {fieldSchemas.map(schema => (
                                        <div key={schema.id} className={schema.field_type === 'text' || schema.field_type === 'file' ? 'sm:col-span-2' : ''}>
                                            <DynamicFieldInput
                                                schema={schema}
                                                value={dynamicValues[schema.field_key] as string | number | null}
                                                onChange={(val) => setDynamicValues(p => ({ ...p, [schema.field_key]: val }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-5 border-t border-border/50 bg-muted/20 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                            Mégse
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Mentés
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
