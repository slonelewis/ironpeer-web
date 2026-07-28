import React, { useState, useRef } from 'react';
import classNames from 'classnames';

import css from './RentalCheckIn.module.css';

const PHOTO_SLOTS = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
];

/**
 * RentalCheckIn — shown to the renter at pickup to document equipment condition.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onConfirmCheckIn - Called with { photos, note, preExistingIssue, equipmentConfirmed }
 * @param {boolean} [props.inProgress] - Submit in progress
 * @param {string} [props.error] - Submit error message
 * @param {Object} [props.existingCheckIn] - Already-submitted check-in data (read-only mode)
 * @param {string} [props.className]
 */
const RentalCheckIn = props => {
  const { onConfirmCheckIn, inProgress = false, error, existingCheckIn, className } = props;

  const [photos, setPhotos] = useState({ front: null, back: null, left: null, right: null });
  const [note, setNote] = useState('');
  const [equipmentConfirmed, setEquipmentConfirmed] = useState(false);
  const [showPreExistingForm, setShowPreExistingForm] = useState(false);
  const [preExistingIssue, setPreExistingIssue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRefs = useRef({});

  const handleFileChange = (slotId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotos(prev => ({ ...prev, [slotId]: { file, url, name: file.name } }));
  };

  const handleSlotClick = slotId => {
    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId].click();
    }
  };

  const handleRemovePhoto = (e, slotId) => {
    e.stopPropagation();
    setPhotos(prev => ({ ...prev, [slotId]: null }));
    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId].value = '';
    }
  };

  const allPhotosProvided = PHOTO_SLOTS.every(slot => photos[slot.id] !== null);
  const canSubmit = allPhotosProvided && equipmentConfirmed && !inProgress;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const photoData = PHOTO_SLOTS.reduce((acc, slot) => {
      acc[slot.id] = { name: photos[slot.id].name, url: photos[slot.id].url };
      return acc;
    }, {});
    onConfirmCheckIn({
      photos: photoData,
      note,
      preExistingIssue: showPreExistingForm && preExistingIssue.trim() ? preExistingIssue.trim() : null,
      equipmentConfirmed: true,
    });
    setSubmitted(true);
  };

  // Read-only mode — check-in already completed
  if (existingCheckIn) {
    const confirmedAt = existingCheckIn.confirmedAt
      ? new Date(existingCheckIn.confirmedAt).toLocaleString()
      : null;
    return (
      <div className={classNames(css.root, className)}>
        <div className={css.card}>
          <div className={css.header}>
            <span className={css.headerIcon}>✓</span>
            <h3 className={css.title}>Pickup Documented</h3>
          </div>
          <p className={css.subtitle}>
            Equipment condition was photographed at pickup.
          </p>
          <div className={css.photoGrid}>
            {PHOTO_SLOTS.map(slot => {
              const photo = existingCheckIn.photos?.[slot.id];
              return (
                <div key={slot.id} className={css.photoSlot}>
                  {photo ? (
                    <img src={photo.url} alt={slot.label} className={css.photoPreview} />
                  ) : (
                    <div className={css.photoPlaceholder}>
                      <span className={css.placeholderLabel}>{slot.label}</span>
                    </div>
                  )}
                  <span className={css.slotLabel}>{slot.label}</span>
                </div>
              );
            })}
          </div>
          {existingCheckIn.note && (
            <div className={css.noteSection}>
              <span className={css.noteLabel}>Damage notes:</span>
              <p className={css.noteText}>{existingCheckIn.note}</p>
            </div>
          )}
          {confirmedAt && (
            <p className={css.timestamp}>Pickup confirmed: {confirmedAt}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={classNames(css.root, className)}>
      <div className={css.card}>
        <div className={css.header}>
          <span className={css.headerIcon}>📷</span>
          <h3 className={css.title}>Document Equipment Condition</h3>
        </div>
        <p className={css.subtitle}>
          Before you take the equipment, photograph it from all 4 angles to establish
          the condition baseline. This protects both you and the owner.
        </p>

        <div className={css.photoGrid}>
          {PHOTO_SLOTS.map(slot => (
            <div key={slot.id} className={css.photoSlotWrapper}>
              <input
                ref={el => (fileInputRefs.current[slot.id] = el)}
                type="file"
                accept="image/*"
                capture="environment"
                className={css.fileInput}
                onChange={e => handleFileChange(slot.id, e)}
              />
              <button
                type="button"
                className={classNames(css.photoSlot, {
                  [css.photoSlotFilled]: !!photos[slot.id],
                })}
                onClick={() => handleSlotClick(slot.id)}
                aria-label={`Upload ${slot.label} photo`}
              >
                {photos[slot.id] ? (
                  <>
                    <img
                      src={photos[slot.id].url}
                      alt={slot.label}
                      className={css.photoPreview}
                    />
                    <button
                      type="button"
                      className={css.removePhoto}
                      onClick={e => handleRemovePhoto(e, slot.id)}
                      aria-label={`Remove ${slot.label} photo`}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className={css.photoPlaceholder}>
                    <span className={css.cameraIcon}>+</span>
                    <span className={css.placeholderLabel}>{slot.label}</span>
                  </div>
                )}
              </button>
              <span className={css.slotLabel}>{slot.label}</span>
            </div>
          ))}
        </div>

        {!allPhotosProvided && (
          <p className={css.photoRequirement}>
            All 4 photos required before confirming pickup
          </p>
        )}

        <div className={css.noteSection}>
          <label htmlFor="checkInNote" className={css.noteLabel}>
            Note any existing damage (optional)
          </label>
          <textarea
            id="checkInNote"
            className={css.noteTextarea}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Describe any pre-existing scratches, dents, or damage..."
            rows={3}
          />
        </div>

        {/* Pre-existing issue flag */}
        <div className={css.preExistingSection}>
          <button
            type="button"
            className={classNames(css.preExistingToggle, {
              [css.preExistingToggleActive]: showPreExistingForm,
            })}
            onClick={() => setShowPreExistingForm(v => !v)}
          >
            <span className={css.preExistingIcon}>⚠</span>
            <span>{showPreExistingForm ? 'Cancel pre-existing issue flag' : 'Flag a pre-existing issue'}</span>
          </button>

          {showPreExistingForm && (
            <div className={css.preExistingForm}>
              <label htmlFor="preExistingIssue" className={css.noteLabel}>
                Describe the pre-existing issue
              </label>
              <textarea
                id="preExistingIssue"
                className={css.noteTextarea}
                value={preExistingIssue}
                onChange={e => setPreExistingIssue(e.target.value)}
                placeholder="This will be noted before your rental begins..."
                rows={3}
              />
              <p className={css.preExistingHint}>
                This documents an issue that existed before your rental, protecting you from being held responsible.
              </p>
            </div>
          )}
        </div>

        {/* Equipment confirmation checkbox — required to submit */}
        <label className={css.checkboxRow}>
          <input
            type="checkbox"
            className={css.checkbox}
            checked={equipmentConfirmed}
            onChange={e => setEquipmentConfirmed(e.target.checked)}
          />
          <span className={css.checkboxLabel}>
            I confirm the equipment matches the listing description
          </span>
        </label>

        {!equipmentConfirmed && allPhotosProvided && (
          <p className={css.confirmRequirement}>
            Please confirm the equipment matches the listing before proceeding
          </p>
        )}

        {error && <p className={css.errorMessage}>{error}</p>}

        <button
          type="button"
          className={classNames(css.confirmButton, {
            [css.confirmButtonDisabled]: !canSubmit,
          })}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {inProgress ? 'Saving...' : 'Confirm Pickup'}
        </button>
      </div>
    </div>
  );
};

export default RentalCheckIn;
