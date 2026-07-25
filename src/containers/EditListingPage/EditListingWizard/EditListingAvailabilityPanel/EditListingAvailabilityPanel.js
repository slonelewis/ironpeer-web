import React, { useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { getDefaultTimeZoneOnBrowser } from '../../../../util/dates';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { Button, H3, ListingLink } from '../../../../components';

import BlockDatesCalendar from './BlockDatesCalendar';
import css from './EditListingAvailabilityPanel.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_LABELS = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };

const PRESETS = [
  { label: 'Mon – Fri', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { label: '7 Days',    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  { label: 'Weekends',  days: ['sat', 'sun'] },
];

// Hours for the time dropdowns (sharp hours only)
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const h = i === 24 ? 0 : i;
  const label = i === 0 ? '12:00 AM' : i === 12 ? '12:00 PM' : i < 12 ? `${i}:00 AM` : `${i - 12}:00 PM`;
  const value = i === 24 ? '00:00' : `${String(h).padStart(2, '0')}:00`;
  return { label: i === 24 ? '12:00 AM (midnight)' : label, value, sortKey: i };
});

const START_HOURS = HOUR_OPTIONS.filter(h => h.sortKey < 24);
const END_HOURS   = HOUR_OPTIONS.filter(h => h.sortKey > 0);

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

// ─── Parse existing plan into local state ─────────────────────────────────────

const parsePlan = availabilityPlan => {
  const entries = availabilityPlan?.entries || [];
  if (!entries.length) {
    return { selectedDays: [], allDay: true, startTime: '08:00', endTime: '00:00' };
  }
  const activeDays = [...new Set(entries.map(e => e.dayOfWeek))];
  const first = entries[0];
  const allDay = first.startTime === '00:00' && (first.endTime === '00:00' || first.endTime === '24:00');
  return {
    selectedDays: activeDays,
    allDay,
    startTime: allDay ? '08:00' : first.startTime,
    endTime: allDay ? '17:00' : (first.endTime === '00:00' ? '00:00' : first.endTime),
  };
};

// ─── Convert local state to Sharetribe availability plan ──────────────────────

const buildPlan = ({ selectedDays, allDay, startTime, endTime }, timezone) => ({
  type: 'availability-plan/time',
  timezone: timezone || defaultTimeZone(),
  entries: selectedDays.map(day => ({
    dayOfWeek: day,
    startTime: allDay ? '00:00' : startTime,
    endTime:   allDay ? '00:00' : endTime,
    seats: 1,
  })),
});

// ─── Panel ────────────────────────────────────────────────────────────────────

const EditListingAvailabilityPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    allExceptions = [],
    monthlyExceptionQueries = {},
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onFetchExceptions,
    onSubmit,
    onNextTab,
    submitButtonText,
    errors,
    updatePageTitle: UpdatePageTitle,
  } = props;

  const intl = useIntl();
  const listingAttributes = listing?.attributes;
  const existingPlan = listingAttributes?.availabilityPlan;
  const timezone = existingPlan?.timezone || defaultTimeZone();
  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;

  const [schedule, setSchedule] = useState(() => parsePlan(existingPlan));
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const { selectedDays, allDay, startTime, endTime } = schedule;

  // ── Day toggle ──
  const toggleDay = day => {
    setSchedule(s => {
      const has = s.selectedDays.includes(day);
      const next = has ? s.selectedDays.filter(d => d !== day) : [...s.selectedDays, day];
      return { ...s, selectedDays: next };
    });
  };

  // ── Preset ──
  const applyPreset = days => setSchedule(s => ({ ...s, selectedDays: days }));

  const isPresetActive = presetDays => {
    const sorted = [...presetDays].sort().join(',');
    const cur = [...selectedDays].sort().join(',');
    return sorted === cur;
  };

  // ── Save schedule + advance ──
  const handleNext = async () => {
    if (selectedDays.length === 0) {
      setSaveError('Select at least one available day.');
      return;
    }
    setSaveInProgress(true);
    setSaveError(null);
    try {
      await onSubmit({ availabilityPlan: buildPlan(schedule, timezone) });
      onNextTab();
    } catch (e) {
      setSaveError('Could not save schedule. Please try again.');
    } finally {
      setSaveInProgress(false);
    }
  };

  // ── Save schedule only (published listing) ──
  const handleSave = async () => {
    if (selectedDays.length === 0) {
      setSaveError('Select at least one available day.');
      return;
    }
    setSaveInProgress(true);
    setSaveError(null);
    try {
      await onSubmit({ availabilityPlan: buildPlan(schedule, timezone) });
    } catch (e) {
      setSaveError('Could not save schedule. Please try again.');
    } finally {
      setSaveInProgress(false);
    }
  };

  const panelTitle = isPublished
    ? intl.formatMessage({ id: 'EditListingAvailabilityPanel.title' }, { listingTitle: listingAttributes?.title, lineBreak: ' ' })
    : intl.formatMessage({ id: 'EditListingAvailabilityPanel.createListingTitle' }, { lineBreak: ' ' });

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
          <FormattedMessage id="EditListingAvailabilityPanel.createListingTitle" values={{ lineBreak: <br /> }} />
        )}
      </H3>

      {/* ── Section 1: Weekly schedule ── */}
      <section className={css.section}>
        <h4 className={css.sectionTitle}>Set your schedule</h4>
        <p className={css.sectionDesc}>Choose which days and hours your equipment is available for pickup.</p>

        {/* Day toggles */}
        <div className={css.dayToggles}>
          {WEEKDAYS.map(day => (
            <button
              key={day}
              type="button"
              className={classNames(css.dayToggle, { [css.dayToggleActive]: selectedDays.includes(day) })}
              onClick={() => toggleDay(day)}
            >
              {WEEKDAY_LABELS[day]}
            </button>
          ))}
        </div>

        {/* Time range */}
        <div className={css.timeSection}>
          <label className={css.allDayLabel}>
            <input
              type="checkbox"
              checked={allDay}
              onChange={e => setSchedule(s => ({ ...s, allDay: e.target.checked }))}
              className={css.allDayCheckbox}
            />
            Available 24 hours (all day)
          </label>

          {!allDay && (
            <div className={css.timeRange}>
              <div className={css.timeField}>
                <label className={css.timeLabel}>Pickup from</label>
                <select
                  className={css.timeSelect}
                  value={startTime}
                  onChange={e => setSchedule(s => ({ ...s, startTime: e.target.value }))}
                >
                  {START_HOURS.map(h => (
                    <option key={h.value + '-start'} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
              <span className={css.timeSep}>to</span>
              <div className={css.timeField}>
                <label className={css.timeLabel}>Until</label>
                <select
                  className={css.timeSelect}
                  value={endTime}
                  onChange={e => setSchedule(s => ({ ...s, endTime: e.target.value }))}
                >
                  {END_HOURS.map(h => (
                    <option key={h.value + '-end'} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {selectedDays.length === 0 && (
          <p className={css.nodays}>Select at least one day.</p>
        )}
      </section>

      {/* ── Section 2: Block specific dates ── */}
      <section className={css.section}>
        <h4 className={css.sectionTitle}>Block specific dates</h4>
        <p className={css.sectionDesc}>
          Click any date to mark it unavailable — for maintenance, personal use, or anything else. Off-schedule days are grayed out automatically.
        </p>

        {listing?.id ? (
          <BlockDatesCalendar
            listingId={listing.id}
            allExceptions={allExceptions}
            monthlyExceptionQueries={monthlyExceptionQueries}
            onAddAvailabilityException={onAddAvailabilityException}
            onDeleteAvailabilityException={onDeleteAvailabilityException}
            onFetchExceptions={onFetchExceptions}
            scheduledDays={selectedDays}
          />
        ) : null}
      </section>

      {saveError && <p className={css.error}>{saveError}</p>}
      {errors?.showListingsError && (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      )}

      {isPublished ? (
        <Button
          className={css.goToNextTabButton}
          onClick={handleSave}
          inProgress={saveInProgress}
          disabled={saveInProgress || selectedDays.length === 0}
        >
          Save changes
        </Button>
      ) : (
        <Button
          className={css.goToNextTabButton}
          onClick={handleNext}
          inProgress={saveInProgress}
          disabled={saveInProgress || selectedDays.length === 0}
        >
          {submitButtonText}
        </Button>
      )}
    </main>
  );
};

export default EditListingAvailabilityPanel;
