import React, { useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { Button, H3, ListingLink } from '../../../../components';

import css from './EditListingInspectionPanel.module.css';

// ─── Road-legal detection ────────────────────────────────────────────────────

const isRoadLegalListing = listing => {
  const pd = listing?.attributes?.publicData || {};
  return pd.categoryLevel1 === 'Haulers_and_trailers' || pd.trailerReady === true;
};

// ─── Default state ────────────────────────────────────────────────────────────

const BUILTIN_PHOTOS = [
  { id: 'photo-front', label: 'Front', builtin: true },
  { id: 'photo-back', label: 'Back', builtin: true },
  { id: 'photo-left', label: 'Left Side', builtin: true },
  { id: 'photo-right', label: 'Right Side', builtin: true },
];

const DEFAULT_CHECKLIST = {
  hoursMeter: false,
  fuelLevel: false,
  oilLevel: false,
  defLevel: false,
  hydraulicFluid: false,
  mileage: false,
};

const CHECKLIST_LABELS = {
  hoursMeter: { label: 'Hours meter reading', hint: 'Record the hour meter at pickup and return.' },
  fuelLevel: { label: 'Fuel level', hint: 'Note fuel level and refill policy.' },
  oilLevel: { label: 'Oil level', hint: 'Check engine oil before operating.' },
  defLevel: { label: 'DEF level', hint: 'Diesel exhaust fluid — required for Tier 4 engines.' },
  hydraulicFluid: { label: 'Hydraulic fluid', hint: 'Check hydraulic reservoir level.' },
  mileage: { label: 'Mileage / odometer', hint: 'Record mileage for road-legal equipment.' },
};

// ─── Parse existing config ─────────────────────────────────────────────────

const parseConfig = config => {
  if (!config) {
    return {
      requiredPhotos: BUILTIN_PHOTOS.map(p => ({ ...p })),
      checklistItems: { ...DEFAULT_CHECKLIST },
      hasTrailerBrakes: false,
      customItems: [],
    };
  }
  return {
    requiredPhotos: config.requiredPhotos?.length
      ? config.requiredPhotos
      : BUILTIN_PHOTOS.map(p => ({ ...p })),
    checklistItems: { ...DEFAULT_CHECKLIST, ...(config.checklistItems || {}) },
    hasTrailerBrakes: config.hasTrailerBrakes || false,
    customItems: config.customItems || [],
  };
};

// ─── Toggle component ─────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange, label, hint }) => (
  <label className={css.toggleRow}>
    <div className={css.toggleInfo}>
      <span className={css.toggleLabel}>{label}</span>
      {hint && <span className={css.toggleHint}>{hint}</span>}
    </div>
    <div
      className={classNames(css.toggle, { [css.toggleOn]: checked })}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? onChange(!checked) : null}
    >
      <div className={css.toggleKnob} />
    </div>
  </label>
);

// ─── Panel ────────────────────────────────────────────────────────────────────

const EditListingInspectionPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    onSubmit,
    onNextTab,
    submitButtonText,
    errors,
    updatePageTitle: UpdatePageTitle,
  } = props;

  const intl = useIntl();
  const listingAttributes = listing?.attributes;
  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;
  const isRoadLegal = isRoadLegalListing(listing);

  const existingConfig = listingAttributes?.publicData?.inspectionConfig;
  const [config, setConfig] = useState(() => parseConfig(existingConfig));
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [newCustomItemText, setNewCustomItemText] = useState('');
  const [showCustomItemInput, setShowCustomItemInput] = useState(false);

  const { requiredPhotos, checklistItems, hasTrailerBrakes, customItems } = config;

  // ── Photo management ──

  const updatePhotoLabel = (id, label) => {
    setConfig(c => ({
      ...c,
      requiredPhotos: c.requiredPhotos.map(p => p.id === id ? { ...p, label } : p),
    }));
  };

  const addCustomPhoto = () => {
    const newPhoto = { id: `photo-${Math.random().toString(36).slice(2, 10)}`, label: '', builtin: false };
    setConfig(c => ({ ...c, requiredPhotos: [...c.requiredPhotos, newPhoto] }));
    setEditingPhotoId(newPhoto.id);
  };

  const removeCustomPhoto = id => {
    setConfig(c => ({ ...c, requiredPhotos: c.requiredPhotos.filter(p => p.id !== id) }));
  };

  // ── Checklist management ──

  const toggleChecklistItem = key => {
    setConfig(c => ({
      ...c,
      checklistItems: { ...c.checklistItems, [key]: !c.checklistItems[key] },
    }));
  };

  const addCustomItem = () => {
    const trimmed = newCustomItemText.trim();
    if (!trimmed) return;
    setConfig(c => ({
      ...c,
      customItems: [...c.customItems, { id: `ci-${Math.random().toString(36).slice(2, 10)}`, label: trimmed }],
    }));
    setNewCustomItemText('');
    setShowCustomItemInput(false);
  };

  const removeCustomItem = id => {
    setConfig(c => ({ ...c, customItems: c.customItems.filter(i => i.id !== id) }));
  };

  // ── Save ──

  const handleSave = async () => {
    setSaveInProgress(true);
    setSaveError(null);
    try {
      await onSubmit({ publicData: { inspectionConfig: config } });
      if (!isPublished) onNextTab();
    } catch (e) {
      setSaveError('Could not save inspection settings. Please try again.');
    } finally {
      setSaveInProgress(false);
    }
  };

  const panelTitle = isPublished
    ? intl.formatMessage({ id: 'EditListingAvailabilityPanel.title' }, { listingTitle: listingAttributes?.title, lineBreak: ' ' })
    : 'Set up your inspection checklist';

  const classes = classNames(rootClassName || css.root, className);

  return (
    <main className={classes}>
      {UpdatePageTitle && <UpdatePageTitle panelHeading={panelTitle} />}

      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <>Set up your inspection checklist</>
        )}
      </H3>

      <p className={css.intro}>
        Configure what renters must document at pickup and return. This protects you if any damage or issues are claimed.
      </p>

      {/* ── Section 1: Required Photos ── */}
      <section className={css.section}>
        <h4 className={css.sectionTitle}>Required photos</h4>
        <p className={css.sectionDesc}>
          Renters must upload all of these photos at pickup and again at return. Click any label to rename it.
        </p>

        <div className={css.photoSlots}>
          {requiredPhotos.map(photo => (
            <div key={photo.id} className={css.photoSlot}>
              {editingPhotoId === photo.id ? (
                <input
                  className={css.photoLabelInput}
                  value={photo.label}
                  autoFocus
                  placeholder="Photo name..."
                  onChange={e => updatePhotoLabel(photo.id, e.target.value)}
                  onBlur={() => setEditingPhotoId(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditingPhotoId(null)}
                />
              ) : (
                <button
                  type="button"
                  className={classNames(css.photoChip, { [css.photoChipBuiltin]: photo.builtin })}
                  onClick={() => setEditingPhotoId(photo.id)}
                >
                  <span className={css.cameraIcon}>📷</span>
                  <span className={css.photoChipLabel}>{photo.label || 'Unnamed'}</span>
                  <span className={css.editHint}>✎</span>
                </button>
              )}
              {!photo.builtin && (
                <button
                  type="button"
                  className={css.removeBtn}
                  onClick={() => removeCustomPhoto(photo.id)}
                  aria-label="Remove photo requirement"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className={css.addBtn} onClick={addCustomPhoto}>
          + Add photo requirement
        </button>
      </section>

      {/* ── Section 2: Condition Checklist ── */}
      <section className={css.section}>
        <h4 className={css.sectionTitle}>Condition checklist</h4>
        <p className={css.sectionDesc}>
          Select what renters must check and record at pickup and return.
        </p>

        <div className={css.toggleList}>
          {Object.keys(CHECKLIST_LABELS).map(key => (
            <Toggle
              key={key}
              checked={checklistItems[key]}
              onChange={() => toggleChecklistItem(key)}
              label={CHECKLIST_LABELS[key].label}
              hint={CHECKLIST_LABELS[key].hint}
            />
          ))}
        </div>

        {/* Custom items */}
        {customItems.map(item => (
          <div key={item.id} className={css.customItemRow}>
            <span className={css.customItemLabel}>✓ {item.label}</span>
            <button
              type="button"
              className={css.removeBtn}
              onClick={() => removeCustomItem(item.id)}
            >
              ✕
            </button>
          </div>
        ))}

        {showCustomItemInput ? (
          <div className={css.customItemInputRow}>
            <input
              className={css.customItemInput}
              value={newCustomItemText}
              autoFocus
              placeholder="e.g. Check coupler pin..."
              onChange={e => setNewCustomItemText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addCustomItem();
                if (e.key === 'Escape') setShowCustomItemInput(false);
              }}
            />
            <button type="button" className={css.addConfirmBtn} onClick={addCustomItem}>Add</button>
            <button type="button" className={css.cancelBtn} onClick={() => setShowCustomItemInput(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className={css.addBtn} onClick={() => setShowCustomItemInput(true)}>
            + Add custom item
          </button>
        )}
      </section>

      {/* ── Section 3: Road-legal requirements ── */}
      {isRoadLegal && (
        <section className={css.section}>
          <h4 className={css.sectionTitle}>Road-legal requirements</h4>
          <p className={css.sectionDesc}>
            This listing is road-legal. Renters must confirm these before every pickup.
          </p>

          <div className={css.roadLegalItem}>
            <div className={css.roadLegalRequired}>
              <span className={css.requiredCheckIcon}>✓</span>
              <div>
                <div className={css.roadLegalLabel}>Lights</div>
                <div className={css.roadLegalHint}>Turn signals, brake lights, and running lights must be confirmed working.</div>
              </div>
              <span className={css.requiredBadge}>Required</span>
            </div>
          </div>

          <Toggle
            checked={hasTrailerBrakes}
            onChange={val => setConfig(c => ({ ...c, hasTrailerBrakes: val }))}
            label="This trailer has electric or hydraulic brakes"
            hint="Renters must confirm the brake controller is connected and functioning."
          />
        </section>
      )}

      {saveError && <p className={css.error}>{saveError}</p>}
      {errors?.showListingsError && (
        <p className={css.error}>Unable to load listing. Please try again.</p>
      )}

      <Button
        className={css.submitBtn}
        onClick={handleSave}
        inProgress={saveInProgress}
        disabled={saveInProgress}
      >
        {isPublished ? 'Save changes' : submitButtonText}
      </Button>
    </main>
  );
};

export default EditListingInspectionPanel;
