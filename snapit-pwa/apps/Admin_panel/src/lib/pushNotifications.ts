import { supabase } from './supabase';

export const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrqLHJWSqdnuOBuoXA4';

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      return registration;
    } catch (err) {
      console.error('ServiceWorker registration failed: ', err);
      return null;
    }
  }
  return null;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    return null;
  }
}

export async function saveSubscriptionToSupabase(subscription: PushSubscription) {
  const subJSON = subscription.toJSON();
  if (!subJSON.keys || !subJSON.endpoint) return false;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
        user_agent: navigator.userAgent
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('Error saving subscription to Supabase:', error);
    return false;
  }

  return true;
}

export async function unsubscribeFromPush(registration: ServiceWorkerRegistration) {
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

export async function requestNotificationPermissionAndSubscribe() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await registerServiceWorker();
    if (registration) {
      const subscription = await subscribeToPush(registration);
      if (subscription) {
        return await saveSubscriptionToSupabase(subscription);
      }
    }
  }
  return false;
}
