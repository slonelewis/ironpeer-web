import React, { useState } from 'react';
import classNames from 'classnames';

import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { H3, PrimaryButton } from '../../../../components';

import css from './EditListingProtectionPanel.module.css';
import FlatbedTrailerIcon from '../../../../components/FlatbedTrailerIcon';

/**
 * Protection panel for the EditListing wizard.
 *
 * Insurance opt-out rules:
 *  - Road-legal, non-trailer equipment → insurance REQUIRED
 *  - Trailer → can opt out if covered by driver's personal auto + value < $3,000
 *  - Non-road-legal equipment → can opt out if declared value < $3,000
 *
 * If insured: carrier, policy #, deductible (drives hold), expiry, proof upload, acknowledgment
 * If opting out: replacement value (drives hold), disclaimer acknowledgment
 *
 * privateData fields:
 *   isRoadLegal                   boolean
 *   registration                  { fileName, expiresAt } | null
 *   isTrailer                     boolean
 *   hasInsurance                  boolean
 *   trailerCoveredByDriverAuto    boolean  (trailer opt-out path)
 *   insuranceCarrier              string
 *   insurancePolicyNumber         string
 *   insuranceDeductible           number (dollars)  → drives hold when insured
 *   insurance                     { fileName, expiresAt }
 *   ironpeerRoleAccepted          boolean
 *   replacementValue              number (dollars)  → drives hold when uninsured
 *   uninsuredDisclaimerAccepted   boolean
 *   trailerRegistration           { fileName, expiresAt }
 *   trailerHasInsurance           boolean
 *   trailerInsuranceSamePolicy    boolean
 *   trailerInsurance              { fileName, expiresAt } | null
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
    updatePageTitle,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const publicData = listing?.attributes?.publicData || {};
  const isTrailerCategory = publicData.categoryLevel1 === 'Haulers_and_trailers';
  const isTrailerReady = publicData.trailerReady === true;
  const privateData = listing?.attributes?.privateData || {};

  // ── Road-legal ──
  const [isRoadLegal, setIsRoadLegal] = useState(
    isTrailerCategory ? true : (privateData.isRoadLegal !== undefined ? privateData.isRoadLegal : null)
  );
  const [isTrailer, setIsTrailer] = useState(
    privateData.isTrailer !== undefined ? privateData.isTrailer : isTrailerCategory ? true : null
  );
  const [regFileName, setRegFileName] = useState(privateData.registration?.fileName || '');
  const [regExpiry, setRegExpiry] = useState(privateData.registration?.expiresAt?.slice(0, 10) || '');

  // ── Insurance decision ──
  const [hasInsurance, setHasInsurance] = useState(
    privateData.hasInsurance !== undefined ? privateData.hasInsurance : null
  );
  const [trailerCoveredByDriverAuto, setTrailerCoveredByDriverAuto] = useState(
    privateData.trailerCoveredByDriverAuto !== undefined ? privateData.trailerCoveredByDriverAuto : null
  );

  // ── Insured path ──
  const [insuranceCarrier, setInsuranceCarrier] = useState(privateData.insuranceCarrier || '');
  const [policyNumber, setPolicyNumber] = useState(privateData.insurancePolicyNumber || '');
  const [deductible, setDeductible] = useState(
    privateData.insuranceDeductible !== undefined ? String(privateData.insuranceDeductible) : ''
  );
  const [insFileName, setInsFileName] = useState(privateData.insurance?.fileName || '');
  const [insExpiry, setInsExpiry] = useState(privateData.insurance?.expiresAt?.slice(0, 10) || '');
  const [ironpeerRoleAccepted, setIronpeerRoleAccepted] = useState(privateData.ironpeerRoleAccepted || false);

  // ── Uninsured opt-out path ──
  const [replacementValue, setReplacementValue] = useState(
    privateData.replacementValue !== undefined ? String(privateData.replacementValue) : ''
  );
  const [uninsuredDisclaimerAccepted, setUninsuredDisclaimerAccepted] = useState(
    privateData.uninsuredDisclaimerAccepted || false
  );

  // ── Trailer docs ──
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

  // ── Can this listing opt out of insurance? ──
  const canOptOut = () => {
    if (isRoadLegal === false) return true; // non-road-legal, value check at submit
    if (isRoadLegal === true && isTrailer === true) return true; // trailer: driver's auto may cover
    return false; // road-legal non-trailer → must be insured
  };

  const insuranceRequired = isRoadLegal === true && isTrailer !== true;

  const validate = () => {
    if (isRoadLegal === null) return 'Please indicate whether this equipment is road-legal.';
    if (isRoadLegal && !regExpiry) return 'Please enter the registration expiration date.';
    if (isRoadLegal && isTrailer === null) return 'Please indicate whether this is a trailer.';

    if (insuranceRequired) {
      // Must be insured
      if (!insuranceCarrier.trim()) return 'Please enter your insurance carrier.';
      if (!policyNumber.trim()) return 'Please enter your policy number.';
      const ded = parseFloat(deductible);
      if (!deductible || isNaN(ded) || ded < 0) return 'Please enter a valid deductible amount.';
      if (!insExpiry) return 'Please enter your insurance expiration date.';
      if (!ironpeerRoleAccepted) return 'Please acknowledge IronPeer\'s role in damage claims.';
    } else if (hasInsurance === null) {
      return 'Please indicate whether you carry insurance on this equipment.';
    } else if (hasInsurance === true) {
      // Chose to insure voluntarily
      if (!insuranceCarrier.trim()) return 'Please enter your insurance carrier.';
      if (!policyNumber.trim()) return 'Please enter your policy number.';
      const ded = parseFloat(deductible);
      if (!deductible || isNaN(ded) || ded < 0) return 'Please enter a valid deductible amount.';
      if (!insExpiry) return 'Please enter your insurance expiration date.';
      if (!ironpeerRoleAccepted) return 'Please acknowledge IronPeer\'s role in damage claims.';
    } else {
      // Opting out
      if (isTrailer && trailerCoveredByDriverAuto === null) {
        return 'Please indicate whether this trailer is covered by the driver\'s personal auto policy.';
      }
      const val = parseFloat(replacementValue);
      if (!replacementValue || isNaN(val) || val <= 0) return 'Please enter the estimated replacement value.';
      if (val > 3000) return 'Equipment valued over $3,000 requires an insurance policy. Please enter your insurance information above.';
      if (!uninsuredDisclaimerAccepted) return 'Please acknowledge the uninsured disclaimer to continue.';
    }

    // Trailer docs
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

    const isOptOut = !insuranceRequired && hasInsurance === false;
    const insuredData = !isOptOut ? {
      hasInsurance: true,
      insuranceCarrier: insuranceCarrier.trim(),
      insurancePolicyNumber: policyNumber.trim(),
      insuranceDeductible: parseFloat(deductible),
      insurance: {
        fileName: insFileName || null,
        expiresAt: insExpiry ? new Date(insExpiry).toISOString() : null,
      },
      ironpeerRoleAccepted,
      replacementValue: null,
      uninsuredDisclaimerAccepted: false,
    } : {
      hasInsurance: false,
      trailerCoveredByDriverAuto: isTrailer ? trailerCoveredByDriverAuto : null,
      insuranceCarrier: null,
      insurancePolicyNumber: null,
      insuranceDeductible: null,
      insurance: null,
      ironpeerRoleAccepted: false,
      replacementValue: parseFloat(replacementValue),
      uninsuredDisclaimerAccepted,
    };

    onSubmit({
      publicData: {
        uninsuredOptOut: isOptOut || false,
        securityHoldAmount: isOptOut
          ? Math.round(parseFloat(replacementValue) * 0.1)
          : null,
      },
      privateData: {
        isRoadLegal,
        isTrailer: isRoadLegal ? (isTrailer || false) : false,
        registration: isRoadLegal
          ? { fileName: regFileName || null, expiresAt: regExpiry ? new Date(regExpiry).toISOString() : null }
          : null,
        ...insuredData,
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
        Tell us about your equipment's legal status and insurance coverage. This information
        determines the security hold amount renters pay at booking.
      </p>

      {/* ── ROAD LEGAL ── */}
      {isTrailerCategory ? (
        <div style={{ fontSize: '0.875rem', color: '#555', marginBottom: '1rem', padding: '0.75rem', background: '#fff8f5', border: '1px solid #E8450A33', borderRadius: '6px' }}>
          <FlatbedTrailerIcon width={18} height={11} style={{ marginRight: '6px', color: '#E8450A' }} />
          <strong>Trailers and haulers are road-legal by default.</strong> Registration is required.
        </div>
      ) : (
        <>
          <div className={css.sectionTitle}>Is this equipment road-legal?</div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
            Road-legal means it travels on public roads (trailers, tow vehicles, etc.)
          </p>
          <div className={css.buttonGroup}>
            <button type="button"
              className={isRoadLegal === true ? css.optionButtonActive : css.optionButton}
              onClick={() => { setIsRoadLegal(true); setHasInsurance(null); }}>
              Yes — road-legal
            </button>
            <button type="button"
              className={isRoadLegal === false ? css.optionButtonActive : css.optionButton}
              onClick={() => { setIsRoadLegal(false); setIsTrailer(false); setHasInsurance(null); }}>
              No — off-road / yard equipment
            </button>
          </div>
        </>
      )}

      {/* Is it a trailer? (road-legal only) */}
      {isRoadLegal === true && !isTrailerCategory && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className={css.sectionTitle} style={{ fontSize: '0.9rem' }}>Is this a trailer?</div>
          <div className={css.buttonGroup}>
            <button type="button"
              className={isTrailer === true ? css.optionButtonActive : css.optionButton}
              onClick={() => setIsTrailer(true)}>
              Yes — it&apos;s a trailer
            </button>
            <button type="button"
              className={isTrailer === false ? css.optionButtonActive : css.optionButton}
              onClick={() => setIsTrailer(false)}>
              No — other road-legal equipment
            </button>
          </div>
        </div>
      )}

      {/* Registration */}
      {isRoadLegal === true && (
        <div className={css.subSection} style={{ marginTop: '0.75rem' }}>
          <strong>Registration required</strong>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.4rem 0 0.75rem' }}>
            Your listing will be automatically unpublished if registration expires.
          </p>
          <div className={css.uploadField}>
            <label className={css.uploadLabel}>Upload registration document</label>
            <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => { const f = e.target.files?.[0]; if (f) setRegFileName(f.name); }} />
            {regFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {regFileName}</p>}
          </div>
          <label className={css.uploadLabel}>Registration expiration date *</label>
          <input type="date" className={css.dateInput} value={regExpiry} min={today}
            onChange={e => setRegExpiry(e.target.value)} />
        </div>
      )}

      {isRoadLegal === false && (
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px' }}>
          No registration required for off-road equipment. 👍
        </div>
      )}

      {/* ── INSURANCE ── */}
      {(isRoadLegal !== null && (isRoadLegal === false || isTrailer !== null)) && (
        <>
          <div className={css.sectionTitle} style={{ marginTop: '1.5rem' }}>
            Insurance {insuranceRequired ? <span style={{ color: '#E8450A' }}>*</span> : '(optional)'}
          </div>

          {insuranceRequired ? (
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              Insurance is <strong>required</strong> for road-legal, non-trailer equipment.
              Your deductible determines the security hold renters pay — covering your out-of-pocket cost if damage occurs.
            </p>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
              Insurance is <strong>optional</strong> for this type of equipment if the declared value is under $3,000.
              If you carry a policy, enter it below. Otherwise you may opt out.
            </p>
          )}

          {!insuranceRequired && (
            <div className={css.buttonGroup}>
              <button type="button"
                className={hasInsurance === true ? css.optionButtonActive : css.optionButton}
                onClick={() => setHasInsurance(true)}>
                Yes — I carry a policy
              </button>
              <button type="button"
                className={hasInsurance === false ? css.optionButtonActive : css.optionButton}
                onClick={() => setHasInsurance(false)}>
                No — opt out of insurance
              </button>
            </div>
          )}

          {/* Insured form */}
          {(insuranceRequired || hasInsurance === true) && (
            <div className={css.subSection} style={{ marginTop: '0.75rem' }}>
              <label className={css.uploadLabel}>Insurance carrier *</label>
              <input type="text" placeholder="e.g. State Farm, Progressive"
                value={insuranceCarrier} onChange={e => setInsuranceCarrier(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />

              <label className={css.uploadLabel}>Policy number *</label>
              <input type="text" placeholder="e.g. HO-123456789"
                value={policyNumber} onChange={e => setPolicyNumber(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />

              <label className={css.uploadLabel}>Deductible amount *</label>
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '-0.25rem 0 0.5rem' }}>
                IronPeer holds this amount from renters. If your insurance pays out, your out-of-pocket is $0.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>$</span>
                <input type="number" min="0" step="1" placeholder="e.g. 500"
                  value={deductible} onChange={e => setDeductible(e.target.value)}
                  style={{ width: '160px', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem' }} />
              </div>

              <div className={css.uploadField}>
                <label className={css.uploadLabel}>Proof of insurance (optional but recommended)</label>
                <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setInsFileName(f.name); }} />
                {insFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {insFileName}</p>}
              </div>

              <label className={css.uploadLabel}>Insurance expiration date *</label>
              <input type="date" className={css.dateInput} value={insExpiry} min={today}
                onChange={e => setInsExpiry(e.target.value)} />

              <div className={css.disclaimer} style={{ marginTop: '1rem' }}>
                <label className={css.checkboxLabel} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={ironpeerRoleAccepted}
                    onChange={e => setIronpeerRoleAccepted(e.target.checked)}
                    style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span className={css.checkboxText}>
                    I understand that IronPeer is only responsible for collecting a security hold equal to my
                    insurance deductible. My insurance policy is the primary coverage for any damage claim.
                    IronPeer is not liable for damages exceeding the renter's security hold.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Opt-out path */}
          {!insuranceRequired && hasInsurance === false && (
            <div className={css.subSection} style={{ marginTop: '0.75rem' }}>

              {/* Trailer: ask if covered by driver's auto */}
              {isTrailer === true && (
                <>
                  <div className={css.sectionTitle} style={{ fontSize: '0.9rem' }}>Is this trailer covered under the driver's personal auto insurance policy?</div>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>
                    Most personal auto policies extend coverage to trailers while hitched to the tow vehicle.
                  </p>
                  <div className={css.buttonGroup}>
                    <button type="button"
                      className={trailerCoveredByDriverAuto === true ? css.optionButtonActive : css.optionButton}
                      onClick={() => setTrailerCoveredByDriverAuto(true)}>
                      Yes — covered by driver&apos;s auto policy
                    </button>
                    <button type="button"
                      className={trailerCoveredByDriverAuto === false ? css.optionButtonActive : css.optionButton}
                      onClick={() => setTrailerCoveredByDriverAuto(false)}>
                      No — not covered
                    </button>
                  </div>
                </>
              )}

              <label className={css.uploadLabel} style={{ marginTop: '1rem', display: 'block' }}>
                Estimated replacement value *
              </label>
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '-0.15rem 0 0.5rem' }}>
                Must be under $3,000 to opt out. Renters will be held <strong>10% of this value</strong> as a security deposit.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>$</span>
                <input type="number" min="0" max="3000" step="1" placeholder="e.g. 800"
                  value={replacementValue} onChange={e => setReplacementValue(e.target.value)}
                  style={{ width: '160px', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.9rem' }} />
              </div>
              {replacementValue && !isNaN(parseFloat(replacementValue)) && parseFloat(replacementValue) <= 3000 && parseFloat(replacementValue) > 0 && (
                <p style={{ fontSize: '0.85rem', color: '#2e7d32', marginBottom: '0.5rem', fontWeight: 500 }}>
                  ✓ Renter security hold: <strong>${Math.round(parseFloat(replacementValue) * 0.1)}</strong> (10% of ${parseFloat(replacementValue).toLocaleString()})
                </p>
              )}
              {parseFloat(replacementValue) > 3000 && (
                <p style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Equipment valued over $3,000 requires an insurance policy.
                </p>
              )}

              <div style={{ background: '#fff8f5', border: '1px solid #E8450A33', borderRadius: '6px', padding: '0.75rem', marginTop: '0.75rem', fontSize: '0.8rem', color: '#555' }}>
                ⏳ <strong>Admin review required.</strong> Uninsured listings are reviewed before going live. IronPeer will verify your equipment photos match your declared value. Listings that appear undervalued may be denied.
              </div>

              <div className={css.disclaimer} style={{ marginTop: '0.75rem' }}>
                <label className={css.checkboxLabel} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={uninsuredDisclaimerAccepted}
                    onChange={e => setUninsuredDisclaimerAccepted(e.target.checked)}
                    style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span className={css.checkboxText}>
                    I understand that I am listing this equipment without an insurance policy.
                    In the event of damage, IronPeer will only collect the security hold from the renter
                    (10% of my declared replacement value). I am solely responsible for any damage
                    costs beyond that amount. IronPeer is not liable for uninsured losses.
                  </span>
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TRAILER DOCS (trailer-ready only) ── */}
      {isTrailerReady && (
        <>
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <div className={css.sectionTitle}>
            <FlatbedTrailerIcon width={18} height={11} style={{ marginRight: '6px', color: '#E8450A' }} />
            Trailer Documentation
          </div>
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            ⚠️ <strong>Required before publishing.</strong> Since renters are picking up via a trailer, IronPeer requires trailer registration and insurance status on file.
          </div>

          <strong style={{ fontSize: '0.875rem' }}>Trailer Registration</strong>
          <div className={css.uploadField} style={{ marginTop: '0.5rem' }}>
            <label className={css.uploadLabel}>Upload trailer registration</label>
            <input type="file" className={css.fileInput} accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => { const f = e.target.files?.[0]; if (f) setTrailerRegFileName(f.name); }} />
            {trailerRegFileName && <p style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✓ {trailerRegFileName}</p>}
          </div>
          <label className={css.uploadLabel}>Trailer registration expiration date *</label>
          <input type="date" className={css.dateInput} value={trailerRegExpiry} min={today}
            onChange={e => setTrailerRegExpiry(e.target.value)} />

          <div className={css.sectionTitle} style={{ marginTop: '1.25rem' }}>Trailer Insurance</div>
          <div className={css.buttonGroup}>
            <button type="button"
              className={trailerHasInsurance === true ? css.optionButtonActive : css.optionButton}
              onClick={() => setTrailerHasInsurance(true)}>
              Yes — insured
            </button>
            <button type="button"
              className={trailerHasInsurance === false ? css.optionButtonActive : css.optionButton}
              onClick={() => setTrailerHasInsurance(false)}>
              No
            </button>
          </div>

          {trailerHasInsurance === true && (
            <div className={css.subSection}>
              <div className={css.buttonGroup} style={{ marginTop: '0.75rem' }}>
                <button type="button"
                  className={trailerInsuranceSamePolicy === true ? css.optionButtonActive : css.optionButton}
                  onClick={() => setTrailerInsuranceSamePolicy(true)}>
                  Same policy as equipment
                </button>
                <button type="button"
                  className={trailerInsuranceSamePolicy === false ? css.optionButtonActive : css.optionButton}
                  onClick={() => setTrailerInsuranceSamePolicy(false)}>
                  Separate policy
                </button>
              </div>
              {trailerInsuranceSamePolicy === true && (
                <p style={{ fontSize: '0.8rem', color: '#2e7d32', marginTop: '0.5rem' }}>✓ Confirmed under same policy.</p>
              )}
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
            </div>
          )}
          {trailerHasInsurance === false && (
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px' }}>
              IronPeer does not cover the trailer itself. We recommend adding your trailer to your auto or commercial policy.
            </p>
          )}
        </>
      )}

      {submitError && <p className={css.errorMessage}>{submitError}</p>}
      <p className={css.requiredLegend}>* Required to proceed</p>

      <div className={css.submitButton}>
        <PrimaryButton onClick={handleSubmit} inProgress={updateInProgress}
          disabled={disabled || updateInProgress} ready={ready}>
          {submitButtonText || 'Save & continue'}
        </PrimaryButton>
      </div>
    </main>
  );
};

export default EditListingProtectionPanel;
