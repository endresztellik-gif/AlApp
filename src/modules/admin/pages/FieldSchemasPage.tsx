import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Plus, Trash2, Loader2,
    GripVertical, ChevronRight, Users, Car, Wrench,
} from 'lucide-react';
import { useEntityTypesAdmin, useFieldSchemasAdmin } from '../hooks/useFieldSchemasAdmin';

const moduleConfig = {
    personnel: { label: 'Személyek', icon: Users, color: '#3d9e52', bg: 'rgba(61,158,82,0.09)' },
    vehicles: { label: 'Járművek', icon: Car, color: '#5a7a50', bg: 'rgba(90,122,80,0.09)' },
    equipment: { label: 'Eszközök', icon: Wrench, color: '#6b8a5a', bg: 'rgba(107,138,90,0.09)' },
};

const fieldTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
    text:        { label: 'Szöveg',          bg: 'rgba(80,120,200,0.09)',  color: '#4a78c8' },
    number:      { label: 'Szám',            bg: 'rgba(100,80,180,0.09)',  color: '#7a60c0' },
    date:        { label: 'Dátum',           bg: 'rgba(60,130,160,0.09)',  color: '#3c82a0' },
    date_expiry: { label: 'Lejárati dátum',  bg: 'rgba(160,100,40,0.10)', color: '#a06428' },
    select:      { label: 'Választólista',   bg: 'rgba(61,158,82,0.09)',  color: '#3d9e52' },
    file:        { label: 'Fájl',            bg: 'rgba(90,90,120,0.09)',  color: '#5a5a78' },
};

const inputCls = 'w-full rounded-xl px-3 py-2 text-[12.5px] text-text-primary placeholder:text-muted-foreground transition-all';
const inputStyle = {
    background: 'rgba(235,240,236,0.5)',
    border: '1px solid rgba(90,110,95,0.15)',
    outline: 'none',
};
const labelCls = 'text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block';

/**
 * Mezőséma kezelő – entitás típusok és dinamikus mezők admin CRUD-ja.
 */
export function FieldSchemasPage() {
    const { entityTypes, isLoading: typesLoading, create: createType, remove: removeType } = useEntityTypesAdmin();
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const { fields, isLoading: fieldsLoading, create: createField, remove: removeField } = useFieldSchemasAdmin(selectedTypeId);

    const [showNewType, setShowNewType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeModule, setNewTypeModule] = useState<string>('personnel');

    const [showNewField, setShowNewField] = useState(false);
    const [newField, setNewField] = useState({
        field_name: '', field_key: '', field_type: 'text' as string,
        is_required: false, select_options: '',
        alert_days_warning: 90, alert_days_urgent: 30, alert_days_critical: 7,
    });

    const handleCreateType = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        await createType({ name: newTypeName, module: newTypeModule });
        setNewTypeName('');
        setShowNewType(false);
    }, [newTypeName, newTypeModule, createType]);

    const handleCreateField = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTypeId) return;
        const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.display_order)) + 1 : 1;
        await createField({
            entity_type_id: selectedTypeId,
            field_name: newField.field_name,
            field_key: newField.field_key || newField.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            field_type: newField.field_type as 'text' | 'number' | 'date' | 'date_expiry' | 'select' | 'file' | 'textarea',
            is_required: newField.is_required,
            select_options: newField.field_type === 'select' && newField.select_options
                ? JSON.parse(`[${newField.select_options.split(',').map(o => `"${o.trim()}"`).join(',')}]`)
                : null,
            display_order: nextOrder,
            alert_days_warning: newField.alert_days_warning,
            alert_days_urgent: newField.alert_days_urgent,
            alert_days_critical: newField.alert_days_critical,
        });
        setNewField({ field_name: '', field_key: '', field_type: 'text', is_required: false, select_options: '', alert_days_warning: 90, alert_days_urgent: 30, alert_days_critical: 7 });
        setShowNewField(false);
    }, [selectedTypeId, fields, newField, createField]);

    const selectedType = entityTypes.find(t => t.id === selectedTypeId);

    if (typesLoading) {
        return (
            <div className="space-y-3 max-w-6xl mx-auto animate-fade-in">
                <div className="skeleton h-24 rounded-2xl" />
                <div className="grid gap-5 lg:grid-cols-5">
                    <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
                    <div className="lg:col-span-3 skeleton h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-6xl mx-auto">

            {/* ── Header Panel ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between gap-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(35,75,50,0.97) 0%, rgba(50,78,52,0.94) 100%)',
                    boxShadow: '0 6px 28px -6px rgba(25,65,40,0.45), 0 0 0 1px rgba(90,130,80,0.15)',
                }}
            >
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px),
                            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)`,
                    }}
                />
                <div className="absolute -right-16 -top-16 w-56 h-56 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(90,140,80,0.12) 0%, transparent 70%)' }}
                />

                <div className="relative flex items-center gap-4">
                    <motion.div
                        whileHover={{ rotate: 12, scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="p-3 rounded-2xl shrink-0"
                        style={{
                            background: 'rgba(255,255,255,0.10)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
                        }}
                    >
                        <Database className="w-6 h-6 text-white" strokeWidth={1.75} />
                    </motion.div>
                    <div>
                        <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1">
                            Adatmodell konfiguráció
                        </p>
                        <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                            Mezőséma kezelés
                        </h1>
                        <p className="text-[12px] text-white/50 mt-1">
                            Entitás típusok és dinamikus mezők definíciója
                        </p>
                    </div>
                </div>

                <div className="relative flex items-center gap-5 shrink-0">
                    <div className="text-center hidden sm:block">
                        <div className="text-[22px] font-black text-white leading-none">{entityTypes.length}</div>
                        <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">típus</div>
                    </div>
                </div>
            </motion.div>

            {/* ── Two-column layout ── */}
            <div className="grid gap-4 lg:grid-cols-5">

                {/* Left: Entity Types */}
                <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className="lg:col-span-2"
                >
                    <div className="rounded-2xl overflow-hidden" style={{
                        background: 'var(--color-bg-card)',
                        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                    }}>
                        {/* Panel header */}
                        <div className="px-5 py-3.5 border-b flex items-center justify-between"
                            style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.45)' }}>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary-100">
                                    <Database className="w-3.5 h-3.5 text-primary-600" />
                                </div>
                                <h2 className="text-[13px] font-semibold text-text-primary">Entitás típusok</h2>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => setShowNewType(!showNewType)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ background: 'rgba(61,158,82,0.10)', color: '#3d9e52' }}
                                title="Új típus"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </motion.button>
                        </div>

                        {/* New type form */}
                        <AnimatePresence>
                            {showNewType && (
                                <motion.form
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ ease: [0.22, 1, 0.36, 1] }}
                                    onSubmit={handleCreateType}
                                    className="px-4 py-4 border-b space-y-3 overflow-hidden"
                                    style={{ borderColor: 'rgba(90,110,95,0.08)', background: 'rgba(240,245,241,0.40)' }}
                                >
                                    <div>
                                        <label className={labelCls}>Típus neve</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTypeName}
                                            onChange={e => setNewTypeName(e.target.value)}
                                            placeholder="pl. Motorfűrész"
                                            className={inputCls}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Modul</label>
                                        <select
                                            value={newTypeModule}
                                            onChange={e => setNewTypeModule(e.target.value)}
                                            className={inputCls}
                                            style={inputStyle}
                                        >
                                            <option value="personnel">Személyek</option>
                                            <option value="vehicles">Járművek</option>
                                            <option value="equipment">Eszközök</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button type="button" onClick={() => setShowNewType(false)}
                                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-text-primary transition-colors"
                                            style={{ background: 'rgba(90,110,95,0.07)' }}>
                                            Mégse
                                        </button>
                                        <button type="submit"
                                            className="px-3 py-1.5 rounded-lg gradient-primary text-white text-[12px] font-semibold transition-colors">
                                            Létrehozás
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {/* Entity type list grouped by module */}
                        {(['personnel', 'vehicles', 'equipment'] as const).map(mod => {
                            const cfg = moduleConfig[mod];
                            const ModIcon = cfg.icon;
                            const types = entityTypes.filter(t => t.module === mod);
                            if (types.length === 0) return null;
                            return (
                                <div key={mod}>
                                    {/* Module group header */}
                                    <div className="px-4 py-2 flex items-center gap-1.5"
                                        style={{ background: cfg.bg, borderTop: '1px solid rgba(90,110,95,0.07)' }}>
                                        <ModIcon className="w-3 h-3" style={{ color: cfg.color }} />
                                        <p className="text-[9.5px] font-black uppercase tracking-[0.14em]"
                                            style={{ color: cfg.color }}>
                                            {cfg.label}
                                        </p>
                                    </div>
                                    {types.map((type, i) => {
                                        const isSelected = selectedTypeId === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedTypeId(type.id)}
                                                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors group"
                                                style={{
                                                    borderTop: i > 0 ? '1px solid rgba(90,110,95,0.06)' : 'none',
                                                    background: isSelected ? `${cfg.bg}` : 'transparent',
                                                    borderLeft: isSelected ? `3px solid ${cfg.color}` : '3px solid transparent',
                                                }}
                                            >
                                                <span className="text-[13px] font-medium leading-tight truncate"
                                                    style={{ color: isSelected ? cfg.color : 'var(--color-text-primary)' }}>
                                                    {type.name}
                                                </span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {!type.is_active && (
                                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                                            style={{ background: 'rgba(90,110,95,0.08)', color: 'var(--color-text-muted)' }}>
                                                            inaktív
                                                        </span>
                                                    )}
                                                    <ChevronRight className="w-3.5 h-3.5 transition-colors opacity-25 group-hover:opacity-60"
                                                        style={{ color: isSelected ? cfg.color : 'var(--color-text-secondary)' }} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {entityTypes.length === 0 && (
                            <div className="px-5 py-10 text-center">
                                <Database className="w-7 h-7 mx-auto mb-2 opacity-15 text-text-secondary" />
                                <p className="text-[12px] text-muted-foreground italic">Nincsenek entitás típusok.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Right: Fields */}
                <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
                    className="lg:col-span-3"
                >
                    {selectedType ? (
                        <div className="rounded-2xl overflow-hidden" style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}>
                            {/* Panel header */}
                            <div className="px-5 py-3.5 border-b flex items-center justify-between"
                                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.45)' }}>
                                <div>
                                    <h2 className="text-[13.5px] font-semibold text-text-primary">{selectedType.name}</h2>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{fields.length} mező definiálva</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        whileHover={{ y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowNewField(!showNewField)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-white text-[12px] font-semibold"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Új mező
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.93 }}
                                        onClick={() => {
                                            if (confirm('Biztosan törlöd ezt az entitás típust?'))
                                                removeType(selectedType.id).then(() => setSelectedTypeId(null));
                                        }}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ background: 'rgba(184,60,60,0.08)', color: '#b83c3c' }}
                                        title="Típus törlése"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* New field form */}
                            <AnimatePresence>
                                {showNewField && (
                                    <motion.form
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ ease: [0.22, 1, 0.36, 1] }}
                                        onSubmit={handleCreateField}
                                        className="px-5 py-4 border-b space-y-3 overflow-hidden"
                                        style={{ borderColor: 'rgba(90,110,95,0.08)', background: 'rgba(240,245,241,0.40)' }}
                                    >
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className={labelCls}>Mező neve</label>
                                                <input
                                                    required
                                                    value={newField.field_name}
                                                    onChange={e => setNewField(p => ({ ...p, field_name: e.target.value }))}
                                                    placeholder="pl. Jogosítvány száma"
                                                    className={inputCls}
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Mező kulcs (angol)</label>
                                                <input
                                                    value={newField.field_key}
                                                    onChange={e => setNewField(p => ({ ...p, field_key: e.target.value }))}
                                                    placeholder="auto-generált"
                                                    className={`${inputCls} font-mono`}
                                                    style={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Típus</label>
                                                <select
                                                    value={newField.field_type}
                                                    onChange={e => setNewField(p => ({ ...p, field_type: e.target.value }))}
                                                    className={inputCls}
                                                    style={inputStyle}
                                                >
                                                    {Object.entries(fieldTypeConfig).map(([k, v]) => (
                                                        <option key={k} value={k}>{v.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-end pb-1">
                                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                    <div
                                                        className="relative w-8 h-4.5 rounded-full transition-colors cursor-pointer"
                                                        style={{
                                                            background: newField.is_required ? '#3d9e52' : 'rgba(90,110,95,0.18)',
                                                        }}
                                                        onClick={() => setNewField(p => ({ ...p, is_required: !p.is_required }))}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={newField.is_required}
                                                            onChange={e => setNewField(p => ({ ...p, is_required: e.target.checked }))}
                                                            className="sr-only"
                                                        />
                                                        <motion.div
                                                            animate={{ x: newField.is_required ? 14 : 2 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                                            className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                                                        />
                                                    </div>
                                                    <span className="text-[12.5px] font-medium text-text-primary">Kötelező mező</span>
                                                </label>
                                            </div>
                                        </div>

                                        {newField.field_type === 'select' && (
                                            <div>
                                                <label className={labelCls}>Opciók (vesszővel elválasztva)</label>
                                                <input
                                                    value={newField.select_options}
                                                    onChange={e => setNewField(p => ({ ...p, select_options: e.target.value }))}
                                                    placeholder="aktív, javításra vár, selejtezett"
                                                    className={inputCls}
                                                    style={inputStyle}
                                                />
                                            </div>
                                        )}

                                        {newField.field_type === 'date_expiry' && (
                                            <div>
                                                <label className={labelCls}>Riasztási küszöbök (napok száma)</label>
                                                <div className="grid gap-3 grid-cols-3">
                                                    {[
                                                        { key: 'alert_days_warning', label: 'Figyelmeztetés', color: '#a07828' },
                                                        { key: 'alert_days_urgent', label: 'Sürgős', color: '#c87820' },
                                                        { key: 'alert_days_critical', label: 'Kritikus', color: '#b83c3c' },
                                                    ].map(({ key, label, color }) => (
                                                        <div key={key}>
                                                            <label className="text-[10px] font-bold uppercase tracking-wide mb-1 block"
                                                                style={{ color }}>
                                                                {label}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={newField[key as keyof typeof newField] as number}
                                                                onChange={e => setNewField(p => ({ ...p, [key]: +e.target.value }))}
                                                                className={inputCls}
                                                                style={{ ...inputStyle, borderColor: `${color}30` }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-1">
                                            <button type="button" onClick={() => setShowNewField(false)}
                                                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-text-primary transition-colors"
                                                style={{ background: 'rgba(90,110,95,0.07)' }}>
                                                Mégse
                                            </button>
                                            <button type="submit"
                                                className="px-3 py-1.5 rounded-lg gradient-primary text-white text-[12px] font-semibold transition-colors">
                                                Mező létrehozása
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Fields list */}
                            {fieldsLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                </div>
                            ) : fields.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <div className="w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
                                        style={{ background: 'rgba(90,110,95,0.07)' }}>
                                        <Database className="w-4 h-4 text-muted-foreground opacity-40" />
                                    </div>
                                    <p className="text-[12.5px] text-muted-foreground italic">
                                        Még nincsenek mezők definiálva ehhez a típushoz.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {fields.map((field, i) => {
                                        const typeCfg = fieldTypeConfig[field.field_type] ?? fieldTypeConfig.text;
                                        return (
                                            <motion.div
                                                key={field.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.015] transition-colors group"
                                                style={{ borderTop: i > 0 ? '1px solid rgba(90,110,95,0.07)' : 'none' }}
                                            >
                                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-20 shrink-0 cursor-grab" />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-[13px] font-semibold text-text-primary leading-tight">
                                                            {field.field_name}
                                                            {field.is_required && (
                                                                <span className="ml-1 text-[#b83c3c]">*</span>
                                                            )}
                                                        </p>
                                                        <span
                                                            className="text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                                                            style={{ background: typeCfg.bg, color: typeCfg.color }}
                                                        >
                                                            {typeCfg.label}
                                                        </span>
                                                        {field.field_type === 'date_expiry' && (
                                                            <span className="text-[9.5px] font-mono text-muted-foreground"
                                                                title="Figyelmeztetés / Sürgős / Kritikus napok">
                                                                ⏰ {field.alert_days_warning}/{field.alert_days_urgent}/{field.alert_days_critical}d
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10.5px] font-mono text-muted-foreground mt-0.5">
                                                        {field.field_key}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    style={{ background: 'rgba(184,60,60,0.07)', color: '#b83c3c' }}
                                                    title="Mező törlése"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-2xl flex items-center justify-center py-20 h-full"
                            style={{
                                background: 'var(--color-bg-card)',
                                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                            }}
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                    style={{ background: 'rgba(90,110,95,0.07)' }}>
                                    <Database className="w-5 h-5 text-muted-foreground opacity-30" />
                                </div>
                                <p className="text-[13px] text-muted-foreground">
                                    Válassz egy entitás típust a mezők szerkesztéséhez
                                </p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
