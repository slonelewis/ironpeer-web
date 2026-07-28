/**
 * rental-protected-data.js
 *
 * Server-side endpoint for saving IronPeer rental-flow data
 * (check-in, check-out, mid-rental issues) to transaction metadata
 * via the Sharetribe Integration API — bypassing the state machine so
 * no custom transitions are required.
 *
 * POST /api/rental-protected-data
 * Body: { txId: string (UUID), metadata: object }
 * Returns: { success: true } or { error: string }
 */

const integrationSdk = require('sharetribe-flex-integration-sdk');

const INTEGRATION_CLIENT_ID =
  process.env.SHARETRIBE_INTEGRATION_CLIENT_ID || 'a2c14eb1-28ec-4218-856c-2dbd49889ffd';
const INTEGRATION_CLIENT_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;

// Cache the sdk instance (credentials are static)
let _sdk = null;
const getIntegrationSdk = () => {
  if (_sdk) return _sdk;
  if (!INTEGRATION_CLIENT_SECRET) {
    throw new Error('SHARETRIBE_INTEGRATION_CLIENT_SECRET env var is not set');
  }
  _sdk = integrationSdk.createInstance({
    clientId: INTEGRATION_CLIENT_ID,
    clientSecret: INTEGRATION_CLIENT_SECRET,
  });
  return _sdk;
};

module.exports = (req, res) => {
  const { txId, metadata } = req.body || {};

  if (!txId) {
    return res.status(400).json({ error: 'txId is required' });
  }
  if (!metadata || typeof metadata !== 'object') {
    return res.status(400).json({ error: 'metadata must be a non-null object' });
  }

  let sdk;
  try {
    sdk = getIntegrationSdk();
  } catch (e) {
    console.error('[rental-protected-data] SDK init error:', e.message);
    return res.status(500).json({ error: e.message });
  }

  sdk.transactions
    .updateMetadata({ id: txId, metadata })
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch(e => {
      console.error('[rental-protected-data] Integration API error:', e);
      const status = e.status || 500;
      const message = e.statusText || e.message || 'Integration API request failed';
      res.status(status).json({ error: message });
    });
};
