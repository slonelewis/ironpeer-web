/**
 * create-verification-session.js
 *
 * Server-side endpoint that creates a Stripe Identity VerificationSession.
 * Renters must complete identity verification (gov ID + selfie) before
 * their first booking checkout can proceed.
 *
 * POST /api/create-verification-session
 * Body: {} (no body required)
 * Returns: { clientSecret, sessionId }
 *
 * Stripe test mode notes:
 *   - Use test document number: 000000000 (nine zeros)
 *   - For selfie, use a photo of a real person (or Stripe's test image)
 *   - See: https://stripe.com/docs/identity/verify-identity-documents#test-verification
 *   - Test verification statuses can be triggered by specific document numbers:
 *     000000000 → verified, 111111111 → processing, 222222222 → unverified/failed
 */

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Lazy-init the Stripe client so the module still loads in test envs without the key
let _stripe = null;
const getStripe = () => {
  if (_stripe) return _stripe;
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY env var is not set');
  }
  _stripe = Stripe(STRIPE_SECRET_KEY);
  return _stripe;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error('[create-verification-session] Stripe init error:', e.message);
    return res.status(500).json({ error: e.message });
  }

  try {
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          allowed_types: ['driving_license', 'id_card', 'passport'],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    });

    res.status(200).json({
      clientSecret: verificationSession.client_secret,
      sessionId: verificationSession.id,
    });
  } catch (e) {
    console.error('[create-verification-session] Stripe API error:', e.message);
    res.status(500).json({ error: e.message || 'Failed to create verification session' });
  }
};
