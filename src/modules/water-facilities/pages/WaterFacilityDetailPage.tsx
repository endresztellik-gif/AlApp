import { useState } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { useWaterFacility, useWaterFacilities } from '../hooks/useWaterFacilities';
import { WaterFacilityInput } from '../types';
import { googleStorage } from '@/core/api/google-services';
import { WaterFacilityForm } from '../components/WaterFacilityForm';
import { ArrowLeft, FileText, Image, Edit, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { WaterFacilityDocuments } from '../components/WaterFacilityDocuments';
import { WaterFacilityImages } from '../components/WaterFacilityImages';

type Tab = 'details' | 'documents' | 'images';

export function WaterFacilityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { facility, isLoading, error } = useWaterFacility(id);
    const { updateFacility } = useWaterFacilities();
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleUpdate = async (data: WaterFacilityInput, file?: File) => {
        if (!id) return;
        try {
            const updates = { ...data };

            // Upload file if new one selected
            if (file) {
                // Upload to Google Drive
                // Folder: water-facilities/permits (or similar)
                // We use facility ID in the folder structure or name to keep it organized?
                // googleStorage.uploadFile takes (file, entityName, module)
                // For entityName let's use facility name or ID.
                // Let's use facility name to make it readable in Drive, but ID is safer for uniqueness.
                // Given the previous pattern, let's use facility.name (which is in 'data.name').

                const driveFile = await googleStorage.uploadFile(
                    file,
                    data.name || 'water-facility',
                    'water-facilities/permits'
                );

                updates.permit_file_path = driveFile.webViewLink;
            }

            await updateFacility({
                id,
                updates: updates
            });
            setIsEditOpen(false);
        } catch (err) {
            console.error("Update failed", err);
            toast.error("Hiba történt a mentés során.");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Betöltés...</div>;
    }

    if (error || !facility) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Hiba vagy a keresett létesítmény nem található.</p>
                <button
                    onClick={() => navigate('/water-facilities')}
                    className="text-primary-600 hover:text-indigo-800 font-medium"
                >
                    Vissza a listához
                </button>
            </div>
        );
    }

    return (
        <div className="pb-20 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/water-facilities')}
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            {facility.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {facility.permit_number ? `Engedély: ${facility.permit_number}` : 'Nincs engedélyszám'}
                        </p>
                    </div>
                </div>
                <div>
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Edit className="w-4 h-4" />
                        Szerkesztés
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-1" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'details'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <Droplets className="w-4 h-4" />
                        Adatok
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'documents'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <FileText className="w-4 h-4" />
                        Dokumentumok
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`
                             whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'images'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <Image className="w-4 h-4" />
                        Képek
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                {activeTab === 'details' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Eljáró Hatóság</h3>
                            <p className="text-gray-900 font-medium">{facility.authority || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Vízjogi Engedély Száma</h3>
                            <p className="text-gray-900 font-medium">{facility.permit_number || '-'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Engedély Kelte</h3>
                            <p className="text-gray-900 font-medium">
                                {facility.permit_issue_date ? new Date(facility.permit_issue_date).toLocaleDateString('hu-HU') : '-'}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Engedély Érvényességi Ideje</h3>
                            <p className="text-gray-900 font-medium">
                                {facility.permit_expiry_date ? new Date(facility.permit_expiry_date).toLocaleDateString('hu-HU') : '-'}
                            </p>
                        </div>
                        {facility.permit_file_path && (
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Engedély Dokumentum</h3>
                                <button
                                    onClick={() => window.open(facility.permit_file_path!, '_blank')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Érvényes Vízjogi Engedély Megtekintése
                                </button>
                            </div>
                        )}
                        <div className="md:col-span-2 pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Egyéb Információk</h3>
                            <p className="text-gray-600 text-sm">
                                Létrehozva: {new Date(facility.created_at).toLocaleDateString('hu-HU')}
                            </p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'documents' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <WaterFacilityDocuments facilityId={id!} />
                    </motion.div>
                )}

                {activeTab === 'images' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <WaterFacilityImages facilityId={id!} />
                    </motion.div>
                )}
            </div>

            <WaterFacilityForm
                isOpen={isEditOpen}
                initialData={facility}
                onCancel={() => setIsEditOpen(false)}
                onSave={handleUpdate}
                isLoading={false}
            />
        </div>
    );
}
