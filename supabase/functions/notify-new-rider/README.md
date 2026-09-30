# Web Push Notifications - Notify New Rider

This Supabase Edge Function sends a Web Push Notification to all subscribed admins whenever a new rider registers in the system.

## Setup Instructions

1. **Deploy the Function**:
   Run the following command to deploy the function to Supabase:
   ```bash
   npx supabase functions deploy notify-new-rider
   ```

2. **Set up Supabase Database Webhook**:
   Go to your Supabase Dashboard -> Database -> Webhooks.
   Create a new webhook with the following settings:
   - **Name**: Notify Admin on New Rider
   - **Table**: `rider_profiles`
   - **Events**: `INSERT`
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-project.supabase.co/functions/v1/notify-new-rider` (replace `your-project` with your actual project reference ID)
   - **Headers**: Add `Authorization: Bearer [YOUR_ANON_KEY]` or `Content-type: application/json` as required by your project.

3. **Generate Real VAPID Keys**:
   The current code uses test keys. For production, you should generate real VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
   After generating, replace the `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` inside both `supabase/functions/notify-new-rider/index.ts` and `src/lib/pushNotifications.ts`.

4. **Run SQL Migration**:
   Before this will work, ensure you have created the `push_subscriptions` table. Run the SQL migration located at `supabase/migrations/20260929_push_subscriptions.sql` in the Supabase SQL editor or via the Supabase CLI:
   ```bash
   npx supabase db push
   ```
