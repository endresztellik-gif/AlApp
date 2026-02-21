import { invokeEdgeFunction } from '@/core/api/edge-functions';

// const USE_MOCK = true; // Disabled for real integration
// If we want to keep mock capability, we can use an env var or a flag.
// For this task, we want to enable real integration.
const USE_MOCK = false;

export interface DriveFile {
    id: string;
    webViewLink: string;
    thumbnailLink?: string;
    name: string;
}

export const googleStorage = {
    /**
     * Uploads a file to Google Drive via Supabase Edge Function
     */
    uploadFile: async (file: File, entityName: string, module: string): Promise<DriveFile> => {
        if (USE_MOCK) {
            console.log(`[GoogleDrive] [MOCK] Uploading ${file.name}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                id: `mock-id-${Date.now()}`,
                name: file.name,
                webViewLink: URL.createObjectURL(file), // This works for current session preview
                thumbnailLink: URL.createObjectURL(file)
            };
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', `${module}/${entityName}`);
        formData.append('description', `Uploaded from AlApp ${module} module`);

        // Note: 'drive-upload' function expects 'folderName', not 'entityName'/'module' directly, so we formatted it above.
        const data = await invokeEdgeFunction<DriveFile & { webContentLink?: string }>('drive-upload', formData);

        return {
            id: data.id,
            name: data.name,
            webViewLink: data.webViewLink,
            thumbnailLink: data.webContentLink
        };
    },

    deleteFile: async (fileId: string) => {
        if (USE_MOCK) {
            console.log(`[GoogleDrive] [MOCK] Delete ${fileId}`);
            return;
        }
        // We haven't implemented 'drive-delete' yet, so let's keep this safe or throw not implemented
        console.warn('Delete via Edge Function not yet implemented');
    }
};

export const googleCalendar = {
    /**
     * Fetches events from Google Calendar via Edge Function
     */
    getEvents: async (start: Date, end: Date) => {
        if (USE_MOCK) {
            return [
                {
                    id: '1',
                    title: 'Szabadság - MOCK',
                    start: new Date(),
                    end: new Date(),
                    allDay: true,
                    resource: 'vacation'
                }
            ];
        }

        const data = await invokeEdgeFunction<{ events?: Array<Record<string, unknown>> }>('calendar-sync', {
            start: start.toISOString(),
            end: end.toISOString()
        });

        return data.events || [];
    }
};
