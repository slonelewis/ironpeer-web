import React, { useState } from 'react';
import classNames from 'classnames';

import css from './RentalDamageReview.module.css';

const PHOTO_SLOTS = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
];

/**
 * RentalDamageReview — shown to the OWNER after the renter completes check-out.
 * Owner can release the deposit or file a damage claim.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.checkInPhotos - Check-in photos keyed by slot id
 * @param {string} [props.checkInNote] - Check-in damage note
 * @param {Object} props.checkOutPhotos - Check-out photos keyed by slot id
 * @param {string} [props.checkOutNote] - Check-out damage note
 * @param {Function} props.onReleaseDeposit - Called when owner releases deposit
 * @param {Function} props.onReportDamage - Called with { description, estimatedCost } when owner reports damage
 * @param {boolean} [props.inProgress] - Action in progress
 * @param {string} [props.error] - Action error message
 * @param {boolean} [props.depositReleased] - Whether deposit has already been released
 * @param {Object} [props.damageDispute] - Existing dispute data
 * @param {string} [props.className]
 */
const RentalDamageReview = props => {
  const {
    checkInPhotos,
    checkInNote,
    checkOutPhotos,
    checkOutNote,
    onReleaseDeposit,
    onReportDamage,
    inProgress = false,
    error,
    depositReleased,
    damageDispute,
    className,
  } = props;

  const [showDamageForm, setShowDamageForm] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [damageFormError, setDamageFormError] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const handleReportDamageSubmit = () => {
    if (!damageDescription.trim()) {
      setDamageFormError('Please describe the damage.');
      return;
    }
    setDamageFormError('');
    onReportDamage({
      description: damageDescription.trim(),
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
    });
    setDisputeSubmitted(true);
  };

  // Already resolved states
  if (depositReleased) {
    return (
      <div className={classNames(css.root, className)}>
        <div className={css.card}>
          <div className={css.resolvedBanner}>
            <span className={css.resolvedIcon}>✓</span>
            <div>
              <h3 className={css.resolvedTitle}>Deposit Released</h3>
              <p className={css.resolvedSubtitle}>
                You confirmed no damage and the security deposit has been released.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (damageDispute) {
    return (
      <div className={classNames(css.root, className)}>
        <div className={css.card}>
          <div className={css.disputeBanner}>
            <span className={css.disputeIcon}>⚠</span>
            <div>
              <h3 className={css.disputeTitle}>Damage Dispute Submitted</h3>
              <p className={css.disputeSubtitle}>
                IronPeer support is reviewing your claim and will respond within 24 hours.
              </p>
              <div className={css.disputeDetails}>
                <p className={css.disputeDetailRow}>
                  <span className={css.disputeDetailLabel}>Description:</span>{' '}
                  {damageDispute.description}
                </p>
                {damageDispute.estimatedCost != null && (
                  <p className={css.disputeDetailRow}>
                    <span className={css.disputeDetailLabel}>Estimated repair cost:</span>{' '}
                    ${Number(damageDispute.estimatedCost).toFixed(2)}
                  </p>
                )}
                {damageDispute.reportedAt && (
                  <p className={css.disputeDetailRow}>
                    <span className={css.disputeDetailLabel}>Reported:</span>{' '}
                    {new Date(damageDispute.reportedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dispute just submitted this session
  if (disputeSubmitted) {
    return (
      <div className={classNames(css.root, className)}>
        <div className={css.card}>
          <div className={css.disputeBanner}>
            <span className={css.disputeIcon}>⚠</span>
            <div>
              <h3 className={css.disputeTitle}>Dispute Submitted</h3>
              <p className={css.disputeSubtitle}>
                Your dispute has been submitted. IronPeer will review within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames(css.root, className)}>
      <div className={css.card}>
        <div className={css.header}>
          <span className={css.headerIcon}>🔍</span>
          <h3 className={css.title}>Review Equipment Return</h3>
        </div>
        <p className={css.subtitle}>
          Compare the check-in and return photos. Release the deposit if there's no damage,
          or file a claim if equipment was damaged.
        </p>

        {/* Side-by-side photo comparison */}
        <div className={css.comparisonSection}>
          <div className={css.comparisonColumn}>
            <h4 className={css.comparisonHeading}>At Pickup</h4>
            {checkInNote && (
              <p className={css.comparisonNote}>
                <em>Note: {checkInNote}</em>
              </p>
            )}
            <div className={css.photoGrid}>
              {PHOTO_SLOTS.map(slot => {
                const photo = checkInPhotos?.[slot.id];
                return (
                  <div key={slot.id} className={css.photoSlotWrapper}>
                    <div
                      className={classNames(css.photoSlot, {
                        [css.photoSlotFilled]: !!photo,
                      })}
                    >
                      {photo ? (
                        <img
                          src={photo.url}
                          alt={`${slot.label} at pickup`}
                          className={css.photoPreview}
                        />
                      ) : (
                        <div className={css.photoPlaceholder}>
                          <span className={css.placeholderLabel}>{slot.label}</span>
                          <span className={css.placeholderSub}>No photo</span>
                        </div>
                      )}
                    </div>
                    <span className={css.slotLabel}>{slot.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={css.comparisonDivider} aria-hidden="true">→</div>

          <div className={css.comparisonColumn}>
            <h4 className={css.comparisonHeading}>At Return</h4>
            {checkOutNote && (
              <p className={classNames(css.comparisonNote, css.comparisonNoteWarning)}>
                <em>Reported: {checkOutNote}</em>
              </p>
            )}
            <div className={css.photoGrid}>
              {PHOTO_SLOTS.map(slot => {
                const photo = checkOutPhotos?.[slot.id];
                return (
                  <div key={slot.id} className={css.photoSlotWrapper}>
                    <div
                      className={classNames(css.photoSlot, {
                        [css.photoSlotFilled]: !!photo,
                      })}
                    >
                      {photo ? (
                        <img
                          src={photo.url}
                          alt={`${slot.label} at return`}
                          className={css.photoPreview}
                        />
                      ) : (
                        <div className={css.photoPlaceholder}>
                          <span className={css.placeholderLabel}>{slot.label}</span>
                          <span className={css.placeholderSub}>No photo</span>
                        </div>
                      )}
                    </div>
                    <span className={css.slotLabel}>{slot.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className={css.errorMessage}>{error}</p>}

        {!showDamageForm ? (
          <div className={css.actionRow}>
            <button
              type="button"
              className={css.releaseButton}
              onClick={onReleaseDeposit}
              disabled={inProgress}
            >
              {inProgress ? 'Processing...' : '✓ No damage — release deposit'}
            </button>
            <button
              type="button"
              className={css.damageButton}
              onClick={() => setShowDamageForm(true)}
              disabled={inProgress}
            >
              ⚠ Report damage
            </button>
          </div>
        ) : (
          <div className={css.damageForm}>
            <h4 className={css.damageFormTitle}>Report Damage</h4>

            <div className={css.formField}>
              <label htmlFor="damageDescription" className={css.fieldLabel}>
                Description of damage <span className={css.required}>*</span>
              </label>
              <textarea
                id="damageDescription"
                className={css.fieldTextarea}
                value={damageDescription}
                onChange={e => setDamageDescription(e.target.value)}
                placeholder="Describe what was damaged and how..."
                rows={4}
              />
            </div>

            <div className={css.formField}>
              <label htmlFor="estimatedCost" className={css.fieldLabel}>
                Estimated repair cost ($)
              </label>
              <input
                id="estimatedCost"
                type="number"
                min="0"
                step="0.01"
                className={css.fieldInput}
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {damageFormError && (
              <p className={css.errorMessage}>{damageFormError}</p>
            )}

            <div className={css.damageFormActions}>
              <button
                type="button"
                className={css.cancelButton}
                onClick={() => {
                  setShowDamageForm(false);
                  setDamageFormError('');
                }}
                disabled={inProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className={css.submitDisputeButton}
                onClick={handleReportDamageSubmit}
                disabled={inProgress || !damageDescription.trim()}
              >
                {inProgress ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalDamageReview;
