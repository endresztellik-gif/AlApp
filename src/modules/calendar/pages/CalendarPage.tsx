import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, startOfDay, endOfDay, areIntervalsOverlapping } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { RefreshCw, CalendarDays } from 'lucide-react';

const locales = {
    'hu': hu,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export function CalendarPage() {
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const { events, isLoading, refetch } = useCalendarEvents(date);

    const vacationEvents = events.filter(e => e.resource === 'vacation');

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 h-full flex flex-col max-w-7xl mx-auto"
        >
            {/* ── Fejléc ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm"
                        style={{ boxShadow: '0 3px 10px -2px rgba(35,86,52,0.35)' }}>
                        <CalendarDays className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                            Szabadság-naptár
                        </h1>
                        <p className="text-[12.5px] text-muted-foreground">
                            Kollégák szabadságainak és események áttekintése
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl transition-colors text-muted-foreground hover:text-text-primary"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(90,110,95,0.15)' }}
                    title="Frissítés"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </motion.button>
            </div>

            {/* ── Naptár kártya ── */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 rounded-2xl overflow-hidden min-h-[580px]"
                style={{
                    background: 'var(--color-bg-card)',
                    boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                }}
            >
                <style>{`
                    .rbc-calendar {
                        font-family: 'Outfit', system-ui, sans-serif;
                        font-size: 13px;
                    }
                    .rbc-header {
                        padding: 8px 6px;
                        font-weight: 600;
                        font-size: 11.5px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: var(--color-text-muted);
                        border-bottom-color: rgba(90,110,95,0.12);
                    }
                    .rbc-month-view, .rbc-time-view {
                        border-color: rgba(90,110,95,0.12);
                        border-radius: 1rem;
                        overflow: hidden;
                    }
                    .rbc-day-bg + .rbc-day-bg {
                        border-left-color: rgba(90,110,95,0.08);
                    }
                    .rbc-month-row + .rbc-month-row {
                        border-top-color: rgba(90,110,95,0.08);
                    }
                    .rbc-toolbar {
                        padding: 14px 20px 12px;
                        background: rgba(240,245,241,0.5);
                        border-bottom: 1px solid rgba(90,110,95,0.10);
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .rbc-toolbar .rbc-toolbar-label {
                        font-size: 15px;
                        font-weight: 700;
                        color: var(--color-text-primary);
                    }
                    .rbc-toolbar button {
                        color: var(--color-text-secondary);
                        font-family: 'Outfit', system-ui;
                        font-size: 12.5px;
                        font-weight: 500;
                        border-radius: 8px;
                        border: 1px solid rgba(90,110,95,0.18);
                        padding: 5px 12px;
                        background: var(--color-bg-card);
                        transition: all 0.15s ease;
                    }
                    .rbc-toolbar button:hover {
                        background: var(--color-primary-50);
                        color: var(--color-primary-700);
                        border-color: rgba(35,86,52,0.25);
                    }
                    .rbc-toolbar button:active,
                    .rbc-toolbar button.rbc-active {
                        background: var(--color-primary-100);
                        color: var(--color-primary-700);
                        border-color: rgba(35,86,52,0.30);
                        box-shadow: none;
                    }
                    .rbc-today {
                        background-color: rgba(35,86,52,0.04);
                    }
                    .rbc-off-range-bg {
                        background-color: rgba(240,245,241,0.4);
                    }
                    .rbc-date-cell {
                        padding: 4px 8px;
                        font-size: 12px;
                        color: var(--color-text-secondary);
                    }
                    .rbc-date-cell.rbc-now {
                        font-weight: 700;
                        color: var(--color-primary-700);
                    }
                    .rbc-event {
                        border-radius: 5px;
                        border: none;
                        font-size: 11.5px;
                        font-weight: 500;
                        padding: 2px 6px;
                    }
                    .rbc-event:focus {
                        outline: 2px solid rgba(35,86,52,0.4);
                    }
                    .rbc-show-more {
                        font-size: 11px;
                        font-weight: 600;
                        color: var(--color-primary-600);
                    }
                    .rbc-agenda-view table.rbc-agenda-table {
                        border-color: rgba(90,110,95,0.12);
                        font-size: 13px;
                    }
                    .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
                        border-bottom-color: rgba(90,110,95,0.12);
                        color: var(--color-text-muted);
                        font-size: 11.5px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                        border-top-color: rgba(90,110,95,0.08);
                        color: var(--color-text-primary);
                    }
                    .rbc-agenda-empty {
                        color: var(--color-text-muted);
                        font-style: italic;
                        font-size: 13px;
                    }
                `}</style>

                <div className="p-5 h-full">
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '560px' }}
                        views={['month', 'week', 'agenda']}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        culture='hu'
                        messages={{
                            today: 'Ma',
                            previous: '‹',
                            next: '›',
                            month: 'Hónap',
                            week: 'Hét',
                            day: 'Nap',
                            agenda: 'Lista',
                            date: 'Dátum',
                            time: 'Idő',
                            event: 'Esemény',
                            noEventsInRange: 'Nincs esemény ebben az időszakban.'
                        }}
                        eventPropGetter={(event) => {
                            let backgroundColor = 'var(--color-primary-500)';

                            if (event.resource === 'vacation') {
                                backgroundColor = '#4A90D9';
                            } else if (event.resource === 'maintenance') {
                                backgroundColor = '#C97A3B';
                            }

                            return {
                                style: {
                                    backgroundColor,
                                    color: 'white',
                                    borderRadius: '5px',
                                    border: 'none',
                                }
                            };
                        }}
                    />
                </div>
            </motion.div>

            {/* ── Szabadság összesítő ── */}
            <div className="grid gap-5 md:grid-cols-2">
                {/* Ma szabadságon */}
                <LeaveSummaryCard
                    title="Ma szabadságon"
                    date={new Date()}
                    events={vacationEvents}
                    emptyText="-"
                />

                {/* Holnap szabadságon */}
                <LeaveSummaryCard
                    title="Holnap szabadságon"
                    date={addDays(new Date(), 1)}
                    events={vacationEvents}
                    emptyText="-"
                />
            </div>
        </motion.div>
    );
}

function LeaveSummaryCard({ title, date, events, emptyText }: { title: string, date: Date, events: { title: string; start: Date; end: Date; resource?: string }[], emptyText: string }) {
    // Filter events that overlap with the specific date
    const targetStart = startOfDay(date);
    const targetEnd = endOfDay(date);

    const onLeave = events.filter(event => {
        return areIntervalsOverlapping(
            { start: event.start, end: event.end },
            { start: targetStart, end: targetEnd }
        );
    });

    const formatName = (title: string) => {
        // Try to remove "Szabadság - " or similar prefixes
        const match = title.match(/^(?:szabadság|pihenő|holiday)\s*[-–:]\s*(.*)$/i);
        return match ? match[1] : title;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'var(--color-bg-card)',
                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
            }}
        >
            <div className="px-5 py-3.5 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.4)' }}>
                <div className="flex items-center gap-2">
                    <h2 className="text-[13.5px] font-semibold text-text-primary">{title}</h2>
                    <span className="text-[11px] text-muted-foreground font-medium">
                        {format(date, 'MMM. d.', { locale: hu })}
                    </span>
                </div>
                {onLeave.length > 0 && (
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                        {onLeave.length} fő
                    </span>
                )}
            </div>
            <div className="p-4">
                {onLeave.length === 0 ? (
                    <div className="flex items-center justify-center h-12">
                        <span className="text-xl font-medium text-muted-foreground/40">{emptyText}</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {onLeave.map((event, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/20 border border-border/40">
                                <div className="w-1.5 h-8 rounded-full bg-[#4A90D9]" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-text-primary truncate">
                                        {formatName(event.title)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
