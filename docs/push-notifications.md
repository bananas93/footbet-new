# Push Notifications Setup

## 1. Create VAPID keys

Use any web-push VAPID generator and keep the private key secret.

Required values:

- Public key for frontend: REACT_APP_VAPID_PUBLIC_KEY
- Private key for backend sender: VAPID_PRIVATE_KEY
- Subject email/URL for sender: VAPID_SUBJECT

## 2. Frontend env vars

Add to your frontend env files (.env and/or .env.develop):

REACT_APP_VAPID_PUBLIC_KEY=YOUR_PUBLIC_VAPID_KEY

The app will:

- Ask notification permission for authenticated users
- Create a push subscription through service worker
- Save subscription in public.push_subscriptions

## 3. Create DB table and policies

Run SQL from:

supabase/sql/push_subscriptions.sql

## 4. Server-side push sender (required)

Web push must be sent from backend. Example Node script:

```js
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

async function sendPushToUser(userId, payload) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .eq('user_id', userId);

  if (error) throw error;

  await Promise.all(
    (data || []).map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }),
  );
}
```

Suggested payload shape:

```json
{
  "title": "Footbet",
  "body": "Матч оновлено",
  "url": "/tournament/1",
  "icon": "/web-app-manifest-192x192.png",
  "badge": "/favicon-96x96.png"
}
```

## 5. Test checklist

- Deployed over HTTPS
- Service worker is active
- Notification permission is granted
- Row appears in public.push_subscriptions after login
- Sending backend push shows a system notification
- Notification click opens relevant page
