import { motion } from 'framer-motion';
import {
    Phone, Mail, MapPin, Calendar,
    Edit, Trash2, Shield, ChevronRight,
} from 'lucide-react';
import { Personnel } from '../hooks/usePersonnel';
import { useNavigate } from 'react-router-dom';

interface PersonnelCardProps {
    person: Personnel;
    onEdit?: (person: Personnel) => void;
    onDelete?: (id: string) => void;
}

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

/* Monogram háttérszín az initiálból */
function avatarColor(name: string) {
    const palette = [
        { from: 'from-primary-400', to: 'to-primary-600' },
        { from: 'from-secondary-400', to: 'to-secondary-600' },
        { from: 'from-accent-dark', to: 'to-accent-base' },
        { from: 'from-primary-300', to: 'to-primary-500' },
    ]
    return palette[name.charCodeAt(0) % palette.length]
}

export function PersonnelCard({ person, onEdit, onDelete }: PersonnelCardProps) {
    const navigate = useNavigate();
    const getValue = (key: string) => person.field_values?.[key];
    const color = avatarColor(person.display_name)

    const infoItems = [
        { icon: Phone,    value: getValue('phone'),      key: 'phone' },
        { icon: Mail,     value: getValue('email'),      key: 'email' },
        { icon: Calendar, value: getValue('birth_date')
            ? new Date(getValue('birth_date')).toLocaleDateString('hu-HU')
            : null,                                     key: 'birth_date' },
        { icon: MapPin,   value: getValue('birth_place'), key: 'birth_place' },
    ].filter(i => i.value)

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
            onClick={() => navigate(`/personnel/${person.id}`)}
        >
            {/* Állapot csík tetején */}
            <div className={`h-[3px] w-full ${person.is_active ? 'bg-gradient-to-r from-primary-400/40 to-transparent' : 'bg-gradient-to-r from-status-critical/30 to-transparent'}`} />

            <div className="p-5">
                {/* Fejléc: Avatar + név + akciók */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Monogram avatar */}
                        <motion.div
                            whileHover={{ scale: 1.06 }}
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center text-white text-[17px] font-bold flex-shrink-0`}
                            style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.20)' }}
                        >
                            {person.display_name.charAt(0).toUpperCase()}
                        </motion.div>

                        <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-text-primary truncate leading-tight">
                                {person.display_name}
                            </h3>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">
                                {person.entity_type?.name || 'Kolléga'}
                            </p>
                        </div>
                    </div>

                    {/* Akció gombok – hover-re jelennek meg */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 -mr-1">
                        {onEdit && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={(e) => { e.stopPropagation(); onEdit(person); }}
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
                                onClick={(e) => { e.stopPropagation(); onDelete(person.id); }}
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
                        {infoItems.slice(0, 3).map(({ icon: Icon, value, key }) => (
                            <div key={key} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                <Icon className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" strokeWidth={1.8} />
                                <span className="truncate">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 flex items-center justify-between border-t"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.5)' }}>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${person.is_active ? 'bg-status-ok' : 'bg-status-critical'}`} />
                    <span className="text-[11px] font-semibold text-muted-foreground">
                        {person.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {person.responsible_user && (
                        <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground mr-1">
                            <Shield className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{person.responsible_user.full_name}</span>
                        </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </motion.div>
    );
}
