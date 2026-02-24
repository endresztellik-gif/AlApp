import { AlertCircle } from 'lucide-react';
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
    const baseInputClasses = `w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${error ? 'border-status-critical focus:border-status-critical' : 'border-input focus:border-primary-500'
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
            case 'date_expiry':
                return (
                    <DatePickerField
                        value={value?.toString() || ''}
                        onChange={onChange}
                        required={schema.is_required}
                    />
                );

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
