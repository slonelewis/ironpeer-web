/**
 * stripe-identity-webhook.js
 *
 * Handles Stripe Identity webhook events to update Sharetribe user metadata
 * when identity verification completes or fails.
 *
 * POST /api/stripe-identity-webhook
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY            — Stripe secret key (used to init Stripe client)
 *   STRIPE_IDENTITY_WEBHOOK_SECRET — Webhook signing secret from Stripe dashboard
 *                                    (set this in Railway after registering the webhook)
 *   SHARETRIBE_INTEGRATION_CLIENT_ID     — Integration API client ID
 *   SHARETRIBE_INTEGRATION_CLIENT_SECRET — Integration API client secret
 *
 * Handled events:
 *   identity.verification_session.verified
 *     → sets user metadata: { identityVerified: true, identityVerifiedAt: <ISO timestamp> }
 *   identity.verification_session.requires_input
 *     → logs the failure; user will need to retry on next checkout attempt
 *
 * Webhook registration:
 *   In Stripe Dashboard → Developers → Webhooks, add endpoint:
 *     https://ironpeer.com/api/stripe-identity-webhook
 *   Events to send:
 *     identity.verification_session.verified
 *     identity.verification_session.requires_input
 *
 * Test mode notes:
 *   - The webhook secret differs between test and live modes
 *   - Use Stripe CLI to forward webhooks locally:
 *     stripe listen --forward-to localhost:3500/api/stripe-identity-webhook
 *   - The CLI prints a webhook signing secret — set that as STRIPE_IDENTITY_WEBHOOK_SECRET
 */

const Stripe = require('stripe');
const integrationSdk = require('sharetribe-flex-integration-sdk');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;

const INTEGRATION_CLIENT_ID =
  process.env.SHARETRIBE_INTEGRATION_CLIENT_ID || 'a2c14eb1-28ec-4218-856c-2dbd49889ffd';
const INTEGRATION_CLIENT_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;

// Lazy singletons
let _stripe = null;
const getStripe = () => {
  if (_stripe) return _stripe;
  if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY env var is not set');
  _stripe = Stripe(STRIPE_SECRET_KEY);
  return _stripe;
};

let _integrationSdk = null;
const getIntegrationSdk = () => {
  if (_integrationSdk) return _integrationSdk;
  if (!INTEGRATION_CLIENT_SECRET) {
    throw new Error('SHARETRIBE_INTEGRATION_CLIENT_SECRET env var is not set');
  }
  _integrationSdk = integrationSdk.createInstance({
    clientId: INTEGRATION_CLIENT_ID,
    clientSecret: INTEGRATION_CLIENT_SECRET,
  });
  return _integrationSdk;
};

// Update Sharetribe user metadata via the Integration API.
// userId is a Sharetribe UUID string.
const updateUserIdentityMetadata = async (userId, metadata) => {
  const sdk = getIntegrationSdk();
  return sdk.users.updateProfile(
    { id: userId },
    { metadata }
  );
};

// The webhook handler must receive the raw request body as a Buffer for
// signature verification. Express's body-parser must NOT parse this route
// before it reaches here — apiRouter registers a rawBody middleware just for
// this endpoint (see apiRouter.js).
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error('[stripe-identity-webhook] Stripe init error:', e.message);
    return res.status(500).json({ error: e.message });
  }

  // Verify webhook signature
  const sig = req.headers['stripe-signature'];
  let event;

  if (WEBHOOK_SECRET) {
    try {
      // req.rawBody is set by the rawBodySaver middleware in apiRouter.js
      const rawBody = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error('[stripe-identity-webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }
  } else {
    // No webhook secret configured — skip verification (dev/testing only)
    console.warn('[stripe-identity-webhook] STRIPE_IDENTITY_WEBHOOK_SECRET not set; skipping signature verification');
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const session = event?.data?.object;

  if (event.type === 'identity.verification_session.verified') {
    // The verification session is verified.
    // The metadata field on the session holds the user ID we stored when creating the session.
    // NOTE: For now we rely on the `metadata.userId` field stored on the VerificationSession.
    // The create-verification-session endpoint should be updated to pass userId once the user
    // is known at session creation time (requires auth middleware). See TODO below.
    const userId = session?.metadata?.userId;

    if (!userId) {
      // If no userId in session metadata, we can't update the user.
      // Log the session ID so it can be looked up manually if needed.
      console.warn(
        '[stripe-identity-webhook] verified event received but no userId in session metadata.',
        'sessionId:', session?.id
      );
      return res.status(200).json({ received: true, warning: 'No userId in session metadata' });
    }

    try {
      await updateUserIdentityMetadata(userId, {
        identityVerified: true,
        identityVerifiedAt: new Date().toISOString(),
      });
      console.log('[stripe-identity-webhook] Identity verified for user:', userId);
      return res.status(200).json({ received: true });
    } catch (e) {
      console.error('[stripe-identity-webhook] Failed to update user metadata:', e);
      return res.status(500).json({ error: 'Failed to update user metadata' });
    }
  } else if (event.type === 'identity.verification_session.requires_input') {
    // Verification failed or requires additional input from the user.
    // Log the reason so it can be investigated; the user will be prompted to retry.
    const lastError = session?.last_error;
    console.warn(
      '[stripe-identity-webhook] Verification requires input for session:', session?.id,
      '| reason:', lastError?.code,
      '| message:', lastError?.reason
    );
    return res.status(200).json({ received: true });
  } else {
    // Unexpected event type — acknowledge receipt to avoid retries
    console.log('[stripe-identity-webhook] Unhandled event type:', event.type);
    return res.status(200).json({ received: true });
  }
};
