import { supabase } from '@/lib/supabase';

export async function invokeEdgeFunction<T = unknown>(functionName: string, body?: Record<string, unknown> | FormData): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body,
    });

    if (error) {
        console.error(`Edge Function '${functionName}' failed:`, error);
        throw new Error(error.message || 'Edge Function Error');
    }

    return data;
}
