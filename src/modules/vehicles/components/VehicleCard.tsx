import { motion } from 'framer-motion';
import {
    Truck, Edit, Trash2, Shield, Calendar, AlertCircle, ChevronRight
} from 'lucide-react';
import { Vehicle } from '../hooks/useVehicles';
import { useNavigate } from 'react-router-dom';

interface VehicleCardProps {
    vehicle: Vehicle;
    onEdit?: (vehicle: Vehicle) => void;
    onDelete?: (id: string) => void;
}

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

import { ValidityStatusBadge } from '@/shared/components/ValidityStatusBadge';

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
    const navigate = useNavigate();
    const getValue = (key: string) => vehicle.field_values?.[key];

    // Helper to check if a key is a date type that needs the badge
    // We treat 'inspection_expiry' and 'registration_expiry' as tracked dates
    const isTrackedDate = (key: string) => ['inspection_expiry', 'registration_expiry'].includes(key);

    const infoItems = [
        getValue('license_plate') && getValue('license_plate') !== vehicle.display_name
            ? { icon: null, value: getValue('license_plate'), key: 'license_plate', isPlate: true }
            : null,
        getValue('registration_expiry')
            ? { icon: Calendar, value: new Date(getValue('registration_expiry')).toLocaleDateString('hu-HU'), key: 'registration_expiry', isPlate: false, rawDate: getValue('registration_expiry') }
            : null,
        getValue('inspection_expiry')
            ? { icon: Calendar, value: new Date(getValue('inspection_expiry')).toLocaleDateString('hu-HU'), key: 'inspection_expiry', isPlate: false, rawDate: getValue('inspection_expiry') }
            : null,
        getValue('status')
            ? { icon: AlertCircle, value: getValue('status'), key: 'status', isPlate: false }
            : null,
    ].filter(Boolean) as Array<{ icon: typeof Calendar | typeof AlertCircle | null; value: string; key: string; isPlate: boolean; rawDate?: string }>;

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
            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
        >
            {/* Állapot csík tetején */}
            <div className={`h-[3px] w-full ${vehicle.is_active ? 'bg-gradient-to-r from-secondary-400/50 to-transparent' : 'bg-gradient-to-r from-status-critical/30 to-transparent'}`} />

            <div className="p-5">
                {/* Fejléc: Ikon + név + akciók */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Jármű ikon konténer */}
                        <motion.div
                            whileHover={{ scale: 1.06 }}
                            className="w-11 h-11 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center flex-shrink-0"
                            style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.20)' }}
                        >
                            <Truck className="w-5 h-5 text-white" strokeWidth={2} />
                        </motion.div>

                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-text-primary truncate leading-tight">
                                {vehicle.display_name}
                            </h3>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">
                                {vehicle.entity_type?.name || 'Jármű'}
                            </p>
                        </div>
                    </div>

                    {/* Akció gombok – hover-re jelennek meg */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 -mr-1">
                        {onEdit && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}
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
                                onClick={(e) => { e.stopPropagation(); onDelete(vehicle.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-status-critical transition-colors"
                                title="Törlés"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-2.5">
                    {infoItems.map((item, index) => (
                        <div key={item.key + index} className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                {item.icon && <item.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                                {!item.icon && <span className="w-3.5 h-3.5 bg-secondary-100 rounded-full flex items-center justify-center text-[8px] font-bold text-secondary-700">R</span>}
                                <span className="truncate">
                                    {item.key === 'license_plate' ? 'Rendszám' :
                                        item.key === 'inspection_expiry' ? 'Műszaki érv.' :
                                            item.key === 'registration_expiry' ? 'Forgalmi érv.' :
                                                item.key === 'status' ? 'Állapot' : item.key}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-medium truncate ${item.isPlate ? 'bg-gray-100 text-gray-700 font-mono px-1.5 py-0.5 rounded text-[12px] border border-gray-200' : 'text-text-primary'}`}>
                                    {item.value}
                                </span>
                                {item.rawDate && isTrackedDate(item.key) && (
                                    <ValidityStatusBadge date={item.rawDate} />
                                )}
                            </div>
                        </div>
                    ))}
                    {infoItems.length === 0 && (
                        <p className="text-[13px] text-muted-foreground italic">Nincsenek adatok</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 flex items-center justify-between border-t"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.5)' }}>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vehicle.is_active ? 'bg-status-ok' : 'bg-status-critical'}`} />
                    <span className="text-[11px] font-semibold text-muted-foreground">
                        {vehicle.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {vehicle.responsible_user && (
                        <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground mr-1">
                            <Shield className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{vehicle.responsible_user.full_name}</span>
                        </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </motion.div>
    );
}
