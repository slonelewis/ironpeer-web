import React, { useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';

import { Page, IconSpinner, NamedLink } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';

import { updateProfileThunk, uploadImageThunk } from './ProfileCompletionPage.duck';
import css from './ProfileCompletionPage.module.css';

// ================ US States ================ //

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

// ================ Hauler constants ================ //

const CDL_THRESHOLD = 26000; // lbs - CDL required above this max tow capacity
const TODAY = new Date().toISOString().split('T')[0];

const NON_CDL_HITCH_OPTIONS = [
  { value: 'bumper-pull',   label: 'Bumper pull' },
  { value: 'gooseneck',     label: 'Gooseneck' },
  { value: 'kingpin-ncdl', label: 'Kingpin (5th wheel)' },
  { value: 'pintle-ncdl',  label: 'Pintle hitch' },
  { value: 'other-ncdl',   label: 'Other' },
];

const CDL_HITCH_OPTIONS = [
  { value: 'kingpin-cdl', label: 'Kingpin (5th wheel)' },
  { value: 'pintle-cdl', label: 'Pintle hitch' },
  { value: 'other-cdl',  label: 'Other' },
];

const BUSINESS_TYPES = [
  { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
  { value: 'llc',                 label: 'LLC' },
  { value: 's-corp',              label: 'S-Corp' },
  { value: 'c-corp',              label: 'C-Corp' },
];

// ================ Step builder ================ //

const buildSteps = (selectedRoles = []) => {
  const steps = [
    { id: 'roleSelection', label: 'Your Role' },
    { id: 'basicInfo', label: 'Basic Info' },
    { id: 'photo', label: 'Profile Photo' },
  ];
  if (selectedRoles.includes('owner')) {
    steps.push({ id: 'owner', label: 'Payout Setup' });
  }
  if (selectedRoles.includes('renter')) {
    steps.push({ id: 'renter', label: 'Verify Identity' });
  }
  if (selectedRoles.includes('hauler')) {
    steps.push({ id: 'hauler', label: 'Hauler Details' });
  }
  steps.push({ id: 'complete', label: 'All Set!' });
  return steps;
};

// ================ Step: Role Selection ================ //

const ROLE_OPTIONS = [
  { value: 'renter', label: 'Rent', description: 'Rent locally owned equipment near you.' },
  { value: 'owner',  label: 'List', description: 'List your equipment and start earning.' },
  { value: 'hauler', label: 'Haul', description: 'Haul equipment and trailers for others.' },
];

const RoleSelectionStep = ({ selectedRoles, onChange, error }) => {
  const toggle = val => {
    const next = selectedRoles.includes(val)
      ? selectedRoles.filter(r => r !== val)
      : [...selectedRoles, val];
    onChange(next);
  };

  return (
    <div>
      <h2 className={css.stepTitle}>What are you here to do?</h2>
      <p className={css.stepSubtitle}>Select all that apply. You can add more roles later.</p>
      {error && <p className={css.errorMsg}>{error}</p>}
      <div className={css.roleCards}>
        {ROLE_OPTIONS.map(role => (
          <div
            key={role.value}
            className={classNames(css.roleCard, { [css.roleCardSelected]: selectedRoles.includes(role.value) })}
            onClick={() => toggle(role.value)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && toggle(role.value)}
          >
            <div className={css.roleCardCheck}>
              {selectedRoles.includes(role.value) ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="9" fill="#E8450A" />
                  <path d="M5 9l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <div className={css.roleCardCheckEmpty} />
              )}
            </div>
            <div className={css.roleCardContent}>
              <div className={css.roleCardLabel}>{role.label}</div>
              <div className={css.roleCardDesc}>{role.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================ Step Indicator ================ //

const StepIndicator = ({ steps, currentIndex }) => {
  // Don't show the 'complete' step in the indicator
  const visibleSteps = steps.filter(s => s.id !== 'complete');
  const isComplete = steps[currentIndex]?.id === 'complete';

  return (
    <div className={css.stepIndicator}>
      {visibleSteps.map((step, idx) => {
        const isDone = isComplete || idx < currentIndex;
        const isActive = !isComplete && idx === currentIndex;
        return (
          <React.Fragment key={step.id}>
            <div
              className={classNames(css.stepDot, {
                [css.stepDotActive]: isActive,
                [css.stepDotDone]: isDone,
              })}
            >
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>
            {idx < visibleSteps.length - 1 && (
              <div className={classNames(css.stepLine, { [css.stepLineDone]: isDone })} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ================ Step: Basic Info ================ //

const BasicInfoStep = ({ values, onChange, errors }) => (
  <div>
    <h2 className={css.stepTitle}>Tell us about yourself</h2>
    <p className={css.stepSubtitle}>This info appears on your IronPeer profile.</p>

    <div className={css.fieldRow}>
      <div className={css.field}>
        <label className={css.label}>First name *</label>
        <input
          className={classNames(css.input, { [css.inputError]: errors.firstName })}
          type="text"
          value={values.firstName}
          onChange={e => onChange({ ...values, firstName: e.target.value })}
          placeholder="Jane"
          autoFocus
        />
        {errors.firstName && <p className={css.errorMsg}>{errors.firstName}</p>}
      </div>
      <div className={css.field}>
        <label className={css.label}>Last name *</label>
        <input
          className={classNames(css.input, { [css.inputError]: errors.lastName })}
          type="text"
          value={values.lastName}
          onChange={e => onChange({ ...values, lastName: e.target.value })}
          placeholder="Doe"
        />
        {errors.lastName && <p className={css.errorMsg}>{errors.lastName}</p>}
      </div>
    </div>

    <div className={css.field} style={{ maxWidth: '220px' }}>
      <label className={css.label}>Phone number *</label>
      <input
        className={classNames(css.input, { [css.inputError]: errors.phone })}
        type="tel"
        value={values.phone || ''}
        onChange={e => onChange({ ...values, phone: e.target.value })}
        placeholder="(360) 555-1234"
      />
      {errors.phone && <p className={css.errorMsg}>{errors.phone}</p>}
    </div>

    <div className={css.field}>
      <label className={css.label}>Bio / About (optional)</label>
      <textarea
        className={css.textarea}
        value={values.bio}
        onChange={e => onChange({ ...values, bio: e.target.value })}
        placeholder="Tell other IronPeer members a bit about yourself and what you use for..."
        rows={4}
      />
    </div>
  </div>
);

// ================ Step: Photo Upload ================ //

const PhotoStep = ({ preview, onFileChange, uploadInProgress, uploadError, photoError }) => {
  const fileInputRef = useRef(null);

  return (
    <div>
      <h2 className={css.stepTitle}>Add a profile photo</h2>
      <p className={css.stepSubtitle}>
        A profile photo is required to continue. It helps build trust with other members.
      </p>
      {photoError && <p className={css.errorMsg}>{photoError}</p>}

      <div className={css.photoUploadArea}>
        <div
          className={classNames(css.photoPreview, { [css.photoPreviewPlaceholder]: !preview })}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {uploadInProgress ? (
            <IconSpinner />
          ) : preview ? (
            <img src={preview} alt="Profile preview" className={css.photoImg} />
          ) : (
            <div className={css.photoPlaceholder}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="16" r="7" stroke="#E8450A" strokeWidth="2" />
                <path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#E8450A" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className={css.photoPlaceholderText}>Click to upload photo</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={css.fileInput}
          onChange={onFileChange}
        />

        {preview && !uploadInProgress && (
          <button
            type="button"
            className={css.changePhotoBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Change photo
          </button>
        )}

        {uploadError && (
          <p className={css.errorMsg}>Upload failed - please try again.</p>
        )}
      </div>


    </div>
  );
};

// ================ Step: Owner Setup ================ //

const OwnerStep = () => (
  <div>
    <h2 className={css.stepTitle}>Set up payouts</h2>
    <p className={css.stepSubtitle}>
      As an equipment owner, you'll receive payments for approved bookings.
    </p>
    <div className={css.infoCard}>
      <div className={css.infoCardIcon}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="7" width="22" height="16" rx="3" stroke="#E8450A" strokeWidth="1.8" />
          <path d="M3 12h22" stroke="#E8450A" strokeWidth="1.8" />
          <rect x="7" y="16" width="6" height="3" rx="1" fill="#E8450A" />
        </svg>
      </div>
      <div>
        <p className={css.infoCardTitle}>Stripe Connect - Coming Soon</p>
        <p className={css.infoCardBody}>
          Payout setup via Stripe Connect will be available when IronPeer goes live. We'll email
          you at that point to complete your payout account. No action needed now!
        </p>
      </div>
    </div>
  </div>
);

// ================ Step: Renter Setup ================ //

const RenterStep = () => (
  <div>
    <h2 className={css.stepTitle}>Verify your identity</h2>
    <p className={css.stepSubtitle}>
      IronPeer requires identity verification before your first booking.
    </p>
    <div className={css.infoCard}>
      <div className={css.infoCardIcon}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="22" height="16" rx="3" stroke="#E8450A" strokeWidth="1.8" />
          <circle cx="9" cy="14" r="3" stroke="#E8450A" strokeWidth="1.6" />
          <path d="M15 11h7M15 14h5M15 17h7" stroke="#E8450A" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className={css.infoCardTitle}>Quick &amp; Secure ID Verification</p>
        <p className={css.infoCardBody}>
          You'll be prompted to verify your ID at your first booking. The process takes about 2
          minutes and helps keep IronPeer safe for everyone in the community.
        </p>
      </div>
    </div>
  </div>
);

// ================ Step: Stripe Setup ================ //

const StripeStep = ({ onSkip }) => (
  <div>
    <h2 className={css.stepTitle}>Set up Stripe</h2>
    <p className={css.stepSubtitle}>
      Connect your bank account to receive payments and payouts. You can skip this now and set it up later before your first transaction.
    </p>
    <div className={css.infoCard}>
      <div className={css.infoCardIcon}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="22" height="16" rx="3" stroke="#E8450A" strokeWidth="1.8" />
          <path d="M3 11h22" stroke="#E8450A" strokeWidth="1.6" />
          <rect x="6" y="15" width="5" height="3" rx="1" fill="#E8450A" />
        </svg>
      </div>
      <div>
        <p className={css.infoCardTitle}>Stripe Connect — Coming Soon</p>
        <p className={css.infoCardBody}>
          Payout and payment setup via Stripe will be available when IronPeer goes live. We'll prompt you to complete this before your first transaction. No action needed now!
        </p>
      </div>
    </div>
    <p className={css.skipNote} style={{ marginTop: 16, color: '#6b7280', fontSize: 13 }}>
      This step is optional — click <strong>Next</strong> to continue.
    </p>
  </div>
);

// ================ Doc Upload Helper ================ //

const DocUpload = ({ label, required, preview, onFileChange, hint }) => {
  const ref = useRef(null);
  return (
    <div className={css.docUploadField}>
      <label className={css.label}>{label}{required ? ' *' : ' (optional)'}</label>
      {hint && <p className={css.fieldsetHint}>{hint}</p>}
      <div className={css.docUploadRow}>
        <button
          type="button"
          className={css.docUploadBtn}
          onClick={() => ref.current?.click()}
        >
          {preview ? '✓ Uploaded — Change' : '📎 Upload photo'}
        </button>
        {preview && (
          <img src={preview} alt={label} className={css.docPreviewThumb} />
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className={css.fileInput}
        onChange={onFileChange}
      />
    </div>
  );
};

// ================ Step: Hauler Setup ================ //

const HaulerStep = ({ values, onChange, errors, docPreviews, onDocChange }) => {
  const hasCDLHitchSelected = (values.hitchTypes || []).some(h => h.endsWith('-cdl'));
  const requiresCDL = parseInt(values.maxTowCapacity || 0, 10) > CDL_THRESHOLD || hasCDLHitchSelected;

  const toggleHitch = val => {
    const current = values.hitchTypes || [];
    const next = current.includes(val)
      ? current.filter(h => h !== val)
      : [...current, val];
    onChange({ ...values, hitchTypes: next });
  };

  const hasOtherNonCDL = (values.hitchTypes || []).includes('other-ncdl');
  const hasOtherCDL = (values.hitchTypes || []).includes('other-cdl');

  return (
    <div>
      <h2 className={css.stepTitle}>Hauler details</h2>
      <p className={css.stepSubtitle}>
        We need a few details to verify you're qualified to haul equipment.
      </p>

      {/* Account type */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Account type *</legend>
        <div className={css.radioGroup}>
          {[{ value: 'individual', label: 'Individual' }, { value: 'business', label: 'Business' }].map(opt => (
            <label key={opt.value} className={css.radioLabel}>
              <input
                type="radio"
                name="accountType"
                value={opt.value}
                checked={values.accountType === opt.value}
                onChange={() => onChange({
                  ...values,
                  accountType: opt.value,
                  businessName: opt.value === 'individual' ? '' : values.businessName,
                  businessType: opt.value === 'individual' ? '' : values.businessType,
                })}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {values.accountType === 'business' && (
          <div className={css.fieldRow} style={{ marginTop: 14, flexWrap: 'wrap' }}>
            <div className={classNames(css.field, css.narrowField)}>
              <label className={css.label}>Business name *</label>
              <input
                className={classNames(css.input, { [css.inputError]: errors.businessName })}
                type="text"
                value={values.businessName || ''}
                onChange={e => onChange({ ...values, businessName: e.target.value })}
                placeholder="Acme Hauling LLC"
              />
              {errors.businessName && <p className={css.errorMsg}>{errors.businessName}</p>}
            </div>
            <div className={classNames(css.field, css.narrowField)}>
              <label className={css.label}>Business type *</label>
              <select
                className={classNames(css.select, { [css.inputError]: errors.businessType })}
                value={values.businessType || ''}
                onChange={e => onChange({ ...values, businessType: e.target.value })}
              >
                <option value="">Select...</option>
                {BUSINESS_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
              {errors.businessType && <p className={css.errorMsg}>{errors.businessType}</p>}
            </div>
          </div>
        )}
      </fieldset>

      {/* Driver's License */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Driver's License</legend>
        <div className={css.field} style={{ maxWidth: 220 }}>
          <label className={css.label}>License number *</label>
          <input
            className={classNames(css.input, { [css.inputError]: errors.licenseNumber })}
            type="text"
            value={values.licenseNumber}
            onChange={e => onChange({ ...values, licenseNumber: e.target.value })}
            placeholder="A1234567"
          />
          {errors.licenseNumber && <p className={css.errorMsg}>{errors.licenseNumber}</p>}
        </div>
        <div className={css.fieldRow} style={{ flexWrap: 'wrap', marginTop: 10 }}>
          <div className={classNames(css.field, css.fieldSm)}>
            <label className={css.label}>State *</label>
            <select
              className={classNames(css.select, { [css.inputError]: errors.licenseState })}
              value={values.licenseState}
              onChange={e => onChange({ ...values, licenseState: e.target.value })}
            >
              <option value="">Select...</option>
              {US_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
              ))}
            </select>
            {errors.licenseState && <p className={css.errorMsg}>{errors.licenseState}</p>}
          </div>
          <div className={classNames(css.field, css.fieldSm)}>
            <label className={css.label}>Expiry date *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.licenseExpiry })}
              type="date"
              value={values.licenseExpiry}
              min={TODAY}
              onChange={e => onChange({ ...values, licenseExpiry: e.target.value })}
            />
            {errors.licenseExpiry && <p className={css.errorMsg}>{errors.licenseExpiry}</p>}
          </div>
        </div>
      </fieldset>

      {/* Tow vehicle */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Tow vehicle</legend>
        <div className={css.fieldRow} style={{ flexWrap: 'wrap' }}>
          <div className={classNames(css.field, css.fieldXS)}>
            <label className={css.label}>Year *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.vehicleYear })}
              type="number"
              value={values.vehicleYear}
              onChange={e => onChange({ ...values, vehicleYear: e.target.value })}
              placeholder="2020"
              min="1990"
              max={new Date().getFullYear() + 1}
            />
            {errors.vehicleYear && <p className={css.errorMsg}>{errors.vehicleYear}</p>}
          </div>
          <div className={css.field}>
            <label className={css.label}>Make *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.vehicleMake })}
              type="text"
              value={values.vehicleMake}
              onChange={e => onChange({ ...values, vehicleMake: e.target.value })}
              placeholder="Ford"
            />
            {errors.vehicleMake && <p className={css.errorMsg}>{errors.vehicleMake}</p>}
          </div>
          <div className={css.field}>
            <label className={css.label}>Model *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.vehicleModel })}
              type="text"
              value={values.vehicleModel}
              onChange={e => onChange({ ...values, vehicleModel: e.target.value })}
              placeholder="F-350"
            />
            {errors.vehicleModel && <p className={css.errorMsg}>{errors.vehicleModel}</p>}
          </div>
        </div>
      </fieldset>

      {/* Vehicle registration + insurance uploads */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Documents</legend>
        <div className={css.fieldRow} style={{ flexWrap: 'wrap', gap: 20 }}>
          <DocUpload
            label="Vehicle registration"
            required={true}
            preview={docPreviews.registration}
            onFileChange={e => onDocChange('registration', e)}
            hint="Upload a photo of your current registration."
          />
          <div className={css.docUploadField}>
            <label className={css.label}>Insurance card *</label>
            <p className={css.fieldsetHint}>Upload a photo of your current insurance card.</p>
            <div className={css.docUploadRow}>
              <button
                type="button"
                className={css.docUploadBtn}
                onClick={() => document.getElementById('insuranceUpload')?.click()}
              >
                {docPreviews.insurance ? '✓ Uploaded — Change' : '📎 Upload photo'}
              </button>
              {docPreviews.insurance && (
                <img src={docPreviews.insurance} alt="Insurance" className={css.docPreviewThumb} />
              )}
            </div>
            <input
              id="insuranceUpload"
              type="file"
              accept="image/*"
              className={css.fileInput}
              onChange={e => onDocChange('insurance', e)}
            />
            {errors.insuranceDoc && <p className={css.errorMsg}>{errors.insuranceDoc}</p>}
          </div>
        </div>
        {errors.registrationDoc && <p className={css.errorMsg}>{errors.registrationDoc}</p>}
        <div className={css.fieldRow} style={{ flexWrap: 'wrap', marginTop: 14 }}>
          <div className={classNames(css.field, css.fieldSm)}>
            <label className={css.label}>Insurance expiry date *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.insuranceExpiry })}
              type="date"
              value={values.insuranceExpiry || ''}
              min={TODAY}
              onChange={e => onChange({ ...values, insuranceExpiry: e.target.value })}
            />
            {errors.insuranceExpiry && <p className={css.errorMsg}>{errors.insuranceExpiry}</p>}
          </div>
        </div>
      </fieldset>

      {/* How do you haul? — hitch types (two columns) */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>How do you haul? *</legend>
        <p className={css.fieldsetHint}>Select all that apply.</p>
        {errors.hitchTypes && <p className={css.errorMsg}>{errors.hitchTypes}</p>}
        <div className={css.hitchColumns}>
          <div className={css.hitchColumn}>
            <div className={css.hitchColumnHeader}>Non-CDL</div>
            {NON_CDL_HITCH_OPTIONS.map(opt => (
              <div key={opt.value}>
                <label className={css.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={(values.hitchTypes || []).includes(opt.value)}
                    onChange={() => toggleHitch(opt.value)}
                  />
                  {opt.label}
                </label>
                {opt.value === 'other-ncdl' && hasOtherNonCDL && (
                  <input
                    className={classNames(css.input, { [css.inputError]: errors.hitchTypeOtherNonCDL })}
                    type="text"
                    value={values.hitchTypeOtherNonCDL || ''}
                    onChange={e => onChange({ ...values, hitchTypeOtherNonCDL: e.target.value })}
                    placeholder="Describe your hitch type..."
                    style={{ marginTop: 6, width: '100%' }}
                  />
                )}
                {opt.value === 'other-ncdl' && errors.hitchTypeOtherNonCDL && (
                  <p className={css.errorMsg}>{errors.hitchTypeOtherNonCDL}</p>
                )}
              </div>
            ))}
          </div>
          <div className={css.hitchColumn}>
            <div className={css.hitchColumnHeader}>CDL</div>
            {CDL_HITCH_OPTIONS.map(opt => (
              <div key={opt.value}>
                <label className={css.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={(values.hitchTypes || []).includes(opt.value)}
                    onChange={() => toggleHitch(opt.value)}
                  />
                  {opt.label}
                </label>
                {opt.value === 'other-cdl' && hasOtherCDL && (
                  <input
                    className={classNames(css.input, { [css.inputError]: errors.hitchTypeOtherCDL })}
                    type="text"
                    value={values.hitchTypeOtherCDL || ''}
                    onChange={e => onChange({ ...values, hitchTypeOtherCDL: e.target.value })}
                    placeholder="Describe your hitch type..."
                    style={{ marginTop: 6, width: '100%' }}
                  />
                )}
                {opt.value === 'other-cdl' && errors.hitchTypeOtherCDL && (
                  <p className={css.errorMsg}>{errors.hitchTypeOtherCDL}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Tow capacity range */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Tow capacity range (lbs) *</legend>
        <div className={css.fieldRow} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className={css.field}>
            <label className={css.label}>Minimum *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.minTowCapacity })}
              type="number"
              value={values.minTowCapacity || ''}
              onChange={e => onChange({ ...values, minTowCapacity: e.target.value })}
              placeholder="0"
              min="0"
            />
            {errors.minTowCapacity && <p className={css.errorMsg}>{errors.minTowCapacity}</p>}
          </div>
          <div style={{ alignSelf: 'center', paddingTop: 20, color: '#9ca3af', fontWeight: 700 }}>-</div>
          <div className={css.field}>
            <label className={css.label}>Maximum *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.maxTowCapacity })}
              type="number"
              value={values.maxTowCapacity || ''}
              onChange={e => onChange({ ...values, maxTowCapacity: e.target.value })}
              placeholder="15000"
              min="1"
            />
            {errors.maxTowCapacity && <p className={css.errorMsg}>{errors.maxTowCapacity}</p>}
          </div>
        </div>
        {requiresCDL && (
          <div className={css.cdlAlert}>
            <strong>⚠️ CDL required</strong> - {hasCDLHitchSelected ? 'you selected a CDL hitch type.' : `hauling above ${CDL_THRESHOLD.toLocaleString()} lbs requires a CDL.`} Please fill in your CDL details below.
          </div>
        )}
      </fieldset>

      {/* CDL section - shown when weight > 26,000 lbs */}
      {requiresCDL && (
        <fieldset className={css.fieldset}>
          <legend className={css.fieldsetLegend}>Commercial Driver's License (CDL)</legend>
          <p className={css.fieldsetHint}>{hasCDLHitchSelected ? 'You selected a CDL hitch type — please provide your CDL details.' : `Your max capacity exceeds ${CDL_THRESHOLD.toLocaleString()} lbs — a CDL is required to haul at this weight.`}</p>

          {/* CDL number — own line */}
          <div className={css.field} style={{ maxWidth: 220 }}>
            <label className={css.label}>CDL number *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.cdlNumber })}
              type="text"
              value={values.cdlNumber || ''}
              onChange={e => onChange({ ...values, cdlNumber: e.target.value })}
              placeholder="CDL number"
            />
            {errors.cdlNumber && <p className={css.errorMsg}>{errors.cdlNumber}</p>}
          </div>

          {/* Class, state, expiry — in a row */}
          <div className={css.fieldRow} style={{ flexWrap: 'wrap', marginTop: 10 }}>
            <div className={css.field} style={{ maxWidth: 120 }}>
              <label className={css.label}>Class *</label>
              <select
                className={classNames(css.select, { [css.inputError]: errors.cdlClass })}
                value={values.cdlClass || ''}
                onChange={e => onChange({ ...values, cdlClass: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="A">Class A</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
              </select>
              {errors.cdlClass && <p className={css.errorMsg}>{errors.cdlClass}</p>}
            </div>
            <div className={css.field} style={{ maxWidth: 160 }}>
              <label className={css.label}>State *</label>
              <select
                className={classNames(css.select, { [css.inputError]: errors.cdlState })}
                value={values.cdlState || ''}
                onChange={e => onChange({ ...values, cdlState: e.target.value })}
              >
                <option value="">Select...</option>
                {US_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
              {errors.cdlState && <p className={css.errorMsg}>{errors.cdlState}</p>}
            </div>
            <div className={css.field} style={{ maxWidth: 180 }}>
              <label className={css.label}>Expiry date *</label>
              <input
                className={classNames(css.input, { [css.inputError]: errors.cdlExpiry })}
                type="date"
                value={values.cdlExpiry || ''}
                min={TODAY}
                onChange={e => onChange({ ...values, cdlExpiry: e.target.value })}
              />
              {errors.cdlExpiry && <p className={css.errorMsg}>{errors.cdlExpiry}</p>}
            </div>
          </div>

          {/* Med card — expiry + upload */}
          <fieldset className={css.fieldset} style={{ marginTop: 16, border: 'none', padding: 0 }}>
            <legend className={css.fieldsetLegend}>Medical Examiner's Certificate (med card) *</legend>
            <p className={css.fieldsetHint}>CDL drivers operating commercially are required to carry a valid FMCSA medical examiner's certificate.</p>
            <div className={css.fieldRow} style={{ flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 }}>
              <div className={classNames(css.field, css.fieldSm)}>
                <label className={css.label}>Expiry date *</label>
                <input
                  className={classNames(css.input, { [css.inputError]: errors.medCardExpiry })}
                  type="date"
                  value={values.medCardExpiry || ''}
                  min={TODAY}
                  onChange={e => onChange({ ...values, medCardExpiry: e.target.value })}
                />
                {errors.medCardExpiry && <p className={css.errorMsg}>{errors.medCardExpiry}</p>}
              </div>
              <DocUpload
                label="Med card photo"
                required={true}
                preview={docPreviews.medCard}
                onFileChange={e => onDocChange('medCard', e)}
                hint="Upload a photo of your current med card."
              />
            </div>
            {errors.medCardDoc && <p className={css.errorMsg}>{errors.medCardDoc}</p>}
          </fieldset>
        </fieldset>
      )}
    </div>
  );
};

// ================ Step: Complete ================ //

const CompleteStep = ({ userRoles, basicInfo, haulerDetails, onGoHome }) => {
  const roleLabels = {
    owner: 'Equipment Owner',
    renter: 'Renter',
    hauler: 'Hauler',
  };

  return (
    <div className={css.completeStep}>
      <div className={css.completeIcon}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="28" fill="#E8450A" fillOpacity="0.1" />
          <circle cx="28" cy="28" r="20" fill="#E8450A" />
          <path d="M19 28l6 6 12-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className={css.completeTitle}>You're all set, {basicInfo.firstName || 'there'}!</h2>
      <p className={css.completeSubtitle}>
        Your IronPeer profile is ready. Here's a summary of what you set up:
      </p>

      <div className={css.summaryCard}>
        <div className={css.summaryRow}>
          <span className={css.summaryLabel}>Name</span>
          <span className={css.summaryValue}>
            {[basicInfo.firstName, basicInfo.lastName].filter(Boolean).join(' ') || '-'}
          </span>
        </div>
        {basicInfo.bio ? (
          <div className={css.summaryRow}>
            <span className={css.summaryLabel}>Bio</span>
            <span className={css.summaryValue}>{basicInfo.bio}</span>
          </div>
        ) : null}
        <div className={css.summaryRow}>
          <span className={css.summaryLabel}>Roles</span>
          <span className={css.summaryValue}>
            {userRoles.length > 0
              ? userRoles.map(r => roleLabels[r] || r).join(', ')
              : 'Not set'}
          </span>
        </div>
        {userRoles.includes('hauler') && haulerDetails.vehicleYear ? (
          <div className={css.summaryRow}>
            <span className={css.summaryLabel}>Vehicle</span>
            <span className={css.summaryValue}>
              {haulerDetails.vehicleYear} {haulerDetails.vehicleMake} {haulerDetails.vehicleModel}
            </span>
          </div>
        ) : null}
      </div>

      <div className={css.completeActions}>
        {userRoles.includes('owner') && (
          <NamedLink name="NewListingPage" className={css.primaryBtn} style={{ textDecoration: 'none', textAlign: 'center', display: 'flex' }}>
            Create your first listing →
          </NamedLink>
        )}
        {!userRoles.includes('owner') && userRoles.includes('renter') && (
          <NamedLink name="SearchPage" className={css.primaryBtn} style={{ textDecoration: 'none', textAlign: 'center', display: 'flex' }}>
            Browse listings →
          </NamedLink>
        )}
        <button className={css.secondaryBtn} onClick={onGoHome}>
          Go to my account
        </button>
      </div>
    </div>
  );
};

// ================ Main Page Component ================ //

/**
 * ProfileCompletionPage - multi-step wizard shown after first signup.
 * Shown when currentUser.attributes.profile.publicData.profileComplete !== true.
 */
const ProfileCompletionPage = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const currentUser = useSelector(state => state.user?.currentUser);
  const { updateInProgress, updateError, uploadInProgress, uploadError } = useSelector(
    state => state.ProfileCompletionPage || {}
  );

  const emailVerified = currentUser?.attributes?.emailVerified;
  const profile = currentUser?.attributes?.profile || {};
  const publicData = profile.publicData || {};
  const protectedData = profile.protectedData || {};
  const savedRoles = publicData.userRoles || [];

  // ---- Role selection state (step 0) ----
  const [selectedRoles, setSelectedRoles] = useState(savedRoles);
  const [roleError, setRoleError] = useState(null);

  const steps = buildSteps(selectedRoles);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  // ---- Basic info form state ----
  const [basicInfo, setBasicInfo] = useState({
    firstName: profile.firstName !== 'New' ? (profile.firstName || '') : '',
    lastName: profile.lastName !== 'Member' ? (profile.lastName || '') : '',
    phone: protectedData.phoneNumber || '',
    bio: profile.bio || '',
  });
  const [basicInfoErrors, setBasicInfoErrors] = useState({});
  const [emailGateError, setEmailGateError] = useState(null);

  // ---- Photo state ----
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  // ---- Hauler form state ----
  const [haulerDetails, setHaulerDetails] = useState({
    accountType: 'individual',
    businessName: '',
    businessType: '',
    licenseNumber: '',
    licenseState: '',
    licenseExpiry: '',
    insuranceExpiry: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    hitchTypes: [],
    hitchTypeOtherNonCDL: '',
    hitchTypeOtherCDL: '',
    minTowCapacity: '',
    maxTowCapacity: '',
    cdlNumber: '',
    cdlClass: '',
    cdlState: '',
    cdlExpiry: '',
    medCardExpiry: '',
  });
  const [haulerErrors, setHaulerErrors] = useState({});

  // ---- Document upload previews (registration, insurance, medCard) ----
  const [docPreviews, setDocPreviews] = useState({ registration: null, insurance: null, medCard: null });

  const handleDocChange = (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocPreviews(prev => ({ ...prev, [docKey]: URL.createObjectURL(file) }));
  };

  // ---- Validation ----
  const validateBasicInfo = () => {
    const errs = {};
    if (!basicInfo.firstName.trim()) errs.firstName = 'First name is required';
    if (!basicInfo.lastName.trim()) errs.lastName = 'Last name is required';
    if (!basicInfo.phone?.trim()) errs.phone = 'Phone number is required';
    setBasicInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateHauler = () => {
    const errs = {};
    const today = TODAY;
    // Required base fields
    ['licenseNumber', 'licenseState', 'licenseExpiry', 'vehicleYear', 'vehicleMake', 'vehicleModel'].forEach(f => {
      if (!haulerDetails[f]) errs[f] = 'Required';
    });
    // Expiry dates must be in the future
    if (haulerDetails.licenseExpiry && haulerDetails.licenseExpiry < today) {
      errs.licenseExpiry = 'Expiry date must be today or later';
    }
    if (haulerDetails.insuranceExpiry && haulerDetails.insuranceExpiry < today) {
      errs.insuranceExpiry = 'Expiry date must be today or later';
    }
    // Insurance expiry required
    if (!haulerDetails.insuranceExpiry) errs.insuranceExpiry = 'Required';
    // Doc uploads required
    if (!docPreviews.registration) errs.registrationDoc = 'Vehicle registration photo is required';
    if (!docPreviews.insurance) errs.insuranceDoc = 'Insurance card photo is required';
    // Business fields
    if (haulerDetails.accountType === 'business') {
      if (!haulerDetails.businessName?.trim()) errs.businessName = 'Business name is required';
      if (!haulerDetails.businessType) errs.businessType = 'Business type is required';
    }
    // At least one hitch type
    if (!haulerDetails.hitchTypes?.length) {
      errs.hitchTypes = 'Select at least one hitch type';
    }
    // Other hitch descriptions required when selected
    if ((haulerDetails.hitchTypes || []).includes('other-ncdl') && !haulerDetails.hitchTypeOtherNonCDL?.trim()) {
      errs.hitchTypeOtherNonCDL = 'Please describe your hitch type';
    }
    if ((haulerDetails.hitchTypes || []).includes('other-cdl') && !haulerDetails.hitchTypeOtherCDL?.trim()) {
      errs.hitchTypeOtherCDL = 'Please describe your hitch type';
    }
    // Tow capacity range
    if (haulerDetails.minTowCapacity === '' || haulerDetails.minTowCapacity === undefined) {
      errs.minTowCapacity = 'Required';
    }
    if (!haulerDetails.maxTowCapacity) {
      errs.maxTowCapacity = 'Required';
    } else if (parseInt(haulerDetails.maxTowCapacity, 10) <= parseInt(haulerDetails.minTowCapacity || 0, 10)) {
      errs.maxTowCapacity = 'Maximum must be greater than minimum';
    }
    // CDL fields required if weight over threshold
    if (parseInt(haulerDetails.maxTowCapacity || 0, 10) > CDL_THRESHOLD) {
      ['cdlNumber', 'cdlClass', 'cdlState', 'cdlExpiry'].forEach(f => {
        if (!haulerDetails[f]) errs[f] = 'Required';
      });
      if (haulerDetails.cdlExpiry && haulerDetails.cdlExpiry < today) {
        errs.cdlExpiry = 'Expiry date must be today or later';
      }
      if (!haulerDetails.medCardExpiry) errs.medCardExpiry = 'Required';
      if (haulerDetails.medCardExpiry && haulerDetails.medCardExpiry < today) {
        errs.medCardExpiry = 'Expiry date must be today or later';
      }
      if (!docPreviews.medCard) errs.medCardDoc = 'Med card photo is required';
    }
    setHaulerErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Photo handler ----
  const handlePhotoChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    dispatch(uploadImageThunk({ file })).then(action => {
      if (action.payload?.id) {
        setUploadedImageId(action.payload.id);
      }
    });
  };

  // ---- Final save ----
  const handleFinalSave = useCallback(async () => {
    const updatePayload = {
      firstName: basicInfo.firstName.trim() || '',
      lastName: basicInfo.lastName.trim() || '',
      bio: basicInfo.bio || '',
      publicData: {
        userRoles: selectedRoles,
        profileComplete: true,
        ...(selectedRoles.includes('owner') ? { ownerSetupComplete: true } : {}),
        ...(selectedRoles.includes('renter') ? { renterSetupComplete: true } : {}),
      },
      protectedData: {
        phoneNumber: basicInfo.phone?.trim() || '',
      },
    };

    if (selectedRoles.includes('hauler')) {
      const requiresCDL = parseInt(haulerDetails.maxTowCapacity || 0, 10) > CDL_THRESHOLD;
      updatePayload.protectedData = {
        haulerDetails: {
          accountType: haulerDetails.accountType,
          ...(haulerDetails.accountType === 'business' ? { businessName: haulerDetails.businessName } : {}),
          licenseNumber: haulerDetails.licenseNumber,
          licenseState: haulerDetails.licenseState,
          licenseExpiry: haulerDetails.licenseExpiry,
          vehicleYear: parseInt(haulerDetails.vehicleYear, 10),
          vehicleMake: haulerDetails.vehicleMake,
          vehicleModel: haulerDetails.vehicleModel,
          hitchTypes: haulerDetails.hitchTypes,
          minTowCapacity: parseInt(haulerDetails.minTowCapacity || 0, 10),
          maxTowCapacity: parseInt(haulerDetails.maxTowCapacity, 10),
          requiresCDL,
          ...(requiresCDL ? {
            cdlNumber: haulerDetails.cdlNumber,
            cdlClass: haulerDetails.cdlClass,
            cdlState: haulerDetails.cdlState,
            cdlExpiry: haulerDetails.cdlExpiry,
            hasMedCard: haulerDetails.hasMedCard === 'yes',
          } : {}),
        },
      };
    }

    if (uploadedImageId) {
      updatePayload.profileImageId = uploadedImageId;
    }

    const result = await dispatch(updateProfileThunk(updatePayload));
    if (!result.error) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [dispatch, basicInfo, haulerDetails, uploadedImageId, selectedRoles, profile]);

  // ---- Navigation ----
  const handleNext = useCallback(async () => {
    if (currentStep.id === 'roleSelection') {
      if (selectedRoles.length === 0) {
        setRoleError('Please select at least one option to continue.');
        return;
      }
      setRoleError(null);
    }
    if (currentStep.id === 'basicInfo') {
      if (!validateBasicInfo()) return;
      if (!emailVerified) {
        setEmailGateError('Please verify your email address before continuing. Check your inbox for the verification link.');
        return;
      }
      setEmailGateError(null);
    }
    if (currentStep.id === 'photo') {
      if (!uploadedImageId) {
        setPhotoError('A profile photo is required. Please upload a photo to continue.');
        return;
      }
      setPhotoError(null);
    }
    if (currentStep.id === 'hauler' && !validateHauler()) return;

    const isLastDataStep = currentStepIndex === steps.length - 2;
    if (isLastDataStep) {
      await handleFinalSave();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, currentStepIndex, steps, handleFinalSave]);

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleGoHome = () => {
    history.push('/profile-settings');
  };

  // ---- Render current step content ----
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'roleSelection':
        return (
          <RoleSelectionStep
            selectedRoles={selectedRoles}
            onChange={setSelectedRoles}
            error={roleError}
          />
        );
      case 'basicInfo':
        return (
          <div>
            <BasicInfoStep
              values={basicInfo}
              onChange={setBasicInfo}
              errors={basicInfoErrors}
            />
            {emailGateError && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#b91c1c', fontSize: 14 }}>
                <strong>Email not verified.</strong> {emailGateError}
              </div>
            )}
          </div>
        );
      case 'photo':
        return (
          <PhotoStep
            preview={photoPreview}
            onFileChange={handlePhotoChange}
            uploadInProgress={uploadInProgress}
            uploadError={uploadError}
            photoError={photoError}
          />
        );
      case 'owner':
        return <OwnerStep />;
      case 'renter':
        return <RenterStep />;

      case 'hauler':
        return (
          <HaulerStep
            values={haulerDetails}
            onChange={setHaulerDetails}
            errors={haulerErrors}
            docPreviews={docPreviews}
            onDocChange={handleDocChange}
          />
        );
      case 'complete':
        return (
          <CompleteStep
            userRoles={selectedRoles}
            basicInfo={basicInfo}
            haulerDetails={haulerDetails}
            onGoHome={handleGoHome}
          />
        );
      default:
        return null;
    }
  };

  const isComplete = currentStep.id === 'complete';
  const isFirstStep = currentStepIndex === 0;

  // ---- Email verification hard gate ----
  if (currentUser && !emailVerified) {
    return (
      <Page title="Verify your email - IronPeer" scrollingDisabled={false}>
        <TopbarContainer />
        <div className={css.root}>
          <div className={css.card}>
            <div className={css.header}>
              <div className={css.headerBadge}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#E8450A" fillOpacity="0.12" />
                  <path d="M6 10h8M10 6v8" stroke="#E8450A" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>IronPeer Setup</span>
              </div>
            </div>
            <div className={css.stepContent} style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h2 className={css.stepTitle}>Verify your email to continue</h2>
              <p className={css.stepSubtitle}>
                We sent a verification link to <strong>{currentUser?.attributes?.email}</strong>. Please check your inbox and click the link before continuing.
              </p>
              <p style={{ marginTop: 16, fontSize: 13, color: '#6b7280' }}>
                Already verified? <button style={{ background: 'none', border: 'none', color: '#E8450A', cursor: 'pointer', fontWeight: 600 }} onClick={() => window.location.reload()}>Refresh this page</button>
              </p>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Complete your profile - IronPeer" scrollingDisabled={false}>
      <TopbarContainer />
      <div className={css.root}>
        <div className={css.card}>
          {/* Header */}
          <div className={css.header}>
            <div className={css.headerBadge}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#E8450A" fillOpacity="0.12" />
                <path d="M6 10h8M10 6v8" stroke="#E8450A" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>IronPeer Setup</span>
            </div>
          </div>

          {/* Step indicator */}
          {!isComplete && (
            <StepIndicator steps={steps} currentIndex={currentStepIndex} />
          )}

          {/* Step content */}
          <div className={css.stepContent}>
            {renderStepContent()}
          </div>

          {/* Navigation */}
          {!isComplete && (
            <div className={css.navigation}>
              {!isFirstStep && (
                <button
                  type="button"
                  className={css.backBtn}
                  onClick={handleBack}
                  disabled={updateInProgress}
                >
                  ← Back
                </button>
              )}

              <button
                type="button"
                className={css.primaryBtn}
                onClick={handleNext}
                disabled={updateInProgress || uploadInProgress}
              >
                {updateInProgress ? (
                  <span className={css.btnSpinner}><IconSpinner /></span>
                ) : currentStepIndex === steps.length - 2 ? (
                  'Finish setup'
                ) : (
                  'Next →'
                )}
              </button>
            </div>
          )}

          {/* Save error */}
          {updateError && (
            <p className={css.saveError}>
              Something went wrong saving your profile. Please try again.
            </p>
          )}
        </div>
      </div>
    </Page>
  );
};

export default ProfileCompletionPage;
