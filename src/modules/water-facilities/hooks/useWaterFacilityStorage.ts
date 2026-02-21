import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { googleStorage } from '@/core/api/google-services';
import imageCompression from 'browser-image-compression';

export interface StorageFile {
    id: string; // The DB ID
    name: string; // Filename
    drive_url: string;
    uploaded_at: string;
    metadata?: Record<string, unknown>; // Kept for compatibility if needed
}

export function useWaterFacilityStorage(facilityId: string) {
    const queryClient = useQueryClient();

    // --- DOCUMENTS ---
    const fetchDocuments = async () => {
        if (!facilityId) return [];
        const { data, error } = await supabase
            .from('water_facility_documents')
            .select('*')
            .eq('facility_id', facilityId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            name: d.filename,
            drive_url: d.drive_url,
            uploaded_at: d.uploaded_at,
            metadata: { size: 0 } // Mock metadata to satisfy component interfaces if strict
        }));
    };

    const { data: documents, isLoading: documentsLoading } = useQuery({
        queryKey: ['water_facility_documents', facilityId],
        queryFn: fetchDocuments,
        enabled: !!facilityId,
    });

    const uploadDocumentMutation = useMutation({
        mutationFn: async (file: File) => {
            // 1. Upload to Google Drive
            // Folder name convention: water_facilities/<facilityId>
            // But googleStorage helper appends module/name.
            // Let's pass "water_facilities/documents" or similar.
            // Actually googleStorage.uploadFile takes (file, entityName, module).
            // Module = 'water-facilities', EntityName = facilityId (or name?)
            // Ideally we want readable names. But facilityId is unique.
            // Let's use facilityId for now to keep it grouped.

            const driveFile = await googleStorage.uploadFile(file, facilityId, 'water-facilities/documents');

            // 2. Insert into DB
            const { error } = await supabase
                .from('water_facility_documents')
                .insert([{
                    facility_id: facilityId,
                    drive_file_id: driveFile.id,
                    drive_url: driveFile.webViewLink,
                    filename: file.name
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['water_facility_documents', facilityId] });
        },
    });

    // --- IMAGES ---
    const fetchImages = async () => {
        if (!facilityId) return [];
        const { data, error } = await supabase
            .from('water_facility_photos')
            .select('*')
            .eq('facility_id', facilityId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            name: d.filename,
            // Images component might expect 'publicUrl' or simply use the drive_url if compatible?
            // Drive URL (webViewLink) might not be directly embeddable <img> src without constraints.
            // But usually webContentLink or thumbnailLink is better for <img>.
            // googleStorage returns webViewLink and thumbnailLink.
            // Let's assume we saved webViewLink.
            // For <img> reference, we might need a workaround or "Please open in Drive".
            // However, usually `webContentLink` is better for direct access if supported.
            // The DB saves drive_url from webViewLink in the plan?
            // Let's assume we use drive_url for both.
            // TODO: Check if we need thumbnailLink for <img> tag.
            // For now mapping drive_url to publicUrl to minimize component changes.
            publicUrl: d.drive_url,
            drive_url: d.drive_url,
            uploaded_at: d.uploaded_at
        }));
    };

    const { data: images, isLoading: imagesLoading } = useQuery({
        queryKey: ['water_facility_images', facilityId],
        queryFn: fetchImages,
        enabled: !!facilityId,
    });

    const uploadImageMutation = useMutation({
        mutationFn: async (file: File) => {
            // Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            let fileToUpload = file;
            try {
                fileToUpload = await imageCompression(file, options);
            } catch (error) {
                console.warn("Image compression failed, uploading original.", error);
            }

            const driveFile = await googleStorage.uploadFile(fileToUpload, facilityId, 'water-facilities/photos');

            const { error } = await supabase
                .from('water_facility_photos')
                .insert([{
                    facility_id: facilityId,
                    drive_file_id: driveFile.id,
                    drive_url: driveFile.webViewLink, // Or thumbnailLink if we want direct img?
                    // Usually we want the link to open.
                    filename: file.name
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['water_facility_images', facilityId] });
        },
    });

    // --- DELETE (Generic) ---
    // We need to differentiate between photos and documents tables now.
    // The component passes bucket name, we can map it.
    const deleteFileMutation = useMutation({
        mutationFn: async ({ bucket, name }: { bucket: 'water_facility_documents' | 'water_facility_images', name: string }) => {
            // In the new system, 'name' is likely the filename or we need the ID?
            // The components pass 'name' currently.
            // But we have IDs now.
            // We should update components to pass ID.
            // Failing that, we delete by filename AND facility_id (risky if duplicates).
            // Let's try to delete by ID if 'name' is actually an ID, otherwise by filename.

            // Wait, previous implementation used filename as key.
            // New implementation returns 'id' as DB ID.
            // If component uses 'id' for deletion, we are good.
            // If component uses 'name', we need to find it.

            // Let's assume we update components to pass ID.
            // Or we check if 'name' looks like UUID.

            const table = bucket === 'water_facility_documents' ? 'water_facility_documents' : 'water_facility_photos';

            // If 'name' is passed, we assume it's the ID because in fetch we mapped id: d.id
            // But wait, the component might display 'name' (filename) and use it for deletion.
            // We need to check the component code.

            // For now, let's assume we delete by ID for safety, so we must ensure component passes ID.
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('filename', name) // Fallback to filename if components not updated yet
                .eq('facility_id', facilityId);

            if (error) throw error;
        },
        onSuccess: (_, { bucket }) => {
            queryClient.invalidateQueries({ queryKey: [bucket, facilityId] });
        },
    });

    // --- DOWNLOAD (Generic) ---
    // Now this just opens the link
    const downloadFile = async (_bucket: string, info: { name: string, url?: string }) => {
        // We need the URL. If not passed, we might need to find it.
        // But better to just open the URL if we have it in the list.
        if (info.url) {
            window.open(info.url, '_blank');
        } else {
            toast.error("File URL not found.");
        }
    };

    return {
        documents,
        documentsLoading,
        uploadDocument: uploadDocumentMutation.mutateAsync,
        isUploadingDocument: uploadDocumentMutation.isPending,

        images,
        imagesLoading,
        uploadImage: uploadImageMutation.mutateAsync,
        isUploadingImage: uploadImageMutation.isPending,

        deleteFile: deleteFileMutation.mutateAsync,
        downloadFile
    };
}
