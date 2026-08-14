import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY?.trim() || '';
const SERVICE_WORKER_URL = `${process.env.PUBLIC_URL || ''}/sw.js`;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const supportsPushNotifications = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    window.isSecureContext
  );
};

const ensureServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  }

  return registration;
};

export const hasActivePushSubscription = async (): Promise<boolean> => {
  if (!supportsPushNotifications()) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return false;
  }

  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
};

export type PushSupportState = 'supported' | 'unsupported' | 'insecure';

export const getPushSupportState = (): PushSupportState => {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }

  if (!window.isSecureContext) {
    return 'insecure';
  }

  return supportsPushNotifications() ? 'supported' : 'unsupported';
};

export const getPushPermissionState = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  return Notification.permission;
};

const upsertSubscription = async (userId: string, subscription: PushSubscription) => {
  const json = subscription.toJSON();
  const endpoint = json.endpoint || subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return;
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      enabled: true,
      user_agent: navigator.userAgent,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );

  if (error?.code === '42P01') {
    console.warn(
      'Table push_subscriptions is missing. Apply footbet-server/supabase/schema.sql or patch_existing_db.sql first.',
    );
    return;
  }

  if (error) {
    throw new Error(error.message);
  }
};

export const syncPushSubscription = async (userId: string): Promise<void> => {
  if (!userId || !supportsPushNotifications()) {
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('REACT_APP_VAPID_PUBLIC_KEY is not set. Push subscription is skipped.');
    return;
  }

  const registration = await ensureServiceWorkerRegistration();
  if (!registration) {
    return;
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await upsertSubscription(userId, subscription);
};

export const enablePushSubscription = async (userId: string): Promise<void> => {
  await syncPushSubscription(userId);
};

export const clearPushSubscription = async (): Promise<void> => {
  if (!supportsPushNotifications()) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return;
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const endpoint = subscription.endpoint;

  try {
    await subscription.unsubscribe();
  } catch {
    // Continue to best-effort cleanup on backend.
  }

  // Best effort: this delete can fail after sign-out because of RLS, which is acceptable.
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
};
