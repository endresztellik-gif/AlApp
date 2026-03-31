import { useState, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DatePickerFieldProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  /** Legkorábbi választható év (alapértelmezett: aktuális év - 80) */
  startYear?: number;
  /** Legkésőbbi választható év (alapértelmezett: aktuális év + 20) */
  endYear?: number;
}

export function DatePickerField({
  value,
  onChange,
  required,
  className = '',
  startYear,
  endYear,
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const resolvedStartYear = startYear ?? currentYear - 80;
  const resolvedEndYear = endYear ?? currentYear + 20;

  const selectedDate = value
    ? parse(value, 'yyyy-MM-dd', new Date())
    : undefined;

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popupHeight = 400;
      if (spaceBelow < popupHeight) {
        setPopupStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left });
      } else {
        setPopupStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left });
      }
    }
    setIsOpen(prev => !prev);
  };

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setIsOpen(false);
    }
  };

  const displayValue = value
    ? format(selectedDate!, 'yyyy. MM. dd.', { locale: hu })
    : '';

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={handleToggle}
          placeholder="Válasszon dátumot"
          required={required}
          readOnly
          className="w-full rounded-lg border border-input bg-bg-card px-3 py-2 pr-10 text-sm cursor-pointer focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
        />
        <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Dropdown calendar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar popup – fixed so it escapes scrollable containers */}
          <div className="z-[101] bg-bg-card rounded-xl shadow-xl border border-border p-3" style={popupStyle}>
            <style>{`
              .rdp-custom .rdp-month_caption {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding-bottom: 8px;
              }
              .rdp-custom select.rdp-dropdown {
                appearance: none;
                -webkit-appearance: none;
                background: var(--color-bg-card);
                border: 1px solid rgba(90,110,95,0.2);
                border-radius: 8px;
                padding: 4px 24px 4px 8px;
                font-size: 13px;
                font-weight: 600;
                font-family: 'Outfit', system-ui, sans-serif;
                color: var(--color-text-primary);
                cursor: pointer;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23849088' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 7px center;
                transition: border-color 0.15s ease, box-shadow 0.15s ease;
              }
              .rdp-custom select.rdp-dropdown:focus {
                outline: none;
                border-color: var(--color-primary-400);
                box-shadow: 0 0 0 3px rgba(58,139,76,0.15);
              }
              .rdp-custom select.rdp-dropdown:hover {
                border-color: var(--color-primary-300);
              }
              .rdp-custom .rdp-nav {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              .rdp-custom .rdp-button_previous,
              .rdp-custom .rdp-button_next {
                width: 28px;
                height: 28px;
                border-radius: 7px;
                border: 1px solid rgba(90,110,95,0.15);
                background: var(--color-bg-card);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--color-text-muted);
                transition: all 0.15s ease;
              }
              .rdp-custom .rdp-button_previous:hover,
              .rdp-custom .rdp-button_next:hover {
                background: var(--color-primary-50);
                border-color: var(--color-primary-200);
                color: var(--color-primary-600);
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              locale={hu}
              captionLayout="dropdown"
              startMonth={new Date(resolvedStartYear, 0)}
              endMonth={new Date(resolvedEndYear, 11)}
              className="rdp-custom"
            />
          </div>
        </>
      )}
    </div>
  );
}
