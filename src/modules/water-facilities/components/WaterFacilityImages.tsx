import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useWaterFacilityStorage } from '../hooks/useWaterFacilityStorage';
import { Image as ImageIcon, Trash2, Upload, Loader2, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    facilityId: string;
}

export function WaterFacilityImages({ facilityId }: Props) {
    const {
        images,
        imagesLoading,
        uploadImage,
        isUploadingImage,
        deleteFile
    } = useWaterFacilityStorage(facilityId);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                await uploadImage(e.target.files[0]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (error) {
                console.error("Upload failed", error);
                toast.error("Hiba történt a feltöltés során.");
            }
        }
    };

    const handleDelete = async (name: string) => {
        if (window.confirm("Biztosan törölni szeretnéd ezt a képet?")) {
            try {
                await deleteFile({ bucket: 'water_facility_images', name });
                if (selectedImage && selectedImage.includes(name)) setSelectedImage(null);
            } catch (error) {
                console.error("Delete failed", error);
                toast.error("Hiba történt a törlés során.");
            }
        }
    };

    if (imagesLoading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Képek ({images?.length || 0})</h3>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Feltöltés
                    </button>
                </div>
            </div>

            {images && images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                            <img
                                src={img.publicUrl} // storage hook maps drive_url to publicUrl
                                alt={img.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <button
                                    onClick={() => setSelectedImage(img.publicUrl)}
                                    className="p-2 bg-white/20 text-white rounded-full hover:bg-white/40 backdrop-blur-md transition-colors"
                                >
                                    <Maximize2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(img.name)} // hook uses filename for now
                                    className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 backdrop-blur-md transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">Nincsenek feltöltött képek.</p>
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={selectedImage}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
