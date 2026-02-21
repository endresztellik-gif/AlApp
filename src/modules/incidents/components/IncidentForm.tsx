import { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { X, Loader2, AlertTriangle, Search, Upload } from 'lucide-react';
import { useVehicles } from '@/modules/vehicles/hooks/useVehicles';
import { useEquipment } from '@/modules/equipment/hooks/useEquipment';
import { useAuth } from '@/core/auth/useAuth';
import { googleStorage, DriveFile } from '@/core/api/google-services';

interface IncidentFormData {
    entity_id: string;
    description: string;
    reported_by: string;
    _photos: DriveFile[];
}

interface IncidentFormProps {
    onSave: (data: IncidentFormData) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
}

interface UploadedFile {
    file: File;
    preview: string;
    uploading: boolean;
    driveId?: string;
    driveLink?: string;
}

export function IncidentForm({ onSave, onCancel, isOpen }: IncidentFormProps) {
    const { user } = useAuth();
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();
    const { equipment, isLoading: equipmentLoading } = useEquipment();

    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Photo handling
    const [photos, setPhotos] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Combine and link entities for selection
    const allEntities = useMemo(() => {
        const v = vehicles?.map(i => ({ ...i, type_name: i.entity_type?.name, category: 'Jármű', module: 'vehicles' })) || [];
        const e = equipment?.map(i => ({ ...i, type_name: i.entity_type?.name, category: 'Eszköz', module: 'equipment' })) || [];
        return [...v, ...e].filter(item => item.is_active);
    }, [vehicles, equipment]);

    const filteredEntities = useMemo(() => {
        if (!searchQuery) return allEntities;
        const lowerQ = searchQuery.toLowerCase();
        return allEntities.filter(e =>
            e.display_name.toLowerCase().includes(lowerQ) ||
            (e.type_name || '').toLowerCase().includes(lowerQ)
        );
    }, [allEntities, searchQuery]);

    const selectedEntity = useMemo(() =>
        allEntities.find(e => e.id === selectedEntityId),
        [allEntities, selectedEntityId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file), // Local preview
                uploading: false
            }));
            setPhotos(prev => [...prev, ...newFiles]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => {
            const newPhotos = [...prev];
            URL.revokeObjectURL(newPhotos[index].preview); // Cleanup memory
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEntityId || !user || !selectedEntity) return;

        // Ask for confirmation
        if (!window.confirm("Biztosan beküldöd a káreseményt a megadott adatokkal?")) {
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload photos first (simulated or real)
            const uploadedPhotosData: DriveFile[] = [];

            for (const photo of photos) {
                try {
                    // Update state to show uploading for this specific photo (could refine UI for individual progress)
                    const result = await googleStorage.uploadFile(
                        photo.file,
                        selectedEntity.display_name,
                        selectedEntity.module
                    );
                    uploadedPhotosData.push(result);
                } catch (err) {
                    console.error("Failed to upload photo", err);
                    // Continue with other photos or fail? Let's Log but continue for now.
                }
            }

            // 2. Save Incident
            await onSave({
                entity_id: selectedEntityId,
                description,
                reported_by: user.id,
                _photos: uploadedPhotosData // We will extract this in the hook
            });

            onCancel();
        } catch (error) {
            console.error(error);
            toast.error("Hiba történt a mentés során.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isLoadingData = vehiclesLoading || equipmentLoading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-xl border border-border"
            >
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-status-urgent" />
                        Káresemény bejelentése
                    </h2>
                    <button onClick={onCancel} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    <form id="incident-form" onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Entity Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                Érintett eszköz vagy jármű *
                            </label>

                            {isLoadingData ? (
                                <div className="p-4 flex justify-center text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {!selectedEntityId ? (
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Keresés név vagy típus alapján..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="max-h-48 overflow-y-auto border border-input rounded-lg bg-background/50">
                                                {filteredEntities.length === 0 ? (
                                                    <div className="p-3 text-xs text-muted-foreground text-center">Nincs találat.</div>
                                                ) : (
                                                    filteredEntities.map(entity => (
                                                        <div
                                                            key={entity.id}
                                                            onClick={() => {
                                                                setSelectedEntityId(entity.id);
                                                                setSearchQuery('');
                                                            }}
                                                            className="px-3 py-2.5 cursor-pointer text-sm flex items-center justify-between transition-colors hover:bg-muted/50 text-foreground"
                                                        >
                                                            <div>
                                                                <div className="font-medium">{entity.display_name}</div>
                                                                <div className="text-xs text-muted-foreground">{entity.type_name}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-lg">
                                            <div>
                                                <div className="text-sm font-medium text-primary-900">{selectedEntity?.display_name}</div>
                                                <div className="text-xs text-primary-700">{selectedEntity?.type_name}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedEntityId('')}
                                                className="text-xs text-primary-600 hover:underline"
                                            >
                                                Módosítás
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Hiba / Kár leírása *
                            </label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                                placeholder="Írd le részletesen, mi történt, mi a hiba..."
                            />
                        </div>

                        {/* Photo Upload */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground flex items-center justify-between">
                                <span>Fotók csatolása</span>
                                <span className="text-xs text-muted-foreground">{photos.length} kép kiválasztva</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted/20 group">
                                        <img src={photo.preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border border-dashed border-border hover:border-primary-500 hover:bg-primary-50/30 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary-600"
                                >
                                    <div className="p-2 rounded-full bg-muted/50">
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium">Kép feltöltése</span>
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                        </div>

                    </form>
                </div>

                <div className="p-5 border-t border-border/50 bg-muted/20 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Mégse
                    </button>
                    <button
                        type="submit"
                        form="incident-form"
                        disabled={isSubmitting || !selectedEntityId}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-status-urgent text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Mentés...</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-4 h-4" />
                                <span>Bejelentés</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
