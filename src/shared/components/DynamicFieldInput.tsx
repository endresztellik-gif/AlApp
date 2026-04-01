import { useRef, useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { DatePickerField } from './DatePickerField';

interface DynamicFieldInputProps {
    schema: {
        id: string;
        field_name: string;
        field_key: string;
        field_type: string;
        is_required: boolean;
        select_options?: string | string[] | null;
    };
    value: string | number | null;
    onChange: (value: string) => void;
    error?: string;
}

export function DynamicFieldInput({ schema, value, onChange, error }: DynamicFieldInputProps) {
    const [multiselectOpen, setMultiselectOpen] = useState(false);
    const multiselectRef = useRef<HTMLDivElement>(null);

    const baseInputClasses = `w-full rounded-lg border bg-bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${error ? 'border-status-critical focus:border-status-critical' : 'border-input focus:border-primary-500'
        }`;

    const renderInput = () => {
        switch (schema.field_type) {
            case 'text':
            case 'number':
                return (
                    <input
                        type={schema.field_type}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseInputClasses}
                        placeholder={schema.field_name}
                        required={schema.is_required}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`${baseInputClasses} min-h-[100px] resize-y`}
                        placeholder={schema.field_name}
                        required={schema.is_required}
                        maxLength={500}
                    />
                );

            case 'date':
                return (
                    <DatePickerField
                        value={value?.toString() || ''}
                        onChange={onChange}
                        required={schema.is_required}
                        startYear={new Date().getFullYear() - 80}
                        endYear={new Date().getFullYear()}
                    />
                );
            case 'date_expiry':
                return (
                    <DatePickerField
                        value={value?.toString() || ''}
                        onChange={onChange}
                        required={schema.is_required}
                        startYear={new Date().getFullYear() - 2}
                        endYear={new Date().getFullYear() + 20}
                    />
                );

            case 'multiselect': {
                let options: string[] = [];
                try {
                    if (typeof schema.select_options === 'string') {
                        options = JSON.parse(schema.select_options);
                    } else if (Array.isArray(schema.select_options)) {
                        options = schema.select_options;
                    }
                } catch (e) {
                    console.error("Failed to parse multiselect options", e);
                }

                const selected: string[] = value
                    ? String(value).split(',').map((s) => s.trim()).filter(Boolean)
                    : [];

                const toggleOption = (opt: string) => {
                    const next = selected.includes(opt)
                        ? selected.filter((s) => s !== opt)
                        : [...selected, opt];
                    onChange(next.join(','));
                };

                const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
                    if (!multiselectRef.current?.contains(e.relatedTarget as Node)) {
                        setMultiselectOpen(false);
                    }
                };

                return (
                    <div className="relative" ref={multiselectRef} onBlur={handleBlur}>
                        <button
                            type="button"
                            onClick={() => setMultiselectOpen((o) => !o)}
                            className={`${baseInputClasses} flex items-center justify-between text-left`}
                        >
                            <span className={selected.length === 0 ? 'text-muted-foreground' : ''}>
                                {selected.length === 0
                                    ? 'Válassz kategóriát...'
                                    : selected.join(', ')}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${multiselectOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {multiselectOpen && (
                            <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-bg-card shadow-lg p-2">
                                <div className="grid grid-cols-3 gap-1">
                                    {options.map((opt) => {
                                        const checked = selected.includes(opt);
                                        return (
                                            <label
                                                key={opt}
                                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm select-none transition-colors ${checked ? 'bg-primary-500/10 text-primary-700 font-medium' : 'hover:bg-muted/40'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleOption(opt)}
                                                    className="accent-primary-500 w-3.5 h-3.5"
                                                    tabIndex={-1}
                                                />
                                                {opt}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            case 'select': {
                let options: string[] = [];
                try {
                    if (typeof schema.select_options === 'string') {
                        options = JSON.parse(schema.select_options);
                    } else if (Array.isArray(schema.select_options)) {
                        options = schema.select_options;
                    }
                } catch (e) {
                    console.error("Failed to parse select options", e);
                }

                return (
                    <div className="relative">
                        <select
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className={`${baseInputClasses} appearance-none`}
                            required={schema.is_required}
                        >
                            <option value="">Válassz...</option>
                            {options.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {/* Chevron icon could be added here absolutely positioned like date icon */}
                    </div>
                );
            }
            case 'file':
                return (
                    <div className="relative">
                        {/* Needs a specialized file uploader. For now, simple text as placeholder or ignore */}
                        <div className="text-xs text-muted-foreground p-2 border border-dashed rounded bg-muted/20">
                            Fájlfeltöltés az adatlapon érhető el mentés után.
                        </div>
                    </div>
                )

            default:
                return <span className="text-red-500 text-xs">Ismeretlen mezőtípus: {schema.field_type}</span>;
        }
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                {schema.field_name}
                {schema.is_required && <span className="text-status-critical">*</span>}
            </label>
            {renderInput()}
            {error && (
                <div className="flex items-center gap-1 text-xs text-status-critical">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
