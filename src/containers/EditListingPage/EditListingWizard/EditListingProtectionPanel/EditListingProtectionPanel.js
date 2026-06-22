import React, { useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { H3, ListingLink, PrimaryButton } from '../../../../components';

import css from './EditListingProtectionPanel.module.css';

const UpdatePageTitle = ({ panelHeading }) => null; // handled by parent

/**
 * Protection panel for the EditListing wizard.
 * Collects road-legal status, registration docs, and insurance info.
 *
 * Data stored:
 *   privateData.isRoadLegal          boolean
 *   privateData.registration         { fileName, expiresAt } | null
 *   privateData.hasInsurance         boolean
 *   privateData.insurance            { fileName, expiresAt } | null
 *   privateData.insuranceDisclaimerAccepted  boolean
 */
const EditListingProtectionPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    updatePageTitle,
    intl,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  // If this is a trailer/hauler category, it is always road-legal — lock it
  const publicData = listing?.attributes?.publicData || {};
  const isTrailerCategory = publicData.categoryLevel1 === 'Haulers_and_trailers';

  // Pull existing values from privateData
  const privateData = listing?.attributes?.privateData || {};
  const existingIsRoadLegal = isTrailerCategory ? true : privateData.isRoadLegal;
  const existingHasInsurance = privateData.hasInsurance;
  const existingRegExpiry = privateData.registration?.expiresAt?.slice(0, 10) || '';
  const existingInsExpiry = privateData.insurance?.expiresAt?.slice(0, 10) || '';
  const existingDisclaimer = privateData.insuranceDisclaimerAccepted || false;

  // Local state
  const [isRoadLegal, setIsRoadLegal] = useState(
    isTrailerCategory ? true : (existingIsRoadLegal !== undefined ? existingIsRoadLegal : null)
  );
  const [regFileName, setRegFileName] = useState(privateData.registration?.fileName || '');
  const [regExpiry, setRegExpiry] = useState(existingRegExpiry);

  const [hasInsurance, setHasInsurance] = useState(
    existingHasInsurance !== undefined ? existingHasInsurance : null
  );
  const [insFileName, setInsFileName] = useState(privateData.insurance?.fileName || '');
  const [insExpiry, setInsExpiry] = useState(existingInsExpiry);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(existingDisclaimer);

  const [submitError, setSubmitError] = useState(null);

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files?.[0];
    if (file) setter(file.name);
  };

  const validate = () => {
    if (isRoadLegal === null) return 'Please indicate whether this equipment is road-legal.';
    if (isRoadLegal) {
      if (!regExpiry) return 'Please enter the registration expiration date.';
    }
    if (hasInsurance === null) return 'Please indicate whether you carry insurance on this item.';
    if (!hasInsurance && !disclaimerAccepted) {
      return 'You must accept the IronPeer protection disclaimer to continue.';
    }
    if (hasInsurance && !insExpiry) return 'Please enter the insurance expiration date.';
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError(null);

    const registrationMaybe = isRoadLegal
      ? {
          registration: {
            fileName: regFileName || null,
            expiresAt: regExpiry ? new Date(regExpiry).toISOString() : null,
          },
        }
      : { registration: null };

    const insuranceMaybe = hasInsurance
      ? {
          insurance: {
            fileName: insFileName || null,
            expiresAt: insExpiry ? new Date(insExpiry).toISOString() : null,
          },
          insuranceDisclaimerAccepted: false,
        }
      : {
          insurance: null,
          insuranceDisclaimerAccepted: disclaimerAccepted,
        };

    onSubmit({
      privateData: {
        isRoadLegal,
        hasInsurance,
        ...registrationMaybe,
        ...insuranceMaybe,
      },
    });
  };

  const panelHeadingProps = isPublished
    ? { id: 'EditListingProtectionPanel.title' }
    : { id: 'EditListingProtectionPanel.createListingTitle' };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className={classes}>
      {updatePageTitle?.({ panelHeading: 'Protection & Insurance' })}

      <H3 as="h1">Protection &amp; Insurance</H3>

      <div className={css.protectedBadge}>
        🛡 IronPeer Protected — all rentals covered
      </div>

      {/* ── ROAD LEGAL ── */}
      {isTrailerCategory ? (
        <div style={{ fontSize: '0.875rem', color: '#555', marginBottom: '1rem', padding: '0.75rem', background: '#fff8f5', border: '1px solid #E8450A33', borderRadius: '6px' }}>
          🚛 <strong>Trailers and haulers are road-legal by default.</strong> Registration is required.
        </div>
      ) : (
        <>
          <div className={css.sectionTitle}>Is this equipment road-legal?</div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
            Examples: trailers, tow vehicles, equipment that travels on public roads.
          </p>
          <div className={css.buttonGroup}>
            <button
              type="button"
              className={isRoadLegal === true ? css.optionButtonActive : css.optionButton}
              onClick={() => setIsRoadLegal(true)}
            >
              Yes — it&apos;s road-legal
            </button>
            <button
              type="button"
              className={isRoadLegal === false ? css.optionButtonActive : css.optionButton}
              onClick={() => setIsRoadLegal(false)}
            >
              No — off-road / yard equipment only
            </button>
          </div>
        </>
      )}

      {isRoadLegal === true && (
        <div className={css.subSection}>
          <strong>Registration required</strong>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0.75rem' }}>
            Road-legal equipment must have a valid registration on file with IronPeer.
            Your listing will be automatically unpublished if registration expires.
          </p>
          <div className={css.uploadField}>
            <label className={css.uploadLabel}>Upload registration document</label>
            <input
              type="file"
              className={css.fileInput}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange(setRegFileName)}
            />
            {regFileName && (
              <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {regFileName}</p>
            )}
          </div>
          <label className={css.uploadLabel}>Registration expiration date *</label>
          <input
            type="date"
            className={css.dateInput}
            value={regExpiry}
            min={today}
            onChange={e => setRegExpiry(e.target.value)}
          />
        </div>
      )}

      {isRoadLegal === false && (
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px' }}>
          No registration required for off-road equipment. 👍
        </div>
      )}

      {/* ── INSURANCE ── */}
      <div className={css.sectionTitle}>Do you carry insurance on this item?</div>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
        Insurance is <strong>not required</strong> — IronPeer Rental Protection covers your
        equipment during all rentals. If you do carry your own policy, you can submit it here
        to display an &ldquo;Owner-insured&rdquo; badge on your listing.
      </p>
      <div className={css.buttonGroup}>
        <button
          type="button"
          className={hasInsurance === true ? css.optionButtonActive : css.optionButton}
          onClick={() => setHasInsurance(true)}
        >
          Yes — I carry my own policy
        </button>
        <button
          type="button"
          className={hasInsurance === false ? css.optionButtonActive : css.optionButton}
          onClick={() => setHasInsurance(false)}
        >
          No — use IronPeer protection only
        </button>
      </div>

      {hasInsurance === true && (
        <div className={css.subSection}>
          <div className={css.badge}>Owner-insured ✓</div>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.75rem 0' }}>
            Submit proof of insurance. Your listing will show an &ldquo;Owner-insured&rdquo; badge
            and will be automatically unpublished if coverage expires.
          </p>
          <div className={css.uploadField}>
            <label className={css.uploadLabel}>Upload proof of insurance</label>
            <input
              type="file"
              className={css.fileInput}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange(setInsFileName)}
            />
            {insFileName && (
              <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {insFileName}</p>
            )}
          </div>
          <label className={css.uploadLabel}>Insurance expiration date *</label>
          <input
            type="date"
            className={css.dateInput}
            value={insExpiry}
            min={today}
            onChange={e => setInsExpiry(e.target.value)}
          />
        </div>
      )}

      {hasInsurance === false && (
        <div className={css.disclaimer} style={{ boxSizing: 'border-box', width: '100%', overflowWrap: 'break-word' }}>
          <p className={css.disclaimerText}>
            <strong>IronPeer Rental Protection</strong> covers your equipment during every rental
            period — from the moment a rental starts until the equipment is returned. You are not
            required to carry a separate insurance policy. IronPeer&apos;s coverage activates at
            rental start and deactivates upon return. Your personal or business property coverage
            is not affected by this listing.
          </p>
          <label className={css.checkboxLabel}>
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={e => setDisclaimerAccepted(e.target.checked)}
            />
            <span className={css.checkboxText}>
              I understand and agree that IronPeer Rental Protection covers this equipment during
              all rental periods.
            </span>
          </label>
        </div>
      )}

      {submitError && <p className={css.errorMessage}>{submitError}</p>}

      <p className={css.requiredLegend}>* Selection required to proceed</p>

      <div className={css.submitButton}>
        <PrimaryButton
          onClick={handleSubmit}
          inProgress={updateInProgress}
          disabled={disabled || updateInProgress}
          ready={ready}
        >
          {submitButtonText || 'Save & continue'}
        </PrimaryButton>
      </div>
    </main>
  );
};

export default EditListingProtectionPanel;
