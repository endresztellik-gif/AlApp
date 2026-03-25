import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Car, Wrench, AlertTriangle, Bell, Calendar, X } from 'lucide-react';
import { useGlobalSearch, type SearchCategory, type SearchResult } from '@/shared/hooks/useGlobalSearch';

interface Props {
    open: boolean;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<SearchCategory, React.ReactNode> = {
    'Személyek':    <Users className="w-3.5 h-3.5" />,
    'Járművek':     <Car className="w-3.5 h-3.5" />,
    'Eszközök':     <Wrench className="w-3.5 h-3.5" />,
    'Káresemények': <AlertTriangle className="w-3.5 h-3.5" />,
    'Emlékeztetők': <Bell className="w-3.5 h-3.5" />,
    'Naptár':       <Calendar className="w-3.5 h-3.5" />,
};

const CATEGORY_ORDER: SearchCategory[] = ['Személyek', 'Járművek', 'Eszközök', 'Káresemények', 'Emlékeztetők', 'Naptár'];

export function GlobalSearchModal({ open, onClose }: Props) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { results, isLoading } = useGlobalSearch(query);

    // Escape to close
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    // Focus input when opens
    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Reset active index on results change
    useEffect(() => { setActiveIndex(0); }, [results]);

    const groupedResults = CATEGORY_ORDER
        .map(cat => ({ cat, items: results.filter(r => r.category === cat) }))
        .filter(g => g.items.length > 0);

    const flatResults: SearchResult[] = groupedResults.flatMap(g => g.items);

    const navigate_to = useCallback((result: SearchResult) => {
        onClose();
        navigate(result.path);
    }, [navigate, onClose]);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatResults.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && flatResults[activeIndex]) { navigate_to(flatResults[activeIndex]); }
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                            {/* Input sor */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Keresés mindenhol…"
                                    className="flex-1 text-[14px] text-text-primary bg-transparent outline-none placeholder-gray-400"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                )}
                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-[10px] text-gray-500 font-medium">
                                    ESC
                                </kbd>
                            </div>

                            {/* Eredmények */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {query.trim().length < 2 ? (
                                    <div className="px-4 py-8 text-center text-[13px] text-gray-400">
                                        Írj be legalább 2 karaktert a kereséshez
                                    </div>
                                ) : isLoading ? (
                                    <div className="px-4 py-8 text-center text-[13px] text-gray-400">Keresés…</div>
                                ) : groupedResults.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-[13px] text-gray-400">
                                        Nincs találat: <span className="font-medium text-text-primary">"{query}"</span>
                                    </div>
                                ) : (
                                    groupedResults.map(({ cat, items }) => {
                                        return (
                                            <div key={cat}>
                                                {/* Kategória cím */}
                                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                    <span className="text-gray-400">{CATEGORY_ICONS[cat]}</span>
                                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
                                                </div>
                                                {/* Találatok */}
                                                {items.map(result => {
                                                    const globalIdx = flatResults.indexOf(result);
                                                    const isActive = globalIdx === activeIndex;
                                                    return (
                                                        <button
                                                            key={result.id}
                                                            onClick={() => navigate_to(result)}
                                                            onMouseEnter={() => setActiveIndex(globalIdx)}
                                                            className={`w-full text-left px-4 py-2.5 transition-colors border-b border-gray-50 last:border-0 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <p className="text-[13px] font-medium text-text-primary">{result.label}</p>
                                                            {result.subtitle && (
                                                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{result.subtitle}</p>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {flatResults.length > 0 && (
                                <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-[11px] text-gray-400">
                                    <span><kbd className="font-medium">↑↓</kbd> navigálás</span>
                                    <span><kbd className="font-medium">↵</kbd> megnyitás</span>
                                    <span><kbd className="font-medium">ESC</kbd> bezárás</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
