import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { WaterFacility, WaterFacilityInput } from '../types';

interface WaterFacilityFormProps {
    initialData?: WaterFacility;
    onSave: (data: WaterFacilityInput, file?: File) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
    isLoading?: boolean;
}

export function WaterFacilityForm({
    initialData,
    onSave,
    onCancel,
    isOpen,
    isLoading = false,
}: WaterFacilityFormProps) {
    const [formData, setFormData] = useState<WaterFacilityInput>({
        name: '',
        permit_number: '',
        permit_issue_date: null,
        permit_expiry_date: null,
        authority: '',
        image_url: '',
        permit_file_path: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                permit_number: initialData.permit_number || '',
                permit_issue_date: initialData.permit_issue_date || null,
                permit_expiry_date: initialData.permit_expiry_date || null,
                authority: initialData.authority || '',
                image_url: initialData.image_url || '',
                permit_file_path: initialData.permit_file_path || '',
            });
        } else {
            setFormData({
                name: '',
                permit_number: '',
                permit_issue_date: null,
                permit_expiry_date: null,
                authority: '',
                image_url: '',
                permit_file_path: '',
            });
        }
        setSelectedFile(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value === '' ? null : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSave(formData, selectedFile || undefined);
            if (!isLoading) onCancel();
        } catch (error) {
            console.error("Failed to save:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-gray-200"
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {initialData ? 'Vízi Létesítmény Szerkesztése' : 'Új Vízi Létesítmény'}
                        </h2>
                        <button type="button" onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label htmlFor="name" className="block text-xs font-medium text-gray-500 mb-1">
                                    Létesítmény Neve *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="authority" className="block text-xs font-medium text-gray-500 mb-1">
                                    Eljáró Hatóság
                                </label>
                                <input
                                    type="text"
                                    id="authority"
                                    name="authority"
                                    value={formData.authority || ''}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="permit_number" className="block text-xs font-medium text-gray-500 mb-1">
                                    Vízjogi Engedély Száma
                                </label>
                                <input
                                    type="text"
                                    id="permit_number"
                                    name="permit_number"
                                    value={formData.permit_number || ''}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>

                            {/* Placeholder for layout balance if needed */}
                            <div className="hidden sm:block"></div>

                            <div>
                                <label htmlFor="permit_issue_date" className="block text-xs font-medium text-gray-500 mb-1">
                                    Engedély Kelte
                                </label>
                                <input
                                    type="date"
                                    id="permit_issue_date"
                                    name="permit_issue_date"
                                    value={formData.permit_issue_date || ''}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="permit_expiry_date" className="block text-xs font-medium text-gray-500 mb-1">
                                    Engedély Érvényességi Ideje
                                </label>
                                <input
                                    type="date"
                                    id="permit_expiry_date"
                                    name="permit_expiry_date"
                                    value={formData.permit_expiry_date || ''}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>

                            <div className="sm:col-span-2 pt-4 border-t border-gray-100">
                                <label className="block text-xs font-medium text-gray-900 mb-2">
                                    Jelenleg Érvényes Vízjogi Engedély (Dokumentum)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        id="permit_file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                                    />
                                </div>
                                {initialData?.permit_file_path && !selectedFile && (
                                    <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                        ✓ Jelenleg van feltöltött engedély dokumentum.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Mégse
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Mentés
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
