import { useRef } from 'react';
import { toast } from 'sonner';
import { useWaterFacilityStorage } from '../hooks/useWaterFacilityStorage';
import { FileText, Trash2, Upload, Loader2, File, ExternalLink } from 'lucide-react';

interface Props {
    facilityId: string;
}

export function WaterFacilityDocuments({ facilityId }: Props) {
    const {
        documents,
        documentsLoading,
        uploadDocument,
        isUploadingDocument,
        deleteFile,
        downloadFile
    } = useWaterFacilityStorage(facilityId);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                await uploadDocument(e.target.files[0]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (error) {
                console.error("Upload failed", error);
                toast.error("Hiba történt a feltöltés során.");
            }
        }
    };

    const handleDelete = async (name: string) => {
        if (window.confirm("Biztosan törölni szeretnéd ezt a dokumentumot?")) {
            try {
                await deleteFile({ bucket: 'water_facility_documents', name });
            } catch (error) {
                console.error("Delete failed", error);
                toast.error("Hiba történt a törlés során.");
            }
        }
    };

    const handleOpen = async (name: string, url?: string) => {
        try {
            await downloadFile('water_facility_documents', { name, url });
        } catch (error) {
            console.error("Open failed", error);
            toast.error("Hiba történt a megnyitás során.");
        }
    };

    if (documentsLoading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Dokumentumok ({documents?.length || 0})</h3>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDocument}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isUploadingDocument ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Feltöltés
                    </button>
                </div>
            </div>

            {documents && documents.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <ul className="divide-y divide-gray-100">
                        {documents.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs sm:max-w-md">{doc.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(doc.uploaded_at).toLocaleDateString('hu-HU')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpen(doc.name, doc.drive_url)}
                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Megnyitás"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Törlés"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                        <File className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">Nincsenek feltöltött dokumentumok.</p>
                </div>
            )}
        </div>
    );
};
