import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';
import imageCompression from 'browser-image-compression';

export function usePersonnelPhotos() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const uploadPhotoMutation = useMutation({
        mutationFn: async ({ entityId, file, description }: { entityId: string; file: File; description?: string }) => {
            // 1. Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);

            // 2. Upload to Supabase Storage (bucket: 'photos')
            // Path: module/entityId/filename
            const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const path = `personnel/${entityId}/${filename}`;

            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(path, compressedFile);

            if (uploadError) throw uploadError;

            // 3. Get Public URL (or signed URL if private)
            // Assuming public bucket for now for simplicity, or we use a signed URL
            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);

            // 4. Insert into photos table
            const { data: photoRecord, error: dbError } = await supabase
                .from('photos')
                .insert({
                    entity_id: entityId,
                    drive_file_id: path, // Using storage path as ID/reference for now 
                    drive_url: publicUrl,
                    filename: file.name,
                    description: description
                })
                .select()
                .single();

            if (dbError) throw dbError;

            return photoRecord;
        },
        onSuccess: (_, { entityId }) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'upload_photo',
                table_name: 'photos',
                new_values: { entity_id: entityId }
            });
        },
    });

    const deletePhotoMutation = useMutation({
        mutationFn: async ({ id, path }: { id: string; path: string }) => {
            // 1. Remove from Storage
            const { error: storageError } = await supabase.storage
                .from('photos')
                .remove([path]);

            if (storageError) throw storageError;

            // 2. Remove from DB
            const { error: dbError } = await supabase
                .from('photos')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'delete_photo',
                table_name: 'photos',
                record_id: 'unknown' // can't easily get ID here without passing it into onSuccess if needed
            });
        }
    });

    return {
        uploadPhoto: uploadPhotoMutation.mutateAsync,
        deletePhoto: deletePhotoMutation.mutateAsync,
        isUploading: uploadPhotoMutation.isPending,
    };
}
