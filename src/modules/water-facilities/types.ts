export interface WaterFacility {
    id: string;
    name: string;
    permit_number: string | null;
    permit_issue_date: string | null; // Date string YYYY-MM-DD
    permit_expiry_date: string | null; // Date string YYYY-MM-DD
    authority: string | null;
    image_url: string | null;
    permit_file_path: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface WaterFacilityInput {
    name: string;
    permit_number?: string;
    permit_issue_date?: string | null;
    permit_expiry_date?: string | null;
    authority?: string;
    image_url?: string;
    permit_file_path?: string;
}
