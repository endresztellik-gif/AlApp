import { differenceInCalendarDays } from 'date-fns';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface ValidityStatusBadgeProps {
    date: string | Date;
    className?: string;
}

export function ValidityStatusBadge({ date, className = '' }: ValidityStatusBadgeProps) {
    const targetDate = new Date(date);
    const today = new Date();
    const daysRemaining = differenceInCalendarDays(targetDate, today);

    // Ha több mint 90 nap van hátra, nem jelenítünk meg semmit
    if (daysRemaining > 90) return null;

    let colorClass = '';
    let icon = null;
    let label = '';

    if (daysRemaining < 0) {
        // Lejárt - Fekete/Szürke
        colorClass = 'bg-gray-100 text-gray-700 border-gray-300';
        icon = <AlertCircle className="w-3 h-3" />;
        label = `${daysRemaining} nap`; // Pl. -5 nap
    } else if (daysRemaining <= 30) {
        // Kritikus - Piros
        colorClass = 'bg-red-50 text-red-700 border-red-200';
        icon = <AlertTriangle className="w-3 h-3" />;
        label = `${daysRemaining} nap`;
    } else {
        // Figyelmeztetés - Narancs (30-90 nap)
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        icon = <Clock className="w-3 h-3" />;
        label = `${daysRemaining} nap`;
    }

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${colorClass} ${className}`}>
            {icon}
            <span>{label}</span>
        </div>
    );
}
