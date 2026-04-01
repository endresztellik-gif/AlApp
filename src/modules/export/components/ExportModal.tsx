
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { X, FileSpreadsheet, Download, Loader2, Check } from 'lucide-react';
import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabase';
import { useEntityTypesAdmin } from '@/modules/admin/hooks/useFieldSchemasAdmin';
import { ModuleType } from '@/shared/types';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MODULES: { id: ModuleType; label: string }[] = [
    { id: 'personnel', label: 'Személyek' },
    { id: 'vehicles', label: 'Járművek' },
    { id: 'equipment', label: 'Eszközök' },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
    const { entityTypes } = useEntityTypesAdmin();

    // State
    const [selectedModules, setSelectedModules] = useState<Set<ModuleType>>(new Set(['personnel']));
    const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set()); // If empty, all types for checked modules
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [isExporting, setIsExporting] = useState(false);

    // Filtered types based on selected modules
    const availableTypes = entityTypes.filter(t => selectedModules.has(t.module));

    const toggleModule = (mod: ModuleType) => {
        const next = new Set(selectedModules);
        if (next.has(mod)) {
            next.delete(mod);
            // Remove types associated with this module
            const moduleTypeIds = entityTypes.filter(t => t.module === mod).map(t => t.id);
            setSelectedTypeIds(prev => {
                const nextTypes = new Set(prev);
                moduleTypeIds.forEach(id => nextTypes.delete(id));
                return nextTypes;
            });
        } else {
            next.add(mod);
        }
        setSelectedModules(next);
    };

    const toggleType = (typeId: string) => {
        const next = new Set(selectedTypeIds);
        if (next.has(typeId)) {
            next.delete(typeId);
        } else {
            next.add(typeId);
        }
        setSelectedTypeIds(next);
    };

    const handleExport = async () => {
        if (selectedModules.size === 0) return;
        setIsExporting(true);

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'AlApp';
            workbook.created = new Date();

            const TABLE_MAP: Record<ModuleType, string> = {
                personnel: 'personnel',
                vehicles: 'vehicles',
                equipment: 'equipment',
            };

            let totalSheets = 0;

            for (const mod of selectedModules) {
                // 1. Fetch records
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let query = (supabase.from(TABLE_MAP[mod]) as any)
                    .select(`*, entity_type:entity_types(id, name), responsible:user_profiles(full_name)`);

                const moduleSpecificTypeIds = Array.from(selectedTypeIds).filter(id => {
                    const t = entityTypes.find(et => et.id === id);
                    return t?.module === mod;
                });
                if (moduleSpecificTypeIds.length > 0) {
                    query = query.in('entity_type_id', moduleSpecificTypeIds);
                }

                const { data: records, error } = await query;
                if (error) throw error;
                if (!records || records.length === 0) continue;

                // 2. Fetch field schemas
                const entityTypeIds = [...new Set<string>(records.map((r: { entity_type_id: string }) => r.entity_type_id))];
                const { data: schemas } = await supabase
                    .from('field_schemas')
                    .select('entity_type_id, field_key, field_name')
                    .in('entity_type_id', entityTypeIds)
                    .order('display_order');

                // 3. Flatten records
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const flattenedData = records.map((record: any) => {
                    const row: Record<string, unknown> = {
                        'Azonosító': record.id,
                        'Név': record.display_name,
                        'Típus': record.entity_type?.name ?? '',
                        'Felelős': record.responsible?.full_name ?? '',
                        'Státusz': record.is_active ? 'Aktív' : 'Inaktív',
                        'Létrehozva': new Date(record.created_at).toLocaleDateString('hu-HU'),
                    };
                    const typeSchemas = schemas?.filter(s => s.entity_type_id === record.entity_type_id) ?? [];
                    typeSchemas.forEach(schema => {
                        row[schema.field_name] = record.field_values?.[schema.field_key] ?? '';
                    });
                    return row;
                });

                // 4. Create worksheet
                const sheetName = MODULES.find(m => m.id === mod)?.label || mod;
                const worksheet = workbook.addWorksheet(sheetName);

                // Columns from all keys
                const allKeys = [...new Set(flattenedData.flatMap((r: Record<string, unknown>) => Object.keys(r)))];
                worksheet.columns = allKeys.map(key => ({ header: key as string, key: key as string, width: 18 }));

                // Add data rows
                worksheet.addRows(flattenedData);

                // Style header row
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C482C' } };
                headerRow.alignment = { vertical: 'middle' };
                headerRow.height = 20;

                // Auto-fit column widths
                worksheet.columns.forEach(col => {
                    let maxLen = String(col.header ?? '').length;
                    col.eachCell?.({ includeEmpty: false }, cell => {
                        const len = cell.value ? String(cell.value).length : 0;
                        if (len > maxLen) maxLen = len;
                    });
                    col.width = Math.min(Math.max(maxLen + 2, 10), 50);
                });

                // Freeze header row
                worksheet.views = [{ state: 'frozen', ySplit: 1 }];

                totalSheets++;
            }

            if (totalSheets === 0) {
                toast.error('Nincs exportálható adat a kiválasztott modulokban.');
                return;
            }

            // 5. Download
            const filename = `AlApp_Export_${new Date().toISOString().split('T')[0]}`;

            if (format === 'xlsx') {
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // CSV: each sheet as separate file, or combine all into one
                for (const sheet of workbook.worksheets) {
                    const buffer = await workbook.csv.writeBuffer({ sheetName: sheet.name });
                    const blob = new Blob(['\uFEFF' + buffer], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filename}_${sheet.name}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }

            onClose();

        } catch (error) {
            console.error('Export error:', error);
            toast.error('Hiba történt az exportálás során.');
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Adatok Exportálása</h2>
                            <p className="text-xs text-muted-foreground">Válaszd ki az exportálni kívánt adatokat</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Modul választó */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground block">Modulok kiválasztása</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {MODULES.map(mod => (
                                <label key={mod.id} className={`
                                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                    ${selectedModules.has(mod.id)
                                        ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500/20'
                                        : 'border-border hover:bg-muted/50'}
                                `}>
                                    <div className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                        ${selectedModules.has(mod.id) ? 'bg-primary-500 border-primary-500' : 'border-muted-foreground/30 bg-bg-card'}
                                    `}>
                                        {selectedModules.has(mod.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedModules.has(mod.id)}
                                        onChange={() => toggleModule(mod.id)}
                                    />
                                    <span className="text-sm font-medium">{mod.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Típus szűrő (csak ha van modul választva) */}
                    {selectedModules.size > 0 && availableTypes.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <label className="text-sm font-semibold text-foreground flex justify-between">
                                Részletes szűrés (Típusok)
                                <span className="text-xs font-normal text-muted-foreground">Opcionális, üresen hagyva minden típus exportálódik</span>
                            </label>
                            <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {availableTypes.map(type => (
                                    <label key={type.id} className="flex items-center gap-2 group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-input text-primary-500 focus:ring-primary-500"
                                            checked={selectedTypeIds.has(type.id)}
                                            onChange={() => toggleType(type.id)}
                                        />
                                        <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                                            {MODULES.find(m => m.id === type.module)?.label}: <strong>{type.name}</strong>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Formátum */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        <label className="text-sm font-semibold text-foreground block">Formátum</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="format"
                                    value="xlsx"
                                    checked={format === 'xlsx'}
                                    onChange={() => setFormat('xlsx')}
                                    className="text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium">Excel (.xlsx)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="format"
                                    value="csv"
                                    checked={format === 'csv'}
                                    onChange={() => setFormat('csv')}
                                    className="text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium">CSV (.csv)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-border/50 bg-muted/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Mégse
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || selectedModules.size === 0}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exportálás indítása
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
