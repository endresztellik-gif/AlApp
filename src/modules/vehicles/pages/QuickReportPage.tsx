import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Car, ChevronLeft, ShieldAlert } from 'lucide-react';
import { BiWeeklyChecklistModal } from '@/shared/components/BiWeeklyChecklistModal';
import { motion } from 'framer-motion';

export function QuickReportPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState<{ id: string, name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(true);

    useEffect(() => {
        const fetchVehicle = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from('entities')
                .select('id, display_name')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error("Vehicle not found", error);
                setError(true);
            } else {
                setVehicle({ id: data.id, name: data.display_name });
            }
            setLoading(false);
        };

        fetchVehicle();
    }, [id]);

    const handleSuccess = () => {
        setIsModalOpen(false);
        // Maybe redirect to a "Thank You" screen or Dashboard
        setTimeout(() => navigate('/'), 1500);
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><p className="text-muted-foreground">Betöltés...</p></div>;
    }

    if (error || !vehicle) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-red-100 flex flex-col items-center text-center max-w-sm">
                    <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                    <h1 className="text-xl font-bold text-text-primary mb-2">Hiba történt</h1>
                    <p className="text-text-secondary text-sm mb-6">A keresett jármű nem található, vagy érvénytelen QR kódot olvastál be.</p>
                    <button onClick={() => navigate('/')} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                        Vissza a főoldalra
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Minimal Mobile Header */}
            <header className="bg-white px-4 py-4 flex items-center gap-3 border-b border-border shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">Gyors Bejelentés</h1>
                    <p className="text-xs font-semibold text-primary-600 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" /> {vehicle.name}
                    </p>
                </div>
            </header>

            <main className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                {!isModalOpen ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-border w-full max-w-sm">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Köszönjük!</h2>
                        <p className="text-sm text-slate-500">Az állapotjelentés sikeresen rögzítve lett.</p>
                    </motion.div>
                ) : null}

                {isModalOpen && (
                    <p className="text-sm text-muted-foreground mt-4 mb-8">Kérjük, töltsd ki az ellenőrzőlistát az alkalmazás felugró ablakában.</p>
                )}
            </main>

            {/* Render exactly the same modal used on Desktop Dashboard */}
            <BiWeeklyChecklistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vehicleId={vehicle.id}
                vehicleName={vehicle.name}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
