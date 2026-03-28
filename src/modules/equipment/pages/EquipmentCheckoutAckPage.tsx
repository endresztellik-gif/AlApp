import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function EquipmentCheckoutAckPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const response = searchParams.get('r'); // 'yes' | 'no'

    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
    const [equipmentName, setEquipmentName] = useState('');
    const [returned, setReturned] = useState(false);

    useEffect(() => {
        if (!id || (response !== 'yes' && response !== 'no')) {
            setStatus('error');
            return;
        }

        const processAck = async () => {
            try {
                // Aktív kölcsönzés keresése ehhez az eszközhöz
                const { data: checkout, error: fetchError } = await supabase
                    .from('equipment_checkouts')
                    .select('id, equipment:equipment(display_name)')
                    .eq('equipment_id', id)
                    .is('returned_at', null)
                    .maybeSingle();

                if (fetchError) throw fetchError;

                if (!checkout) {
                    // Már visszavitték korábban
                    setEquipmentName('az eszköz');
                    setReturned(true);
                    setStatus('done');
                    return;
                }

                const equip = checkout.equipment as unknown as { display_name: string } | null;
                setEquipmentName(equip?.display_name ?? 'az eszköz');

                if (response === 'yes') {
                    // Valódi visszavitel: returned_at beállítása
                    const { error: updateError } = await supabase
                        .from('equipment_checkouts')
                        .update({
                            returned_at: new Date().toISOString(),
                            reminder_ack: 'yes',
                        })
                        .eq('id', checkout.id);

                    if (updateError) throw updateError;
                    setReturned(true);
                } else {
                    // Nála van, csak nyugtázza
                    const { error: updateError } = await supabase
                        .from('equipment_checkouts')
                        .update({ reminder_ack: 'no' })
                        .eq('id', checkout.id);

                    if (updateError) throw updateError;
                    setReturned(false);
                }

                setStatus('done');
            } catch (e) {
                console.error('ACK error:', e);
                setStatus('error');
            }
        };

        processAck();
    }, [id, response]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-sm w-full rounded-3xl p-8 text-center"
                style={{
                    background: 'var(--color-bg-card)',
                    boxShadow: '0 4px 24px rgba(30,50,35,0.10)',
                }}
            >
                {status === 'loading' && (
                    <>
                        <div className="w-12 h-12 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Feldolgozás…</p>
                    </>
                )}

                {status === 'done' && returned && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-status-ok/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-status-ok" />
                        </div>
                        <h2 className="text-[18px] font-bold text-text-primary mb-2">
                            Köszönjük!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            <strong>{equipmentName}</strong> visszavitele rögzítve.
                            Az eszköz újra elérhető a raktárból.
                        </p>
                        <button
                            onClick={() => navigate('/equipment')}
                            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                        >
                            Eszközök megtekintése
                        </button>
                    </>
                )}

                {status === 'done' && !returned && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-secondary-600" />
                        </div>
                        <h2 className="text-[18px] font-bold text-text-primary mb-2">
                            Rendben, köszönjük!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Értjük, hogy <strong>{equipmentName}</strong> még nálad van.
                            Ne felejtsd el visszavinni és a programban lezárni.
                        </p>
                        <button
                            onClick={() => navigate(`/equipment/checkout/${id}`)}
                            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                            style={{ background: 'var(--color-primary-500)' }}
                        >
                            Visszavitel lezárása
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-status-critical" />
                        </div>
                        <h2 className="text-[18px] font-bold text-text-primary mb-2">
                            Hiba történt
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Az érvénytelen vagy már lejárt link. Nyisd meg az alkalmazást a visszavitel lezárásához.
                        </p>
                        <button
                            onClick={() => navigate('/equipment')}
                            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                        >
                            Vissza az alkalmazásba
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
