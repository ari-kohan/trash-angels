// // Import from Deno standard library
// import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// interface TrashLocation {
//   id: string;
//   latitude: number;
//   longitude: number;
//   created_at: string;
//   status: string;
//   description?: string;
// }

// interface PushNotificationPayload {
//   to: string[];
//   title: string;
//   body: string;
//   data?: Record<string, unknown>;
// }

// interface RequestPayload {
//   trash: TrashLocation;
//   userTokens: string[];
// }

// serve(async (req: Request) => {
//   try {
//     // Create a Supabase client with the service role key
//     const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
//     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
//     const _supabase = createClient(supabaseUrl, supabaseKey);

//     // Parse the request body
//     const { trash, userTokens } = await req.json() as RequestPayload;

//     // Validate the input
//     if (!trash || !userTokens || !Array.isArray(userTokens) || userTokens.length === 0) {
//       return new Response(
//         JSON.stringify({ 
//           error: 'Invalid request. Required fields: trash (object) and userTokens (array)' 
//         }),
//         { status: 400, headers: { 'Content-Type': 'application/json' } }
//       );
//     }

//     // Prepare the notification payload
//     const notification: PushNotificationPayload = {
//       to: userTokens,
//       title: 'Trash Nearby!',
//       body: `There's trash that needs to be picked up nearby. Be an angel and help clean up!`,
//       data: { trash },
//     };

//     // Send the push notification using Expo's push notification service
//     const response = await fetch('https://exp.host/--/api/v2/push/send', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(notification),
//     });

//     const result = await response.json();

//     if (!response.ok) {
//       throw new Error(`Failed to send push notification: ${JSON.stringify(result)}`);
//     }

//     return new Response(
//       JSON.stringify({ success: true, result }),
//       { status: 200, headers: { 'Content-Type': 'application/json' } }
//     );
//   } catch (error: unknown) {
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
//     return new Response(
//       JSON.stringify({ error: errorMessage }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// });

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Expo } from 'npm:expo-server-sdk';
