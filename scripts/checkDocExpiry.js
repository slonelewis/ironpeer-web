#!/usr/bin/env node
/**
 * checkDocExpiry.js
 *
 * IronPeer document expiration tracking system.
 * Runs daily (via Railway cron) to:
 *   - Check registration and insurance expiration dates on all published listings
 *   - Send warning emails at 60/30/7/1 days before expiry
 *   - Auto-unpublish listings with expired documents
 *   - Log all actions (TODO: replace console.log email stubs with SendGrid)
 *
 * Usage:
 *   node scripts/checkDocExpiry.js
 *
 * Environment variables required:
 *   SHARETRIBE_INTEGRATION_CLIENT_ID   — Integration API client ID
 *   SHARETRIBE_INTEGRATION_CLIENT_SECRET — Integration API client secret
 */

'use strict';

const integrationSdk = require('sharetribe-flex-integration-sdk');

// ─── Config ───────────────────────────────────────────────────────────────────

const CLIENT_ID = process.env.SHARETRIBE_INTEGRATION_CLIENT_ID || '0ad4c3de-8d5e-4fa0-8075-3f6432ef2e93';
const CLIENT_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;

// Warning thresholds in days
const WARNING_DAYS = [60, 30, 7, 1];

// ─── Email stubs ──────────────────────────────────────────────────────────────

/**
 * Send a warning email to an owner.
 * TODO: replace with SendGrid send
 *
 * @param {string} ownerEmail
 * @param {string} ownerName
 * @param {string} listingTitle
 * @param {string} listingId
 * @param {'registration'|'insurance'} docType
 * @param {number} daysRemaining
 */
const sendWarningEmail = (ownerEmail, ownerName, listingTitle, listingId, docType, daysRemaining) => {
  const docLabel = docType === 'registration' ? 'registration' : 'insurance';
  const urgency = daysRemaining <= 7 ? '🚨 URGENT' : daysRemaining <= 30 ? '⚠️ Warning' : '📋 Reminder';

  // TODO: replace with SendGrid send
  console.log(`SEND EMAIL [${urgency}]:
  To: ${ownerEmail} (${ownerName})
  Subject: ${urgency}: Your IronPeer listing ${docLabel} expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}
  Body: Your listing "${listingTitle}" (${listingId}) has a ${docLabel} that expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.
        Please update your ${docLabel} at ironpeer.com/l/${listingId}/edit to keep your listing active.
        If your ${docLabel} expires, your listing will be automatically unpublished.
  `);
};

/**
 * Send an unpublish notification email.
 * TODO: replace with SendGrid send
 */
const sendUnpublishedEmail = (ownerEmail, ownerName, listingTitle, listingId, docType) => {
  const docLabel = docType === 'registration' ? 'registration' : 'insurance';

  // TODO: replace with SendGrid send
  console.log(`SEND EMAIL [🔴 LISTING UNPUBLISHED]:
  To: ${ownerEmail} (${ownerName})
  Subject: Your IronPeer listing has been unpublished — ${docLabel} expired
  Body: Your listing "${listingTitle}" has been automatically unpublished because your ${docLabel} has expired.
        To reactivate your listing, upload a current ${docLabel} at ironpeer.com/l/${listingId}/edit.
  `);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate days between now and an expiry ISO date string.
 * Returns negative if already expired.
 */
const daysUntilExpiry = (isoDateStr) => {
  const now = new Date();
  const expiry = new Date(isoDateStr);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Check whether today is a warning day for the given days remaining.
 */
const isWarningDay = (days) => WARNING_DAYS.includes(days);

// ─── Main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  console.log(`\n[${new Date().toISOString()}] IronPeer doc expiry check starting...\n`);

  // Initialize Integration SDK
  const sdkOptions = { clientId: CLIENT_ID };
  if (CLIENT_SECRET) sdkOptions.clientSecret = CLIENT_SECRET;

  const sdk = integrationSdk.createInstance(sdkOptions);

  // Auth
  try {
    if (CLIENT_SECRET) {
      await sdk.auth.token({ grant_type: 'client_credentials' });
    }
    // If no secret, SDK will try without auth (useful for test environment with permissive settings)
  } catch (authErr) {
    console.error('Auth error:', authErr.message);
    process.exit(1);
  }

  let page = 1;
  let totalProcessed = 0;
  let totalWarnings = 0;
  let totalUnpublished = 0;

  // Paginate through all published listings
  while (true) {
    let response;
    try {
      response = await sdk.listings.query({
        states: ['published'],
        perPage: 100,
        page,
        include: ['author'],
        'fields.listing': ['title', 'state', 'privateData', 'publicData'],
        'fields.user': ['email', 'profile.displayName', 'profile.firstName'],
      });
    } catch (err) {
      console.error(`Error fetching listings page ${page}:`, err.message);
      break;
    }

    const listings = response.data.data;
    if (!listings.length) break;

    const includedUsers = response.data.included?.filter(i => i.type === 'user') || [];
    const userMap = {};
    includedUsers.forEach(u => { userMap[u.id.uuid] = u; });

    for (const listing of listings) {
      const listingId = listing.id.uuid;
      const listingTitle = listing.attributes.title || 'Untitled';
      const privateData = listing.attributes.privateData || {};

      const authorId = listing.relationships?.author?.data?.id?.uuid;
      const author = userMap[authorId];
      const ownerEmail = author?.attributes?.email || `owner-${authorId}@unknown`;
      const ownerName = author?.attributes?.profile?.displayName ||
                        author?.attributes?.profile?.firstName ||
                        'Equipment Owner';

      totalProcessed++;

      // Check registration expiry
      if (privateData.registration?.expiresAt) {
        const days = daysUntilExpiry(privateData.registration.expiresAt);

        if (days <= 0) {
          // Expired — unpublish
          console.log(`AUTO-UNPUBLISHING listing "${listingTitle}" (${listingId}): registration expired ${Math.abs(days)} days ago`);
          try {
            await sdk.listings.close({ id: listing.id });
            console.log(`  ✓ Unpublished successfully`);
            totalUnpublished++;
          } catch (closeErr) {
            console.error(`  ✗ Failed to unpublish: ${closeErr.message}`);
          }
          sendUnpublishedEmail(ownerEmail, ownerName, listingTitle, listingId, 'registration');
        } else if (isWarningDay(days)) {
          sendWarningEmail(ownerEmail, ownerName, listingTitle, listingId, 'registration', days);
          totalWarnings++;
        } else {
          console.log(`  OK — Registration for "${listingTitle}": ${days} days remaining`);
        }
      }

      // Check insurance expiry (only if owner submitted insurance)
      if (privateData.insurance?.expiresAt) {
        const days = daysUntilExpiry(privateData.insurance.expiresAt);

        if (days <= 0) {
          // Insurance expired — check if listing is still published before unpublishing
          if (listing.attributes.state === 'published') {
            console.log(`AUTO-UNPUBLISHING listing "${listingTitle}" (${listingId}): insurance expired ${Math.abs(days)} days ago`);
            try {
              await sdk.listings.close({ id: listing.id });
              console.log(`  ✓ Unpublished successfully`);
              totalUnpublished++;
            } catch (closeErr) {
              console.error(`  ✗ Failed to unpublish: ${closeErr.message}`);
            }
            sendUnpublishedEmail(ownerEmail, ownerName, listingTitle, listingId, 'insurance');
          }
        } else if (isWarningDay(days)) {
          sendWarningEmail(ownerEmail, ownerName, listingTitle, listingId, 'insurance', days);
          totalWarnings++;
        } else {
          console.log(`  OK — Insurance for "${listingTitle}": ${days} days remaining`);
        }
      }
    }

    // Check if there are more pages
    const meta = response.data.meta;
    if (!meta || page >= meta.totalPages) break;
    page++;
  }

  console.log(`\n[${new Date().toISOString()}] Doc expiry check complete.`);
  console.log(`  Listings checked: ${totalProcessed}`);
  console.log(`  Warnings sent:    ${totalWarnings}`);
  console.log(`  Auto-unpublished: ${totalUnpublished}\n`);
};

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
