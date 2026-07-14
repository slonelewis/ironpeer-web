import React, { useState } from 'react';
import classNames from 'classnames';

import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { H3, PrimaryButton } from '../../../../components';

import css from './EditListingProtectionPanel.module.css';
import FlatbedTrailerIcon from '../../../../components/FlatbedTrailerIcon';

/**
 * Protection panel for the EditListing wizard.
 *
 * Collects road-legal status, owner insurance info, and deductible amount.
 * Insurance is REQUIRED. IronPeer does not provide insurance — the renter's
 * security hold covers the owner's deductible in the event of a damage claim.
 *
 * Data stored in privateData:
 *   isRoadLegal                boolean
 *   registration               { fileName, expiresAt } | null
 *   insuranceCarrier           string
 *   insurancePolicyNumber      string
 *   insuranceDeductible        number (dollars)
 *   insurance                  { fileName, expiresAt }
 *   ironpeerRoleAccepted       boolean  — owner acknowledged IronPeer only covers deductible
 *   trailerRegistration        { fileName, expiresAt }  (trailer-ready only)
 *   trailerHasInsurance        boolean
 *   trailerInsuranceSamePolicy boolean
 *   trailerInsurance           { fileName, expiresAt } | null
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
    updateInProgress,
    errors,
    updatePageTitle,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const publicData = listing?.attributes?.publicData || {};
  const isTrailerCategory = publicData.categoryLevel1 === 'Haulers_and_trailers';
  const isTrailerReady = publicData.trailerReady === true;

  const privateData = listing?.attributes?.privateData || {};

  // Road-legal
  const [isRoadLegal, setIsRoadLegal] = useState(
    isTrailerCategory ? true : (privateData.isRoadLegal !== undefined ? privateData.isRoadLegal : null)
  );
  const [regFileName, setRegFileName] = useState(privateData.registration?.fileName || '');
  const [regExpiry, setRegExpiry] = useState(privateData.registration?.expiresAt?.slice(0, 10) || '');

  // Insurance (required)
  const [insuranceCarrier, setInsuranceCarrier] = useState(privateData.insuranceCarrier || '');
  const [policyNumber, setPolicyNumber] = useState(privateData.insurancePolicyNumber || '');
  const [deductible, setDeductible] = useState(
    privateData.insuranceDeductible !== undefined ? String(privateData.insuranceDeductible) : ''
  );
  const [insFileName, setInsFileName] = useState(privateData.insurance?.fileName || '');
  const [insExpiry, setInsExpiry] = useState(privateData.insurance?.expiresAt?.slice(0, 10) || '');

  // Owner acknowledgment
  const [ironpeerRoleAccepted, setIronpeerRoleAccepted] = useState(
    privateData.ironpeerRoleAccepted || false
  );

  // Trailer docs
  const [trailerRegFileName, setTrailerRegFileName] = useState(privateData.trailerRegistration?.fileName || '');
  const [trailerRegExpiry, setTrailerRegExpiry] = useState(privateData.trailerRegistration?.expiresAt?.slice(0, 10) || '');
  const [trailerHasInsurance, setTrailerHasInsurance] = useState(
    privateData.trailerHasInsurance !== undefined ? privateData.trailerHasInsurance : null
  );
  const [trailerInsFileName, setTrailerInsFileName] = useState(privateData.trailerInsurance?.fileName || '');
  const [trailerInsExpiry, setTrailerInsExpiry] = useState(privateData.trailerInsurance?.expiresAt?.slice(0, 10) || '');
  const [trailerInsuranceSamePolicy, setTrailerInsuranceSamePolicy] = useState(
    privateData.trailerInsuranceSamePolicy !== undefined ? privateData.trailerInsuranceSamePolicy : null
  );

  const [submitError, setSubmitError] = useState(null);

  const handleFileChange = setter => e => {
    const file = e.target.files?.[0];
    if (file) setter(file.name);
  };

  const validate = () => {
    if (isRoadLegal === null) return 'Please indicate whether this equipment is road-legal.';
    if (isRoadLegal && !regExpiry) return 'Please enter the registration expiration date.';
    if (!insuranceCarrier.trim()) return 'Please enter your insurance carrier name.';
    if (!policyNumber.trim()) return 'Please enter your policy number.';
    const ded = parseFloat(deductible);
    if (!deductible || isNaN(ded) || ded < 0) return 'Please enter a valid deductible amount.';
    if (!insExpiry) return 'Please enter your insurance expiration date.';
    if (!ironpeerRoleAccepted) return 'You must acknowledge IronPeer\'s role before continuing.';
    if (isTrailerReady) {
      if (!trailerRegExpiry) return 'Please enter the trailer registration expiration date.';
      if (trailerHasInsurance === null) return 'Please indicate whether your trailer is covered by insurance.';
      if (trailerHasInsurance && trailerInsuranceSamePolicy === null) return 'Please indicate whether the trailer is on the same policy.';
      if (trailerHasInsurance && !trailerInsuranceSamePolicy && !trailerInsExpiry) return 'Please enter the trailer insurance expiration date.';
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) { setSubmitError(error); return; }
    setSubmitError(null);

    onSubmit({
      privateData: {
        isRoadLegal,
        registration: isRoadLegal
          ? { fileName: regFileName || null, expiresAt: regExpiry ? new Date(regExpiry).toISOString() : null }
          : null,
        insuranceCarrier: insuranceCarrier.trim(),
        insurancePolicyNumber: policyNumber.trim(),
        insuranceDeductible: parseFloat(deductible),
        insurance: {
          fileName: insFileName || null,
          expiresAt: insExpiry ? new Date(insExpiry).toISOString() : null,
        },
        ironpeerRoleAccepted,
        ...(isTrailerReady ? {
          trailerRegistration: {
            fileName: trailerRegFileName || null,
            expiresAt: trailerRegExpiry ? new Date(trailerRegExpiry).toISOString() : null,
          },
          trailerHasInsurance,
          trailerInsuranceSamePolicy: trailerHasInsurance ? trailerInsuranceSamePolicy : null,
          trailerInsurance: trailerHasInsurance && !trailerInsuranceSamePolicy ? {
            fileName: trailerInsFileName || null,
            expiresAt: trailerInsExpiry ? new Date(trailerInsExpiry).toISOString() : null,
          } : null,
        } : {}),
      },
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className={classes}>
      {updatePageTitle?.({ panelHeading: 'Protection & Insurance' })}

      <H3 as="h1">Protection &amp; Insurance</H3>

      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        All equipment listed on IronPeer must be covered by an active insurance policy.
        When renters book, IronPeer collects a security hold equal to your deductible —
        so if damage happens and your insurance pays out, your out-of-pocket cost is <strong>$0</strong>.
      </p>

      {/* ── ROAD LEGAL ── */}
      {isTrailerCategory ? (
        <div style={{ fontSize: '0.875rem', color: '#555', marginBottom: '1.5rem', padding: '0.75rem', background: '#fff8f5', border: '1px solid #E8450A33', borderRadius: '6px' }}>
          <FlatbedTrailerIcon width={18} height={11} style={{ marginRight: '6px', color: '#E8450A' }} />
          <strong>Trailers and haulers are road-legal by default.</strong> Registration is required.
        </div>
      ) : (
        <>
          <div className={css.sectionTitle}>Is this equipment road-legal?</div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
            Examples: trailers, tow vehicles, equipment that travels on public roads.
          </p>
          <div className={css.buttonGroup}>
            <button type="button"
              className={isRoadLegal === true ? css.optionButtonActive : css.optionButton}
              onClick={() => setIsRoadLegal(true)}>
              Yes — it&apos;s road-legal
            </button>
            <button type="button"
              className={isRoadLegal === false ? css.optionButtonActive : css.optionButton}
              onClick={() => setIsRoadLegal(false)}>
              No — off-road / yard equipment only
            </button>
          </div>
        </>
      )}

      {isRoadLegal === true && (
        <div className={css.subSection}>
          <strong>Registration required</strong>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0.75rem' }}>
            Road-legal equipment must have a valid registration on file. Your listing will be automatically unpublished if registration expires.
          </p>
          <div className={css.uploadField}>
            <label className={css.uploadLabel}>Upload registration document</label>
            <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange(setRegFileName)} />
            {regFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {regFileName}</p>}
          </div>
          <label className={css.uploadLabel}>Registration expiration date *</label>
          <input type="date" className={css.dateInput} value={regExpiry} min={today}
            onChange={e => setRegExpiry(e.target.value)} />
        </div>
      )}

      {isRoadLegal === false && (
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px' }}>
          No registration required for off-road equipment. 👍
          {isTrailerReady && (
            <div style={{ marginTop: '0.5rem', color: '#E8450A', fontWeight: 500 }}>
              <FlatbedTrailerIcon width={18} height={11} style={{ marginRight: '6px', color: '#E8450A' }} />
              Your equipment doesn&apos;t need registration, but the trailer it&apos;s loaded on does — see the Trailer Documentation section below.
            </div>
          )}
        </div>
      )}

      {/* ── INSURANCE (REQUIRED) ── */}
      <div className={css.sectionTitle} style={{ marginTop: '1.5rem' }}>Insurance Information <span style={{ color: '#E8450A' }}>*</span></div>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Insurance is <strong>required</strong> to list on IronPeer. Enter your policy details below.
        IronPeer will collect a security hold from renters equal to your deductible — if damage
        occurs and your insurance pays out, your out-of-pocket is <strong>$0</strong>.
      </p>

      <div className={css.subSection}>
        <label className={css.uploadLabel}>Insurance carrier *</label>
        <input
          type="text"
          className={css.textInput}
          placeholder="e.g. State Farm, Progressive, Farmers"
          value={insuranceCarrier}
          onChange={e => setInsuranceCarrier(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }}
        />

        <label className={css.uploadLabel}>Policy number *</label>
        <input
          type="text"
          className={css.textInput}
          placeholder="e.g. HO-123456789"
          value={policyNumber}
          onChange={e => setPolicyNumber(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }}
        />

        <label className={css.uploadLabel}>Deductible amount *</label>
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '-0.25rem 0 0.5rem' }}>
          IronPeer will hold this exact amount from renters to cover your deductible if damage is claimed.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>$</span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 500"
            value={deductible}
            onChange={e => setDeductible(e.target.value)}
            style={{ width: '160px', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem' }}
          />
        </div>

        <div className={css.uploadField}>
          <label className={css.uploadLabel}>Upload proof of insurance (optional but recommended)</label>
          <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange(setInsFileName)} />
          {insFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {insFileName}</p>}
        </div>

        <label className={css.uploadLabel}>Insurance expiration date *</label>
        <input type="date" className={css.dateInput} value={insExpiry} min={today}
          onChange={e => setInsExpiry(e.target.value)} />
      </div>

      {/* ── OWNER ACKNOWLEDGMENT ── */}
      <div className={css.disclaimer} style={{ marginTop: '1.5rem', boxSizing: 'border-box', width: '100%' }}>
        <p className={css.disclaimerText} style={{ marginBottom: '0.75rem' }}>
          <strong>Understanding IronPeer's role in damage claims:</strong>
        </p>
        <p className={css.disclaimerText}>
          IronPeer is a marketplace platform, not an insurance provider. In the event of damage,
          IronPeer will collect the security hold from the renter (equal to your disclosed deductible)
          and facilitate the claim process. Your insurance policy is the primary coverage for damage
          beyond the deductible. IronPeer is not responsible for damage costs that exceed the
          renter's security hold.
        </p>
        <label className={css.checkboxLabel} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={ironpeerRoleAccepted}
            onChange={e => setIronpeerRoleAccepted(e.target.checked)}
            style={{ marginTop: '2px', flexShrink: 0 }}
          />
          <span className={css.checkboxText}>
            I understand that IronPeer is only responsible for collecting a security hold equal to my
            insurance deductible. My insurance policy is the primary coverage for any damage claim.
            IronPeer is not liable for damages exceeding the renter's security hold.
          </span>
        </label>
      </div>

      {/* ── TRAILER DOCS (trailer-ready only) ── */}
      {isTrailerReady && (
        <>
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <div className={css.sectionTitle}>
            <FlatbedTrailerIcon width={18} height={11} style={{ marginRight: '6px', color: '#E8450A' }} />
            Trailer Documentation
          </div>
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            ⚠️ <strong>Required before publishing.</strong> Since renters are picking up or receiving a trailer, IronPeer requires trailer registration and insurance status on file.
          </div>

          <strong style={{ fontSize: '0.875rem' }}>Trailer Registration</strong>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.35rem 0 0.75rem' }}>
            Upload a photo of the trailer registration. Listing will be suspended automatically if registration lapses.
          </p>
          <div className={css.uploadField}>
            <label className={css.uploadLabel}>Upload trailer registration</label>
            <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => { const f = e.target.files?.[0]; if (f) setTrailerRegFileName(f.name); }} />
            {trailerRegFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {trailerRegFileName}</p>}
          </div>
          <label className={css.uploadLabel}>Trailer registration expiration date *</label>
          <input type="date" className={css.dateInput} value={trailerRegExpiry} min={today}
            onChange={e => setTrailerRegExpiry(e.target.value)} />

          <div className={css.sectionTitle} style={{ marginTop: '1.25rem' }}>Trailer Insurance</div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
            Is your trailer covered by an insurance policy?
          </p>
          <div className={css.buttonGroup}>
            <button type="button"
              className={trailerHasInsurance === true ? css.optionButtonActive : css.optionButton}
              onClick={() => setTrailerHasInsurance(true)}>
              Yes — it&apos;s insured
            </button>
            <button type="button"
              className={trailerHasInsurance === false ? css.optionButtonActive : css.optionButton}
              onClick={() => setTrailerHasInsurance(false)}>
              No
            </button>
          </div>

          {trailerHasInsurance === true && (
            <div className={css.subSection}>
              <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '0.75rem' }}>
                Is the trailer on the same policy as your equipment?
              </p>
              <div className={css.buttonGroup}>
                <button type="button"
                  className={trailerInsuranceSamePolicy === true ? css.optionButtonActive : css.optionButton}
                  onClick={() => setTrailerInsuranceSamePolicy(true)}>
                  Yes — same policy
                </button>
                <button type="button"
                  className={trailerInsuranceSamePolicy === false ? css.optionButtonActive : css.optionButton}
                  onClick={() => setTrailerInsuranceSamePolicy(false)}>
                  No — separate policy
                </button>
              </div>
              {trailerInsuranceSamePolicy === false && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className={css.uploadField}>
                    <label className={css.uploadLabel}>Upload trailer proof of insurance</label>
                    <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setTrailerInsFileName(f.name); }} />
                    {trailerInsFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {trailerInsFileName}</p>}
                  </div>
                  <label className={css.uploadLabel}>Trailer insurance expiration date *</label>
                  <input type="date" className={css.dateInput} value={trailerInsExpiry} min={today}
                    onChange={e => setTrailerInsExpiry(e.target.value)} />
                </div>
              )}
              {trailerInsuranceSamePolicy === true && (
                <p style={{ fontSize: '0.8rem', color: '#2e7d32', marginTop: '0.5rem' }}>
                  ✓ Trailer coverage confirmed under same policy as equipment.
                </p>
              )}
            </div>
          )}
          {trailerHasInsurance === false && (
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px' }}>
              IronPeer does not provide insurance coverage for the trailer itself. We recommend adding your trailer to your auto or commercial policy.
            </p>
          )}
        </>
      )}

      {submitError && <p className={css.errorMessage}>{submitError}</p>}

      <p className={css.requiredLegend}>* Required to proceed</p>

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
