import React, { useState, useRef } from 'react';
import classNames from 'classnames';

import css from './MidRentalIssueReport.module.css';

const ISSUE_TYPES = [
  { id: 'malfunction', icon: '🔧', label: 'Equipment malfunction or breakdown' },
  { id: 'damage', icon: '⚠️', label: 'Damage I caused' },
  { id: 'safety', icon: '🚨', label: 'Safety concern' },
  { id: 'other', icon: '📝', label: 'Other' },
];

/**
 * MidRentalIssueReport — appears during an active rental (check-in done, check-out pending).
 * Allows the renter to report issues inline without ending the rental.
 * Multiple issues can be reported; the form resets after each submission.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onReportIssue - Called with { issueType, description, photoUrl }
 * @param {boolean} [props.inProgress] - Submission in progress
 * @param {string} [props.error] - Error message
 * @param {Array} [props.existingIssues] - Previously reported issues this session
 * @param {string} [props.className]
 */
const MidRentalIssueReport = props => {
  const {
    onReportIssue,
    inProgress = false,
    error,
    existingIssues = [],
    className,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [lastSubmitSuccess, setLastSubmitSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const canSubmit = issueType && description.trim().length > 0 && !inProgress;

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreviewUrl(url);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setIssueType('');
    setDescription('');
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onReportIssue({
      issueType,
      description: description.trim(),
      photoUrl: photoPreviewUrl || null,
    });
    // Show success flash, then reset form (keep panel open for follow-up reports)
    setLastSubmitSuccess(true);
    setTimeout(() => {
      setLastSubmitSuccess(false);
      resetForm();
      setIsOpen(false);
    }, 2500);
  };

  const issueCount = existingIssues.length;

  return (
    <div className={classNames(css.root, className)}>
      <div className={css.card}>
        {/* Trigger button */}
        <div className={css.triggerRow}>
          <div className={css.triggerLeft}>
            <span className={css.triggerIcon}>🔔</span>
            <div>
              <h4 className={css.triggerTitle}>Report a Mid-Rental Issue</h4>
              {issueCount > 0 && (
                <p className={css.issueCount}>
                  {issueCount} issue{issueCount !== 1 ? 's' : ''} reported this rental
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className={classNames(css.triggerBtn, { [css.triggerBtnOpen]: isOpen })}
            onClick={() => setIsOpen(v => !v)}
          >
            {isOpen ? 'Cancel' : 'Report Issue'}
          </button>
        </div>

        {/* Previously reported issues (collapsed summary) */}
        {issueCount > 0 && !isOpen && (
          <ul className={css.existingList}>
            {existingIssues.map((issue, idx) => {
              const typeObj = ISSUE_TYPES.find(t => t.id === issue.issueType);
              return (
                <li key={idx} className={css.existingItem}>
                  <span className={css.existingIcon}>{typeObj?.icon || '📝'}</span>
                  <div>
                    <span className={css.existingType}>{typeObj?.label || issue.issueType}</span>
                    <span className={css.existingDesc}>{issue.description}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Inline form */}
        {isOpen && (
          <div className={css.form}>
            {lastSubmitSuccess ? (
              <div className={css.successMessage}>
                <span className={css.successIcon}>✓</span>
                <div>
                  <p className={css.successTitle}>Issue reported.</p>
                  <p className={css.successSubtitle}>IronPeer has been notified.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Issue type selection */}
                <fieldset className={css.fieldset}>
                  <legend className={css.fieldsetLegend}>Issue type <span className={css.required}>*</span></legend>
                  <div className={css.issueTypeGrid}>
                    {ISSUE_TYPES.map(type => (
                      <label
                        key={type.id}
                        className={classNames(css.issueTypeOption, {
                          [css.issueTypeSelected]: issueType === type.id,
                        })}
                      >
                        <input
                          type="radio"
                          name="issueType"
                          value={type.id}
                          checked={issueType === type.id}
                          onChange={() => setIssueType(type.id)}
                          className={css.radioInput}
                        />
                        <span className={css.issueTypeIcon}>{type.icon}</span>
                        <span className={css.issueTypeLabel}>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Description */}
                <div className={css.fieldGroup}>
                  <label htmlFor="midRentalDescription" className={css.fieldLabel}>
                    Description <span className={css.required}>*</span>
                  </label>
                  <textarea
                    id="midRentalDescription"
                    className={css.textarea}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                  />
                </div>

                {/* Optional photo upload */}
                <div className={css.fieldGroup}>
                  <span className={css.fieldLabel}>Photo (optional)</span>
                  {photoPreviewUrl ? (
                    <div className={css.photoPreviewWrapper}>
                      <img src={photoPreviewUrl} alt="Issue photo" className={css.photoPreview} />
                      <button
                        type="button"
                        className={css.removePhotoBtn}
                        onClick={handleRemovePhoto}
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <label className={css.photoUploadLabel}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className={css.hiddenInput}
                        onChange={handlePhotoChange}
                      />
                      <span className={css.photoUploadBtnText}>+ Add photo</span>
                    </label>
                  )}
                </div>

                {error && <p className={css.errorMessage}>{error}</p>}

                <button
                  type="button"
                  className={classNames(css.submitBtn, {
                    [css.submitBtnDisabled]: !canSubmit,
                  })}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {inProgress ? 'Submitting...' : 'Submit Report'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MidRentalIssueReport;
