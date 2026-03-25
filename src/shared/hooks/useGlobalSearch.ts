import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { googleCalendar } from '@/core/api/google-services';

export type SearchCategory = 'Személyek' | 'Járművek' | 'Eszközök' | 'Káresemények' | 'Emlékeztetők' | 'Naptár';

export interface SearchResult {
    id: string;
    category: SearchCategory;
    label: string;
    subtitle?: string;
    path: string;
}

const DEBOUNCE_MS = 300;

export function useGlobalSearch(query: string) {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        timerRef.current = setTimeout(async () => {
            try {
                const pattern = `%${q}%`;

                const [personnel, vehicles, equipment, incidents, reminders, calendarEvents] = await Promise.allSettled([
                    supabase
                        .from('personnel')
                        .select('id, display_name')
                        .ilike('display_name', pattern)
                        .limit(5),
                    supabase
                        .from('vehicles')
                        .select('id, display_name')
                        .ilike('display_name', pattern)
                        .limit(5),
                    supabase
                        .from('equipment')
                        .select('id, display_name')
                        .ilike('display_name', pattern)
                        .limit(5),
                    supabase
                        .from('incidents')
                        .select('id, title, description')
                        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
                        .limit(5),
                    supabase
                        .from('personal_reminders')
                        .select('id, title, due_at')
                        .ilike('title', pattern)
                        .limit(5),
                    googleCalendar.getEvents(
                        new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
                        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                    ),
                ]);

                const all: SearchResult[] = [];

                if (personnel.status === 'fulfilled' && personnel.value.data) {
                    personnel.value.data.forEach(r => all.push({
                        id: r.id, category: 'Személyek', label: r.display_name, path: `/personnel/${r.id}`,
                    }));
                }
                if (vehicles.status === 'fulfilled' && vehicles.value.data) {
                    vehicles.value.data.forEach(r => all.push({
                        id: r.id, category: 'Járművek', label: r.display_name, path: `/vehicles/${r.id}`,
                    }));
                }
                if (equipment.status === 'fulfilled' && equipment.value.data) {
                    equipment.value.data.forEach(r => all.push({
                        id: r.id, category: 'Eszközök', label: r.display_name, path: `/equipment/${r.id}`,
                    }));
                }
                if (incidents.status === 'fulfilled' && incidents.value.data) {
                    incidents.value.data.forEach(r => all.push({
                        id: r.id, category: 'Káresemények', label: r.title,
                        subtitle: r.description?.slice(0, 60) || undefined,
                        path: `/incidents`,
                    }));
                }
                if (reminders.status === 'fulfilled' && reminders.value.data) {
                    reminders.value.data.forEach(r => all.push({
                        id: r.id, category: 'Emlékeztetők', label: r.title,
                        subtitle: r.due_at ? new Date(r.due_at).toLocaleDateString('hu-HU') : undefined,
                        path: `/reminders`,
                    }));
                }
                if (calendarEvents.status === 'fulfilled') {
                    const lowerQ = q.toLowerCase();
                    (calendarEvents.value as Array<{ id?: string; title?: string; start?: string | Date }>)
                        .filter(e => e.title?.toLowerCase().includes(lowerQ))
                        .slice(0, 5)
                        .forEach(e => all.push({
                            id: String(e.id ?? Math.random()),
                            category: 'Naptár',
                            label: e.title ?? '',
                            subtitle: e.start ? new Date(e.start).toLocaleDateString('hu-HU') : undefined,
                            path: `/calendar`,
                        }));
                }

                setResults(all);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Keresési hiba');
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query]);

    return { results, isLoading, error };
}
