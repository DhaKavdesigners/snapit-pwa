import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { requestNotificationPermissionAndSubscribe } from '../../lib/pushNotifications';

export const PushNotificationToggle: React.FC = () => {
  const [notifStatus, setNotifStatus] = useState<'unsupported' | 'denied' | 'default' | 'granted' | 'loading'>('unsupported');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifStatus('unsupported');
      return;
    }

    const checkSubscription = async () => {
      if (Notification.permission === 'denied') {
        setNotifStatus('denied');
        return;
      }

      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setNotifStatus('granted');
            return;
          }
        }
      }

      setNotifStatus(Notification.permission as 'default' | 'denied' | 'granted');
    };

    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    setNotifStatus('loading');
    const success = await requestNotificationPermissionAndSubscribe();
    if (success) {
      setNotifStatus('granted');
      alert('✅ Push notifications enabled!');
    } else {
      setNotifStatus(Notification.permission as 'default' | 'denied');
    }
  };

  if (notifStatus === 'unsupported') return null;

  if (notifStatus === 'granted') {
    return (
      <button 
        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 transition-all cursor-default"
        title="Notifications ON"
      >
        <Bell className="w-4 h-4 fill-emerald-600" />
      </button>
    );
  }

  if (notifStatus === 'denied') {
    return (
      <button 
        className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 transition-all cursor-not-allowed"
        title="Blocked in browser settings"
      >
        <BellOff className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={notifStatus === 'loading'}
      title="Enable Notifications"
      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-all cursor-pointer border border-amber-300 disabled:opacity-50"
    >
      {notifStatus === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
    </button>
  );
};
