import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, Calendar, User, ArrowRight } from 'lucide-react';
import { useIncidents, Incident } from '../hooks/useIncidents';
import { IncidentForm } from '../components/IncidentForm';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

function IncidentSkeleton() {
    return (
        <div className="space-y-4 animate-fade-in">
            {[1, 2, 3].map(i => (
                <div key={i} className="skeleton rounded-2xl h-36" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
        </div>
    )
}

export function IncidentsPage() {
    const { incidents, isLoading, create } = useIncidents();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSave = async (data: any) => {
        await create(data);
    };

    return (
        <div className="space-y-5 max-w-5xl mx-auto">

            {/* ── Oldal fejléc ── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #C97A3B, #D4914A)', boxShadow: '0 3px 10px -2px rgba(180,90,30,0.35)' }}>
                        <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                            Káresemények
                        </h1>
                        <p className="text-[12.5px] text-muted-foreground">
                            {isLoading ? 'Betöltés…' : `${incidents?.length || 0} bejelentett káresemény`}
                        </p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ y: -1, boxShadow: '0 6px 16px -4px rgba(180,90,30,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-all self-start sm:self-auto"
                    style={{ background: 'linear-gradient(135deg, #C97A3B, #D4914A)', boxShadow: '0 3px 10px -2px rgba(180,90,30,0.30)' }}
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Káresemény bejelentése
                </motion.button>
            </motion.div>

            {/* ── Tartalom ── */}
            {isLoading ? (
                <IncidentSkeleton />
            ) : !incidents || incidents.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
                    style={{
                        background: 'var(--color-bg-card)',
                        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                    }}
                >
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4"
                    >
                        <AlertTriangle className="w-8 h-8 text-primary-300" />
                    </motion.div>
                    <h3 className="text-[15px] font-semibold text-text-primary mb-1">Nincs nyitott káresemény</h3>
                    <p className="text-[13px] text-muted-foreground max-w-xs">
                        Jelenleg minden eszköz és jármű hibátlanul üzemel.
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {incidents.map((incident: Incident, i: number) => (
                        <motion.div
                            key={incident.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-2xl overflow-hidden relative"
                            style={{
                                background: 'var(--color-bg-card)',
                                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                            }}
                        >
                            {/* Bal oldali színcsík */}
                            <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                                style={{ background: 'linear-gradient(to bottom, #C97A3B, #D4914A60)' }} />

                            <div className="p-5 pl-6">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-[15px] font-bold text-text-primary leading-tight">
                                                    {incident.entity?.display_name || 'Ismeretlen eszköz'}
                                                </h3>
                                                <p className="text-[12px] text-muted-foreground mt-0.5">
                                                    {incident.entity?.entity_type?.name}
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                                                style={{ background: 'rgba(201,120,59,0.10)', color: 'var(--color-status-urgent)', border: '1px solid rgba(201,120,59,0.20)' }}>
                                                Nyitott
                                            </span>
                                        </div>

                                        <p className="text-[13px] text-text-secondary leading-relaxed p-3 rounded-xl"
                                            style={{ background: 'rgba(240,245,241,0.6)', border: '1px solid rgba(90,110,95,0.10)' }}>
                                            {incident.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {format(new Date(incident.created_at), "yyyy. MMM d. HH:mm", { locale: hu })}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" />
                                                {incident.reporter?.full_name || 'Ismeretlen'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center sm:self-center">
                                        <motion.button
                                            whileHover={{ x: 2 }}
                                            className="text-[12.5px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                                        >
                                            Részletek <ArrowRight className="w-3.5 h-3.5" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isCreateOpen && (
                    <IncidentForm
                        isOpen={isCreateOpen}
                        onSave={handleSave}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
