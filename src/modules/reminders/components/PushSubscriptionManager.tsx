import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth/useAuth';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscriptionManager() {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!('Notification' in window)) return;
        setPermission(Notification.permission);

        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY || !user) return;
        setLoading(true);

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                toast.error('Push értesítés nem engedélyezett');
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert(
                    { user_id: user.id, subscription: sub.toJSON() },
                    { onConflict: 'user_id' }
                );

            if (error) throw error;

            setIsSubscribed(true);
            toast.success('Push értesítések bekapcsolva');
        } catch (err) {
            console.error('Push subscription error:', err);
            toast.error('Nem sikerült bekapcsolni a push értesítéseket');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();

            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id);

            setIsSubscribed(false);
            toast.success('Push értesítések kikapcsolva');
        } catch (err) {
            console.error('Unsubscribe error:', err);
            toast.error('Hiba a kiiratkozásnál');
        } finally {
            setLoading(false);
        }
    };

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return null;
    }

    return (
        <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading || permission === 'denied'}
            title={
                permission === 'denied'
                    ? 'Push értesítés letiltva a böngészőben'
                    : isSubscribed
                    ? 'Push értesítések kikapcsolása'
                    : 'Push értesítések bekapcsolása'
            }
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-medium border transition-all disabled:opacity-40"
            style={
                isSubscribed
                    ? { background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }
                    : { background: '#fafafa', color: '#6b7280', borderColor: '#e5e7eb' }
            }
        >
            {isSubscribed ? (
                <Bell className="w-3.5 h-3.5" />
            ) : (
                <BellOff className="w-3.5 h-3.5" />
            )}
            {loading ? '…' : isSubscribed ? 'Push: BE' : 'Push: KI'}
        </button>
    );
}
