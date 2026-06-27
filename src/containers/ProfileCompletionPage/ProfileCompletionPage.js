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

const HITCH_OPTIONS = [
  { value: 'bumper-pull',  label: 'Bumper pull' },
  { value: 'pole',         label: 'Pole trailer' },
  { value: 'gooseneck',    label: 'Gooseneck' },
  { value: 'kingpin',      label: 'Kingpin (5th wheel)' },
  { value: 'pintle',       label: 'Pintle hitch' },
];

// ================ Step builder ================ //

const buildSteps = (userRoles = []) => {
  const steps = [
    { id: 'basicInfo', label: 'Basic Info' },
    { id: 'photo', label: 'Profile Photo' },
  ];
  if (userRoles.includes('owner')) {
    steps.push({ id: 'owner', label: 'Payout Setup' });
  }
  if (userRoles.includes('renter')) {
    steps.push({ id: 'renter', label: 'Verify Identity' });
  }
  if (userRoles.includes('hauler')) {
    steps.push({ id: 'hauler', label: 'Hauler Details' });
  }
  steps.push({ id: 'complete', label: 'All Set!' });
  return steps;
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

const PhotoStep = ({ preview, onFileChange, uploadInProgress, uploadError }) => {
  const fileInputRef = useRef(null);

  return (
    <div>
      <h2 className={css.stepTitle}>Add a profile photo</h2>
      <p className={css.stepSubtitle}>
        A photo helps build trust with other members. You can always update it later.
      </p>

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

      <p className={css.skipNote}>You can skip this step and add a photo later.</p>
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

// ================ Step: Hauler Setup ================ //

const HaulerStep = ({ values, onChange, errors }) => {
  const requiresCDL = parseInt(values.maxTowCapacity || 0, 10) > CDL_THRESHOLD;

  const toggleHitch = val => {
    const current = values.hitchTypes || [];
    const next = current.includes(val)
      ? current.filter(h => h !== val)
      : [...current, val];
    onChange({ ...values, hitchTypes: next });
  };

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
                })}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {values.accountType === 'business' && (
          <div className={classNames(css.field, css.narrowField)} style={{ marginTop: 14 }}>
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
        )}
      </fieldset>

      {/* Driver's License */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Driver's License</legend>
        <div className={css.fieldRow}>
          <div className={classNames(css.field, css.fieldMd)}>
            <label className={css.label}>License number *</label>
            <input
              className={classNames(css.input, { [css.inputError]: errors.licenseNumber })}
              type="text"
              value={values.licenseNumber}
              onChange={e => onChange({ ...values, licenseNumber: e.target.value })}
              placeholder="A1234567"
              style={{ width: '160px' }}
            />
            {errors.licenseNumber && <p className={css.errorMsg}>{errors.licenseNumber}</p>}
          </div>
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
              onChange={e => onChange({ ...values, licenseExpiry: e.target.value })}
            />
            {errors.licenseExpiry && <p className={css.errorMsg}>{errors.licenseExpiry}</p>}
          </div>
        </div>
      </fieldset>

      {/* Tow vehicle */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Tow vehicle</legend>
        <div className={css.fieldRow}>
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

      {/* What do you haul with — hitch types */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>What do you haul with? *</legend>
        <p className={css.fieldsetHint}>Select all that apply.</p>
        {errors.hitchTypes && <p className={css.errorMsg}>{errors.hitchTypes}</p>}
        <div className={css.checkboxGroup}>
          {HITCH_OPTIONS.map(opt => (
            <label key={opt.value} className={css.checkboxLabel}>
              <input
                type="checkbox"
                checked={(values.hitchTypes || []).includes(opt.value)}
                onChange={() => toggleHitch(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Tow capacity range */}
      <fieldset className={css.fieldset}>
        <legend className={css.fieldsetLegend}>Tow capacity range (lbs) *</legend>
        <div className={css.fieldRow} style={{ alignItems: 'flex-start' }}>
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
            <strong>⚠️ CDL may be required</strong> - hauling above {CDL_THRESHOLD.toLocaleString()} lbs typically requires a Commercial Driver's License. Please fill in your CDL details below.
          </div>
        )}
      </fieldset>

      {/* CDL section - shown when weight > 26,000 lbs */}
      {requiresCDL && (
        <fieldset className={css.fieldset}>
          <legend className={css.fieldsetLegend}>Commercial Driver's License (CDL)</legend>
          <p className={css.fieldsetHint}>Your max capacity exceeds {CDL_THRESHOLD.toLocaleString()} lbs - a CDL is required to haul at this weight.</p>
          <div className={css.fieldRow}>
            <div className={css.field} style={{ maxWidth: 200 }}>
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
                onChange={e => onChange({ ...values, cdlExpiry: e.target.value })}
              />
              {errors.cdlExpiry && <p className={css.errorMsg}>{errors.cdlExpiry}</p>}
            </div>
          </div>
          <div className={css.field} style={{ marginTop: 12 }}>
            <label className={css.label}>Do you have a current medical examiner's certificate (med card)? *</label>
            <div className={css.radioGroup}>
              {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }].map(opt => (
                <label key={opt.value} className={css.radioLabel}>
                  <input
                    type="radio"
                    name="hasMedCard"
                    value={opt.value}
                    checked={values.hasMedCard === opt.value}
                    onChange={() => onChange({ ...values, hasMedCard: opt.value })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.hasMedCard && <p className={css.errorMsg}>{errors.hasMedCard}</p>}
          </div>
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

      <button className={css.primaryBtn} onClick={onGoHome} style={{ marginTop: 32 }}>
        Go to IronPeer →
      </button>
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

  const profile = currentUser?.attributes?.profile || {};
  const publicData = profile.publicData || {};
  const userRoles = publicData.userRoles || [];

  const steps = buildSteps(userRoles);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  // ---- Basic info form state ----
  const [basicInfo, setBasicInfo] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    bio: profile.bio || '',
  });
  const [basicInfoErrors, setBasicInfoErrors] = useState({});

  // ---- Photo state ----
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);

  // ---- Hauler form state ----
  const [haulerDetails, setHaulerDetails] = useState({
    accountType: 'individual',
    businessName: '',
    licenseNumber: '',
    licenseState: '',
    licenseExpiry: '',
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
    hasMedCard: '',
  });
  const [haulerErrors, setHaulerErrors] = useState({});

  // ---- Validation ----
  const validateBasicInfo = () => {
    const errs = {};
    if (!basicInfo.firstName.trim()) errs.firstName = 'First name is required';
    if (!basicInfo.lastName.trim()) errs.lastName = 'Last name is required';
    setBasicInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateHauler = () => {
    const errs = {};
    // Required base fields
    ['licenseNumber', 'licenseState', 'licenseExpiry', 'vehicleYear', 'vehicleMake', 'vehicleModel'].forEach(f => {
      if (!haulerDetails[f]) errs[f] = 'Required';
    });
    // Business name required if business
    if (haulerDetails.accountType === 'business' && !haulerDetails.businessName?.trim()) {
      errs.businessName = 'Business name is required';
    }
    // At least one hitch type
    if (!haulerDetails.hitchTypes?.length) {
      errs.hitchTypes = 'Select at least one hitch type';
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
      if (!haulerDetails.hasMedCard) errs.hasMedCard = 'Required';
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
      firstName: basicInfo.firstName.trim() || profile.firstName || '',
      lastName: basicInfo.lastName.trim() || profile.lastName || '',
      bio: basicInfo.bio || '',
      publicData: {
        profileComplete: true,
        ...(userRoles.includes('owner') ? { ownerSetupComplete: true } : {}),
        ...(userRoles.includes('renter') ? { renterSetupComplete: true } : {}),
      },
    };

    if (userRoles.includes('hauler')) {
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
  }, [dispatch, basicInfo, haulerDetails, uploadedImageId, userRoles, profile]);

  // ---- Navigation ----
  const handleNext = useCallback(async () => {
    if (currentStep.id === 'basicInfo' && !validateBasicInfo()) return;
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
    history.push('/');
  };

  // ---- Render current step content ----
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'basicInfo':
        return (
          <BasicInfoStep
            values={basicInfo}
            onChange={setBasicInfo}
            errors={basicInfoErrors}
          />
        );
      case 'photo':
        return (
          <PhotoStep
            preview={photoPreview}
            onFileChange={handlePhotoChange}
            uploadInProgress={uploadInProgress}
            uploadError={uploadError}
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
          />
        );
      case 'complete':
        return (
          <CompleteStep
            userRoles={userRoles}
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
