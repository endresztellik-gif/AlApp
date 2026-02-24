import { useState } from 'react';
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
}

export function DatePickerField({
  value,
  onChange,
  required,
  className = ''
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = value
    ? parse(value, 'yyyy-MM-dd', new Date())
    : undefined;

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
    <div className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={() => setIsOpen(!isOpen)}
          placeholder="Válasszon dátumot"
          required={required}
          readOnly
          className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm cursor-pointer focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
        />
        <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Dropdown calendar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar popup */}
          <div className="absolute z-50 mt-2 bg-card rounded-xl shadow-xl border border-border p-3">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              locale={hu}
              className="rdp-custom"
            />
          </div>
        </>
      )}
    </div>
  );
}
