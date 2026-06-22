import React, { useState, useRef } from 'react';
import classNames from 'classnames';

import css from './RentalCheckOut.module.css';

const PHOTO_SLOTS = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
];

/**
 * RentalCheckOut — shown to the renter when returning equipment (within 24h of return date).
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onConfirmReturn - Called with { photos, note } when confirmed
 * @param {boolean} [props.inProgress] - Submit in progress
 * @param {string} [props.error] - Submit error message
 * @param {Object} [props.existingCheckOut] - Already-submitted check-out data (read-only mode)
 * @param {string} [props.className]
 */
const RentalCheckOut = props => {
  const { onConfirmReturn, inProgress = false, error, existingCheckOut, className } = props;

  const [photos, setPhotos] = useState({ front: null, back: null, left: null, right: null });
  const [note, setNote] = useState('');
  const [conditionConfirmed, setConditionConfirmed] = useState(false);
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
  const canSubmit = allPhotosProvided && conditionConfirmed && !inProgress;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const photoData = PHOTO_SLOTS.reduce((acc, slot) => {
      acc[slot.id] = { name: photos[slot.id].name, url: photos[slot.id].url };
      return acc;
    }, {});
    onConfirmReturn({ photos: photoData, note });
    setSubmitted(true);
  };

  // Read-only mode — check-out already completed
  if (existingCheckOut) {
    const confirmedAt = existingCheckOut.confirmedAt
      ? new Date(existingCheckOut.confirmedAt).toLocaleString()
      : null;
    return (
      <div className={classNames(css.root, className)}>
        <div className={css.card}>
          <div className={css.header}>
            <span className={css.headerIcon}>✓</span>
            <h3 className={css.title}>Return Documented</h3>
          </div>
          <p className={css.subtitle}>
            Equipment was photographed at return. The owner is reviewing the photos.
          </p>
          <div className={css.photoGrid}>
            {PHOTO_SLOTS.map(slot => {
              const photo = existingCheckOut.photos?.[slot.id];
              return (
                <div key={slot.id} className={css.photoSlotWrapper}>
                  <div
                    className={classNames(css.photoSlot, { [css.photoSlotFilled]: !!photo })}
                  >
                    {photo ? (
                      <img src={photo.url} alt={slot.label} className={css.photoPreview} />
                    ) : (
                      <div className={css.photoPlaceholder}>
                        <span className={css.placeholderLabel}>{slot.label}</span>
                      </div>
                    )}
                  </div>
                  <span className={css.slotLabel}>{slot.label}</span>
                </div>
              );
            })}
          </div>
          {existingCheckOut.note && (
            <div className={css.noteSection}>
              <span className={css.noteLabel}>Reported damage:</span>
              <p className={css.noteText}>{existingCheckOut.note}</p>
            </div>
          )}
          {confirmedAt && (
            <p className={css.timestamp}>Return confirmed: {confirmedAt}</p>
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
          <h3 className={css.title}>Document Return Condition</h3>
        </div>
        <p className={css.subtitle}>
          Before returning the equipment, photograph it from all 4 angles. Your deposit
          will be reviewed based on these photos.
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
            All 4 photos required before confirming return
          </p>
        )}

        <div className={css.noteSection}>
          <label htmlFor="checkOutNote" className={css.noteLabel}>
            Note any damage to report (optional)
          </label>
          <textarea
            id="checkOutNote"
            className={css.noteTextarea}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Describe any damage that occurred during the rental..."
            rows={3}
          />
        </div>

        <label className={css.checkboxRow}>
          <input
            type="checkbox"
            className={css.checkbox}
            checked={conditionConfirmed}
            onChange={e => setConditionConfirmed(e.target.checked)}
          />
          <span className={css.checkboxLabel}>
            I confirm this equipment has been returned in the same condition I received it
          </span>
        </label>

        {error && <p className={css.errorMessage}>{error}</p>}

        <button
          type="button"
          className={classNames(css.confirmButton, {
            [css.confirmButtonDisabled]: !canSubmit,
          })}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {inProgress ? 'Saving...' : 'Confirm Return'}
        </button>
      </div>
    </div>
  );
};

export default RentalCheckOut;
