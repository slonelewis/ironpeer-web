/**
 * IdentityVerificationModal
 *
 * Shown to renters who haven't yet completed Stripe Identity verification.
 * Gatekeeps checkout — the payment form is only shown after identity is confirmed.
 *
 * Flow:
 *   1. User clicks "Verify Identity"
 *   2. createVerificationSession() → server creates a VerificationSession → returns clientSecret
 *   3. stripe.verifyIdentity(clientSecret) opens the Stripe hosted verification UI
 *   4a. On success → onVerified() callback fires → parent hides modal & shows payment form
 *   4b. On failure/cancel → error message shown with retry button
 *
 * Stripe test mode:
 *   Use test document number 000000000 (nine zeros) to trigger a successful verification.
 *   See https://stripe.com/docs/identity/verify-identity-documents#test-verification
 *
 * @stripe/stripe-js is NOT in package.json.
 * We load the Stripe.js script dynamically so the bundle is not bloated.
 * The script is cached by the browser on repeat visits.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { createVerificationSession } from '../../util/api';

import css from './IdentityVerificationModal.module.css';

// ── Stripe.js dynamic loader ─────────────────────────────────────────────────

let stripeScriptLoadPromise = null;

const loadStripeScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR not supported'));

  // Already on page (script tag added previously)
  if (window.Stripe) return Promise.resolve(window.Stripe);

  // Deduplicate concurrent loads
  if (stripeScriptLoadPromise) return stripeScriptLoadPromise;

  stripeScriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(script);
  });

  return stripeScriptLoadPromise;
};

// ── Component ────────────────────────────────────────────────────────────────

const IdentityVerificationModal = ({ stripePublishableKey, onVerified, className }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | verifying | success | error
  const [errorMessage, setErrorMessage] = useState(null);
  const stripeRef = useRef(null);

  // Pre-load Stripe.js as soon as the component mounts so it's ready when clicked
  useEffect(() => {
    loadStripeScript()
      .then(StripeConstructor => {
        stripeRef.current = StripeConstructor(stripePublishableKey);
      })
      .catch(err => {
        console.error('[IdentityVerificationModal] Stripe.js preload failed:', err.message);
      });
  }, [stripePublishableKey]);

  const handleVerify = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      // Ensure Stripe.js is loaded
      if (!stripeRef.current) {
        const StripeConstructor = await loadStripeScript();
        stripeRef.current = StripeConstructor(stripePublishableKey);
      }

      // Create the VerificationSession on the server
      const { clientSecret } = await createVerificationSession();

      setStatus('verifying');

      // Open the Stripe Identity hosted UI
      const { error } = await stripeRef.current.verifyIdentity(clientSecret);

      if (error) {
        // User cancelled or something went wrong
        if (error.code === 'session_cancelled' || error.code === 'canceled') {
          setStatus('idle');
        } else {
          console.error('[IdentityVerificationModal] verifyIdentity error:', error);
          setStatus('error');
          setErrorMessage(
            error.message ||
              'Verification failed. Please try again or contact support.'
          );
        }
        return;
      }

      // Success — Stripe returns control here after the flow completes.
      // Note: The webhook updates Sharetribe metadata asynchronously.
      // We optimistically show the success state and fire onVerified().
      setStatus('success');
      if (onVerified) {
        onVerified();
      }
    } catch (err) {
      console.error('[IdentityVerificationModal] Error during verification:', err);
      setStatus('error');
      setErrorMessage(
        err.message || 'Verification failed. Please try again or contact support.'
      );
    }
  }, [stripePublishableKey, onVerified]);

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage(null);
  };

  const rootClass = classNames(css.root, className);

  if (status === 'success') {
    return (
      <div className={rootClass}>
        <div className={css.successContainer}>
          <div className={css.successIcon} aria-hidden="true">✓</div>
          <h2 className={css.heading}>Identity Verified</h2>
          <p className={css.description}>
            Your identity has been confirmed. You can now complete your booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className={css.card}>
        <div className={css.iconContainer} aria-hidden="true">
          <svg className={css.shieldIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className={css.heading}>Verify your identity to continue</h2>

        <p className={css.description}>
          IronPeer requires all renters to verify their identity before their first booking.
          This is a one-time step that keeps everyone on the platform safe.
        </p>

        <ul className={css.featureList}>
          <li>Takes about 2 minutes</li>
          <li>Government-issued ID (driver's license, passport, or national ID)</li>
          <li>Quick selfie to match your photo</li>
          <li>Powered by Stripe Identity — your data is encrypted and secure</li>
        </ul>

        {status === 'error' && errorMessage ? (
          <div className={css.errorBox} role="alert">
            <p className={css.errorText}>{errorMessage}</p>
            <button
              type="button"
              className={css.retryButton}
              onClick={handleRetry}
            >
              Try again
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className={css.verifyButton}
          onClick={handleVerify}
          disabled={status === 'loading' || status === 'verifying'}
        >
          {status === 'loading' ? 'Preparing…' : status === 'verifying' ? 'Verification in progress…' : 'Verify my identity'}
        </button>

        <p className={css.disclaimer}>
          Your information is used solely for identity verification and is not shared with equipment owners.
        </p>
      </div>
    </div>
  );
};

IdentityVerificationModal.defaultProps = {
  className: null,
  onVerified: null,
};

IdentityVerificationModal.propTypes = {
  /** Stripe publishable key from config */
  stripePublishableKey: PropTypes.string.isRequired,
  /** Called when the user successfully completes identity verification */
  onVerified: PropTypes.func,
  /** Additional CSS class */
  className: PropTypes.string,
};

export default IdentityVerificationModal;
