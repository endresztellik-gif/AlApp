import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle, ArrowLeft, User, Clock, ShieldAlert, PackageCheck, PackageOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/useAuth';
import { useEquipmentCheckout } from '../hooks/useEquipmentCheckout';
import { Equipment } from '../hooks/useEquipment';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

export function EquipmentCheckoutPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: equipment, isLoading: equipLoading } = useQuery({
        queryKey: ['equipment', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('equipment')
                .select('*, entity_type:entity_types(id, name)')
                .eq('id', id!)
                .single();
            if (error) throw error;
            return data as Equipment;
        },
        enabled: !!id,
    });

    const {
        activeCheckout,
        isLoading: checkoutLoading,
        isMyCheckout,
        isAdmin,
        checkout,
        return: returnEquipment,
        adminReturn,
        isCheckingOut,
        isReturning,
    } = useEquipmentCheckout(id!);

    const isLoading = equipLoading || checkoutLoading;

    if (!user) {
        return null; // ProtectedRoute kezeli
    }

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="max-w-sm mx-auto mt-16 text-center p-8 rounded-2xl bg-red-50 border border-red-100">
                <ShieldAlert className="w-10 h-10 text-status-critical mx-auto mb-3" />
                <h2 className="font-bold text-text-primary mb-1">Eszköz nem található</h2>
                <p className="text-sm text-muted-foreground mb-4">Ez a QR kód érvénytelen vagy az eszköz törölve lett.</p>
                <button onClick={() => navigate('/equipment')} className="text-sm text-primary-600 underline">
                    Vissza az eszközökhöz
                </button>
            </div>
        );
    }

    const handleCheckout = async () => {
        try {
            await checkout();
            toast.success(`${equipment.display_name} sikeresen felvéve`);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Nem sikerült felvenni az eszközt');
        }
    };

    const handleReturn = async () => {
        if (!activeCheckout) return;
        try {
            await returnEquipment(activeCheckout.id);
            toast.success(`${equipment.display_name} visszavitve`);
        } catch {
            toast.error('Nem sikerült lezárni a kölcsönzést');
        }
    };

    const handleAdminReturn = async () => {
        if (!activeCheckout) return;
        try {
            await adminReturn(activeCheckout.id);
            toast.success(`Kölcsönzés lezárva (admin)`);
        } catch {
            toast.error('Nem sikerült adminként lezárni');
        }
    };

    const checkedOutSince = activeCheckout
        ? format(new Date(activeCheckout.checked_out_at), 'yyyy. MM. dd. HH:mm', { locale: hu })
        : null;

    return (
        <div className="max-w-sm mx-auto mt-4 px-4">
            {/* Vissza gomb */}
            <button
                onClick={() => navigate('/equipment')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-text-primary mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Eszközök
            </button>

            {/* Eszköz kártya */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden mb-6"
                style={{
                    background: 'var(--color-bg-card)',
                    boxShadow: '0 2px 12px rgba(30,50,35,0.08), 0 0 0 1px rgba(90,110,95,0.10)',
                }}
            >
                {/* Fejléc */}
                <div className="p-5 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-dark to-accent-base flex items-center justify-center flex-shrink-0"
                            style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.20)' }}>
                            <Wrench className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-[17px] font-bold text-text-primary leading-tight">
                                {equipment.display_name}
                            </h1>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                                {equipment.entity_type?.name || 'Eszköz'}
                            </p>
                        </div>
                    </div>

                    {equipment.field_values?.serial_number && (
                        <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md text-text-secondary"
                            style={{ background: 'rgba(90,110,95,0.10)', border: '1px solid rgba(90,110,95,0.18)' }}>
                            {equipment.field_values.serial_number}
                        </span>
                    )}
                </div>

                {/* Státusz sáv */}
                <div className="px-5 py-3 border-t flex items-center gap-2.5"
                    style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.5)' }}>
                    {!activeCheckout ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-status-ok flex-shrink-0" />
                            <span className="text-[12.5px] font-semibold text-status-ok">Szabad – raktárban</span>
                        </>
                    ) : isMyCheckout ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-secondary-400 flex-shrink-0" />
                            <span className="text-[12.5px] font-semibold text-secondary-600">Nálad van</span>
                            <span className="text-[11px] text-muted-foreground ml-auto">{checkedOutSince} óta</span>
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 rounded-full bg-status-critical flex-shrink-0" />
                            <span className="text-[12.5px] font-semibold text-status-critical">Foglalt</span>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Kinél van info (ha más vette fel) */}
            {activeCheckout && !isMyCheckout && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-4 mb-6"
                    style={{ background: 'rgba(201,59,59,0.06)', border: '1px solid rgba(201,59,59,0.15)' }}
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <User className="w-4 h-4 text-status-critical" />
                        <span className="text-[13px] font-semibold text-status-critical">
                            {activeCheckout.user?.full_name || 'Ismeretlen felhasználó'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Felvéve: {checkedOutSince}</span>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground mt-2">
                        A visszavitelért az a személy felelős, aki felvette. Kérd meg, hogy zárja le a programban,
                        vagy fordulj az adminisztrátorhoz.
                    </p>
                </motion.div>
            )}

            {/* Akció gombok */}
            <div className="space-y-3">
                {/* Szabad → Felveszem */}
                {!activeCheckout && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[15px] font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))' }}
                    >
                        <PackageOpen className="w-5 h-5" />
                        {isCheckingOut ? 'Folyamatban…' : 'Felveszem'}
                    </motion.button>
                )}

                {/* Nálam van → Visszaviszem */}
                {activeCheckout && isMyCheckout && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleReturn}
                        disabled={isReturning}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[15px] font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #3D9E52, #2E7040)' }}
                    >
                        <PackageCheck className="w-5 h-5" />
                        {isReturning ? 'Folyamatban…' : 'Visszaviszem'}
                    </motion.button>
                )}

                {/* Admin: bárki kölcsönzését lezárhatja */}
                {activeCheckout && !isMyCheckout && isAdmin && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleAdminReturn}
                        disabled={isReturning}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[15px] font-bold transition-all disabled:opacity-50"
                        style={{
                            background: 'rgba(201,59,59,0.08)',
                            color: '#C93B3B',
                            border: '1.5px solid rgba(201,59,59,0.25)',
                        }}
                    >
                        <ShieldAlert className="w-5 h-5" />
                        {isReturning ? 'Folyamatban…' : 'Admin: Visszavitel lezárása'}
                    </motion.button>
                )}

                {/* Eszköz detail oldal link */}
                <button
                    onClick={() => navigate(`/equipment/${equipment.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] text-muted-foreground hover:text-text-primary transition-colors"
                >
                    <CheckCircle className="w-4 h-4" />
                    Eszköz részletei
                </button>
            </div>
        </div>
    );
}
