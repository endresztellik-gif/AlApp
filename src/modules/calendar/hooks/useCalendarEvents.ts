import { useQuery } from '@tanstack/react-query';
import { googleCalendar } from '@/core/api/google-services';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: string;
    description?: string;
    location?: string;
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

// Google Calendar date-only strings (YYYY-MM-DD) must be parsed as LOCAL time,
// not UTC – otherwise in CET/CEST (UTC+1/+2) they shift back by 1-2 hours
// and land on the previous calendar day.
function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function useCalendarEvents(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);

    const { data: events = [], isLoading, error, refetch } = useQuery<CalendarEvent[]>({
        queryKey: ['calendar-events', start.toISOString(), end.toISOString()],
        queryFn: async () => {
            const data = await googleCalendar.getEvents(start, end);
            return (data || []).map((e: Record<string, unknown>) => {
                const startStr = e.start as string;
                const endStr = e.end as string;

                // All-day events have date-only strings (no "T"); timed events have ISO dateTime.
                const isAllDay = !startStr.includes('T');

                const startDate = isAllDay ? parseLocalDate(startStr) : new Date(startStr);

                let endDate = isAllDay ? parseLocalDate(endStr) : new Date(endStr);
                // Google Calendar returns exclusive end dates for all-day events
                // (e.g. a single April 1 event has end.date = "2026-04-02").
                // Subtract 1 day to get the actual last day (inclusive).
                if (isAllDay) {
                    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 1);
                }

                return {
                    ...e,
                    start: startDate,
                    end: endDate,
                    allDay: isAllDay,
                    resource: categorizeEvent(e as { title?: string; resource?: string }),
                };
            }) as CalendarEvent[];
        },
    });

    return { events, isLoading, error, refetch };
}
