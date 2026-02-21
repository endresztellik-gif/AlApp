import { motion } from 'framer-motion';
import {
    Wrench, Edit, Trash2, Shield, AlertCircle, ChevronRight
} from 'lucide-react';
import { Equipment } from '../hooks/useEquipment';
import { useNavigate } from 'react-router-dom';

interface EquipmentCardProps {
    equipment: Equipment;
    onEdit?: (equipment: Equipment) => void;
    onDelete?: (id: string) => void;
}

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

export function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
    const navigate = useNavigate();
    const getValue = (key: string) => equipment.field_values?.[key];

    const infoItems = [
        getValue('serial_number')
            ? { value: getValue('serial_number'), key: 'serial_number', isSerial: true }
            : null,
        getValue('status')
            ? { value: getValue('status'), key: 'status', isSerial: false }
            : null,
    ].filter(Boolean) as Array<{ value: string; key: string; isSerial: boolean }>;

    return (
        <motion.div
            variants={cardVariants}
            layout
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
            className="group relative overflow-hidden rounded-2xl cursor-pointer"
            style={{
                background: 'var(--color-bg-card)',
                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                transition: 'box-shadow 0.22s ease',
            }}
            onClick={() => navigate(`/equipment/${equipment.id}`)}
        >
            {/* Állapot csík tetején */}
            <div className={`h-[3px] w-full ${equipment.is_active ? 'bg-gradient-to-r from-accent-dark/50 to-transparent' : 'bg-gradient-to-r from-status-critical/30 to-transparent'}`} />

            <div className="p-5">
                {/* Fejléc: Ikon + név + akciók */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Eszköz ikon konténer */}
                        <motion.div
                            whileHover={{ scale: 1.06 }}
                            className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-dark to-accent-base flex items-center justify-center flex-shrink-0"
                            style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.20)' }}
                        >
                            <Wrench className="w-5 h-5 text-white" strokeWidth={2} />
                        </motion.div>

                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-text-primary truncate leading-tight">
                                {equipment.display_name}
                            </h3>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">
                                {equipment.entity_type?.name || 'Eszköz'}
                            </p>
                        </div>
                    </div>

                    {/* Akció gombok – hover-re jelennek meg */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 -mr-1">
                        {onEdit && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={(e) => { e.stopPropagation(); onEdit(equipment); }}
                                className="p-1.5 rounded-lg hover:bg-primary-50 text-muted-foreground hover:text-primary-600 transition-colors"
                                title="Szerkesztés"
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                        {onDelete && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(equipment.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-status-critical transition-colors"
                                title="Törlés"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Adatmezők */}
                {infoItems.length > 0 && (
                    <div className="space-y-1.5 mb-1">
                        {infoItems.map(({ value, key, isSerial }) => (
                            <div key={key} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                {isSerial ? (
                                    <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md text-text-secondary"
                                        style={{ background: 'rgba(90,110,95,0.10)', border: '1px solid rgba(90,110,95,0.18)' }}>
                                        {String(value)}
                                    </span>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3.5 h-3.5 text-accent-dark flex-shrink-0" strokeWidth={1.8} />
                                        <span className="truncate">{String(value)}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 flex items-center justify-between border-t"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.5)' }}>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${equipment.is_active ? 'bg-status-ok' : 'bg-status-critical'}`} />
                    <span className="text-[11px] font-semibold text-muted-foreground">
                        {equipment.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {equipment.responsible_user && (
                        <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground mr-1">
                            <Shield className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{equipment.responsible_user.full_name}</span>
                        </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </motion.div>
    );
}
