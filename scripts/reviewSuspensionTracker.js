#!/usr/bin/env node
/**
 * reviewSuspensionTracker.js
 *
 * IronPeer review-based suspension tracking.
 * Runs as a Railway cron job (or called from checkDocExpiry.js).
 *
 * Logic:
 *   1. Fetches all users via Integration API
 *   2. For each user, collects their received reviews
 *   3. Computes rolling average rating and checks for consecutive 1-star reviews
 *   4. WARNING threshold  : avg ≤ 3.8 after 5+ reviews  → publicData.ratingWarning = true
 *   5. SUSPENSION threshold: avg ≤ 3.5 after 10+ reviews OR 3 consecutive 1-star reviews
 *                           → publicData.suspended = true
 *   6. Sends alert via console.log (Railway captures logs)
 *
 * Usage:
 *   node scripts/reviewSuspensionTracker.js
 *
 * Environment variables required:
 *   SHARETRIBE_INTEGRATION_CLIENT_ID     — Integration API client ID
 *   SHARETRIBE_INTEGRATION_CLIENT_SECRET — Integration API client secret
 *
 * TODO: wire alerts to SendGrid/iMessage when email is set up.
 */

'use strict';

const integrationSdk = require('sharetribe-flex-integration-sdk');

// ─── Config ───────────────────────────────────────────────────────────────────

const CLIENT_ID =
  process.env.SHARETRIBE_INTEGRATION_CLIENT_ID || '0ad4c3de-8d5e-4fa0-8075-3f6432ef2e93';
const CLIENT_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;

const WARNING_THRESHOLD = 3.8;
const WARNING_MIN_REVIEWS = 5;
const SUSPENSION_THRESHOLD = 3.5;
const SUSPENSION_MIN_REVIEWS = 10;
const CONSECUTIVE_ONE_STAR_LIMIT = 3;

// ─── Alert helpers ─────────────────────────────────────────────────────────────

/**
 * Send a warning alert for a user with a low average rating.
 * TODO: wire to SendGrid/iMessage when email is set up.
 *
 * @param {string} userId
 * @param {string} displayName
 * @param {string} email
 * @param {number} avg
 * @param {number} reviewCount
 */
const sendWarningAlert = (userId, displayName, email, avg, reviewCount) => {
  // TODO: wire to SendGrid/iMessage when email is set up
  console.log(
    `⚠️  RATING WARNING: User ${displayName} (${email}, id: ${userId}) has a ${avg.toFixed(2)} avg rating after ${reviewCount} reviews`
  );
};

/**
 * Send a suspension alert for a user who crossed the suspension threshold.
 * TODO: wire to SendGrid/iMessage when email is set up.
 *
 * @param {string} userId
 * @param {string} displayName
 * @param {string} email
 * @param {number|null} avg
 * @param {number} reviewCount
 * @param {string} reason
 */
const sendSuspensionAlert = (userId, displayName, email, avg, reviewCount, reason) => {
  // TODO: wire to SendGrid/iMessage when email is set up
  const avgStr = avg !== null ? avg.toFixed(2) : 'N/A';
  console.log(
    `🚫  AUTO-SUSPEND: User ${displayName} (${email}, id: ${userId}) — ${reason} — avg ${avgStr} after ${reviewCount} reviews`
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate the rolling average of an array of ratings.
 *
 * @param {number[]} ratings
 * @returns {number}
 */
const calcAverage = ratings => {
  if (!ratings || ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
};

/**
 * Check whether the last N reviews are all 1-star.
 *
 * @param {number[]} ratings - Chronological (oldest-first) array of ratings
 * @param {number} n - Consecutive count to check
 * @returns {boolean}
 */
const hasConsecutiveOneStars = (ratings, n) => {
  if (ratings.length < n) return false;
  return ratings.slice(-n).every(r => r === 1);
};

/**
 * Fetch all pages of a paginated Integration API call.
 *
 * @param {Function} fetcher - Async function(page) => { data, meta }
 * @returns {Promise<Array>}
 */
const fetchAllPages = async fetcher => {
  const results = [];
  let page = 1;
  while (true) {
    const { data, meta } = await fetcher(page);
    results.push(...data);
    const { totalPages } = meta;
    if (page >= totalPages) break;
    page++;
  }
  return results;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  console.log(
    `\n[${new Date().toISOString()}] IronPeer review suspension tracker starting...\n`
  );

  // Initialize Integration SDK
  const sdkOptions = { clientId: CLIENT_ID };
  if (CLIENT_SECRET) sdkOptions.clientSecret = CLIENT_SECRET;

  const sdk = integrationSdk.createInstance(sdkOptions);

  // Auth
  try {
    if (CLIENT_SECRET) {
      await sdk.auth.token({ grant_type: 'client_credentials' });
    }
  } catch (authErr) {
    console.error('Auth error:', authErr.message);
    process.exit(1);
  }

  let totalUsers = 0;
  let warned = 0;
  let suspended = 0;
  let skipped = 0;

  // ── Step 1: fetch all users ──────────────────────────────────────────────────
  let users;
  try {
    users = await fetchAllPages(async page => {
      const res = await sdk.users.query({
        perPage: 100,
        page,
        include: [],
        'fields.user': ['email', 'profile.displayName', 'profile.publicData'],
      });
      return {
        data: res.data.data,
        meta: res.data.meta,
      };
    });
  } catch (err) {
    console.error('Failed to fetch users:', err.message);
    process.exit(1);
  }

  totalUsers = users.length;
  console.log(`Fetched ${totalUsers} users. Checking reviews...\n`);

  // ── Step 2: for each user, fetch their reviews and compute rating ────────────
  for (const user of users) {
    const userId = user.id.uuid;
    const displayName =
      user.attributes.profile?.displayName ||
      user.attributes.profile?.firstName ||
      userId;
    const email = user.attributes.email || '(no email)';
    const publicData = user.attributes.profile?.publicData || {};

    // Skip already-suspended users to avoid spamming alerts
    if (publicData.suspended === true) {
      skipped++;
      continue;
    }

    // Fetch reviews for this user (as the reviewed subject)
    let reviews;
    try {
      reviews = await fetchAllPages(async page => {
        const res = await sdk.reviews.query({
          subjectId: userId,
          state: 'public',
          perPage: 100,
          page,
          'fields.review': ['rating', 'createdAt'],
        });
        return {
          data: res.data.data,
          meta: res.data.meta,
        };
      });
    } catch (err) {
      console.warn(`  Could not fetch reviews for user ${userId}: ${err.message}`);
      continue;
    }

    if (reviews.length < WARNING_MIN_REVIEWS) {
      // Not enough reviews to evaluate
      continue;
    }

    // Build chronological ratings array (oldest first)
    const sortedReviews = [...reviews].sort(
      (a, b) =>
        new Date(a.attributes.createdAt).getTime() -
        new Date(b.attributes.createdAt).getTime()
    );
    const ratings = sortedReviews.map(r => r.attributes.rating);
    const avg = calcAverage(ratings);
    const reviewCount = ratings.length;

    // ── Step 3: check suspension thresholds ────────────────────────────────────

    // 3-consecutive 1-star check (can trigger regardless of review count)
    if (hasConsecutiveOneStars(ratings, CONSECUTIVE_ONE_STAR_LIMIT)) {
      sendSuspensionAlert(
        userId,
        displayName,
        email,
        avg,
        reviewCount,
        `3 consecutive 1-star reviews`
      );
      // Update user publicData: suspended = true
      try {
        await sdk.users.updateProfile(
          { id: userId },
          {
            publicData: {
              ...publicData,
              suspended: true,
              suspendedReason: '3-consecutive-1-star',
              suspendedAt: new Date().toISOString(),
            },
          }
        );
        console.log(`  ✓ Marked ${displayName} as suspended (consecutive 1-stars)`);
        suspended++;
      } catch (updateErr) {
        console.error(`  ✗ Failed to update profile for ${userId}: ${updateErr.message}`);
      }
      continue;
    }

    // Average-based suspension (10+ reviews, avg ≤ 3.5)
    if (reviewCount >= SUSPENSION_MIN_REVIEWS && avg <= SUSPENSION_THRESHOLD) {
      sendSuspensionAlert(
        userId,
        displayName,
        email,
        avg,
        reviewCount,
        `avg ${avg.toFixed(2)} ≤ ${SUSPENSION_THRESHOLD} after ${reviewCount} reviews`
      );
      try {
        await sdk.users.updateProfile(
          { id: userId },
          {
            publicData: {
              ...publicData,
              suspended: true,
              suspendedReason: 'low-avg-rating',
              suspendedAt: new Date().toISOString(),
              suspendedAvg: avg,
            },
          }
        );
        console.log(`  ✓ Marked ${displayName} as suspended (low avg)`);
        suspended++;
      } catch (updateErr) {
        console.error(`  ✗ Failed to update profile for ${userId}: ${updateErr.message}`);
      }
      continue;
    }

    // ── Step 4: check warning threshold ────────────────────────────────────────
    if (reviewCount >= WARNING_MIN_REVIEWS && avg <= WARNING_THRESHOLD) {
      sendWarningAlert(userId, displayName, email, avg, reviewCount);
      if (!publicData.ratingWarning) {
        try {
          await sdk.users.updateProfile(
            { id: userId },
            {
              publicData: {
                ...publicData,
                ratingWarning: true,
                ratingWarningSetAt: new Date().toISOString(),
              },
            }
          );
          console.log(`  ✓ Set ratingWarning=true for ${displayName}`);
          warned++;
        } catch (updateErr) {
          console.error(`  ✗ Failed to update profile for ${userId}: ${updateErr.message}`);
        }
      } else {
        // Warning already set, just logged again
        warned++;
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n[${new Date().toISOString()}] Review suspension tracker complete.`);
  console.log(`  Total users checked : ${totalUsers - skipped}`);
  console.log(`  Already suspended   : ${skipped}`);
  console.log(`  New warnings        : ${warned}`);
  console.log(`  New suspensions     : ${suspended}`);
};

run().catch(err => {
  console.error('Unhandled error in reviewSuspensionTracker:', err);
  process.exit(1);
});
