import { useQuery } from '@tanstack/react-query';
import { googleCalendar } from '@/core/api/google-services';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: string;
}

function categorizeEvent(event: { title?: string; resource?: string }): string | undefined {
    if (event.resource) return event.resource;
    const lowerTitle = (event.title || '').toLowerCase();
    if (
        lowerTitle.includes('szabadság') || lowerTitle.includes('szabi') ||
        lowerTitle.includes('szabadsag') || lowerTitle.includes('holiday') ||
        lowerTitle.includes('pihenő')
    ) {
        return 'vacation';
    }
    if (lowerTitle.includes('karbantartás') || lowerTitle.includes('maintenance')) {
        return 'maintenance';
    }
    return undefined;
}

export function useCalendarEvents(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);

    const { data: events = [], isLoading, error, refetch } = useQuery<CalendarEvent[]>({
        queryKey: ['calendar-events', start.toISOString(), end.toISOString()],
        queryFn: async () => {
            const data = await googleCalendar.getEvents(start, end);
            return (data || []).map((e: Record<string, unknown>) => ({
                ...e,
                start: new Date(e.start as string),
                end: new Date(e.end as string),
                resource: categorizeEvent(e as { title?: string; resource?: string }),
            })) as CalendarEvent[];
        },
    });

    return { events, isLoading, error, refetch };
}
