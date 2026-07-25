import React, { useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { getDefaultTimeZoneOnBrowser } from '../../../../util/dates';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { Button, H3, ListingLink } from '../../../../components';

import BlockDatesCalendar from './BlockDatesCalendar';

import css from './EditListingAvailabilityPanel.module.css';

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

// Default availability plan: always available (all 7 days, full day)
const buildDefaultPlan = () => ({
  type: 'availability-plan/time',
  timezone: defaultTimeZone(),
  entries: [
    { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 1 },
  ],
});

/**
 * Simplified availability panel — monthly grid for blocking dates.
 * The base availability plan is always-available; owners block specific dates.
 */
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
    updateInProgress,
    errors,
    updatePageTitle: UpdatePageTitle,
  } = props;

  const intl = useIntl();
  const [nextInProgress, setNextInProgress] = useState(false);

  const listingAttributes = listing?.attributes;
  const hasAvailabilityPlan = !!listingAttributes?.availabilityPlan;
  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;

  const panelTitle = isPublished
    ? intl.formatMessage(
        { id: 'EditListingAvailabilityPanel.title' },
        { listingTitle: listingAttributes?.title, lineBreak: ' ' }
      )
    : intl.formatMessage(
        { id: 'EditListingAvailabilityPanel.createListingTitle' },
        { lineBreak: ' ' }
      );

  // For the wizard "Next" button: auto-save the always-available plan, then advance
  const handleNext = async () => {
    if (!hasAvailabilityPlan) {
      setNextInProgress(true);
      try {
        await onSubmit({ availabilityPlan: buildDefaultPlan() });
      } catch (e) {
        setNextInProgress(false);
        return;
      }
      setNextInProgress(false);
    }
    onNextTab();
  };

  const classes = classNames(rootClassName || css.root, className);

  return (
    <main className={classes}>
      {UpdatePageTitle && <UpdatePageTitle panelHeading={panelTitle} />}

      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{
              listingTitle: <ListingLink listing={listing} />,
              lineBreak: <br />,
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingAvailabilityPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      <p className={css.description}>
        Your equipment is available by default. Block specific dates when it&apos;s
        unavailable — for maintenance, personal use, or anything else. Click a date
        to block or unblock it.
      </p>

      <div className={css.calendarWrapper}>
        {listing?.id ? (
          <BlockDatesCalendar
            listingId={listing.id}
            allExceptions={allExceptions}
            monthlyExceptionQueries={monthlyExceptionQueries}
            onAddAvailabilityException={onAddAvailabilityException}
            onDeleteAvailabilityException={onDeleteAvailabilityException}
            onFetchExceptions={onFetchExceptions}
          />
        ) : null}
      </div>

      {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      ) : null}

      {!isPublished ? (
        <Button
          className={css.goToNextTabButton}
          onClick={handleNext}
          inProgress={nextInProgress}
          disabled={nextInProgress}
        >
          {submitButtonText}
        </Button>
      ) : null}
    </main>
  );
};

export default EditListingAvailabilityPanel;
