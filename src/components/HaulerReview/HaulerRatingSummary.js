import React from 'react';
import classNames from 'classnames';

import { Avatar, ReviewRating } from '../index';

import css from './HaulerRatingSummary.module.css';

/**
 * Labels for sub-rating keys on a hauler review.
 */
const SUB_RATING_LABELS = {
  onTime: 'On time',
  equipmentHandledWithCare: 'Equipment handled with care',
  communication: 'Communication',
};

/**
 * Calculate overall average from a reviews array.
 * Reads `review.rating` (top-level) or `review.attributes.rating` (Sharetribe shape).
 */
const calcAverage = reviews => {
  if (!reviews || reviews.length === 0) return 0;
  const ratings = reviews
    .map(r => r?.attributes?.rating ?? r?.rating ?? null)
    .filter(v => v !== null && !isNaN(v));
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, v) => sum + v, 0) / ratings.length;
};

/**
 * Calculate per-sub-category averages across all reviews.
 */
const calcSubAverages = reviews => {
  if (!reviews || reviews.length === 0) return {};
  const totals = {};
  const counts = {};

  reviews.forEach(r => {
    const subRatings =
      r?.attributes?.metadata?.subRatings ||
      r?.attributes?.publicData?.subRatings ||
      r?.subRatings ||
      null;
    if (!subRatings) return;
    Object.entries(subRatings).forEach(([key, val]) => {
      const num = Number(val);
      if (!isNaN(num)) {
        totals[key] = (totals[key] || 0) + num;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
  });

  const averages = {};
  Object.keys(totals).forEach(k => {
    averages[k] = totals[k] / counts[k];
  });
  return averages;
};

/**
 * Star rating row: label + bar + value (Airbnb-style).
 */
const SubCategoryBar = ({ label, value }) => {
  const pct = (value / 5) * 100;
  return (
    <div className={css.subCategoryRow}>
      <span className={css.subCategoryLabel}>{label}</span>
      <div className={css.barWrapper}>
        <div className={css.bar} style={{ width: `${pct}%` }} />
      </div>
      <span className={css.barValue}>{value.toFixed(1)}</span>
    </div>
  );
};

/**
 * Individual review card.
 */
const ReviewCard = ({ review, intl }) => {
  const date = review?.attributes?.createdAt ?? review?.createdAt;
  const dateString = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const rating = review?.attributes?.rating ?? review?.rating ?? 0;
  const content = review?.attributes?.content ?? review?.content ?? '';
  const author = review?.author ?? review?.attributes?.author ?? null;

  return (
    <div className={css.reviewCard}>
      {author && <Avatar className={css.reviewAvatar} user={author} />}
      <div className={css.reviewBody}>
        <ReviewRating rating={rating} className={css.reviewStars} />
        <p className={css.reviewContent}>{content}</p>
        {dateString && <p className={css.reviewDate}>{dateString}</p>}
      </div>
    </div>
  );
};

/**
 * Displays a hauler's aggregate rating summary and individual reviews.
 *
 * @component
 * @param {Object} props
 * @param {Array} props.reviews - Array of hauler review objects
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * @returns {JSX.Element}
 */
const HaulerRatingSummary = props => {
  const { className, rootClassName, reviews = [] } = props;
  const classes = classNames(rootClassName || css.root, className);

  const overallAvg = calcAverage(reviews);
  const subAverages = calcSubAverages(reviews);
  const hasSubAverages = Object.keys(subAverages).length > 0;

  if (reviews.length === 0) {
    return (
      <div className={classes}>
        <p className={css.noReviews}>No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className={classes}>
      {/* Overall average */}
      <div className={css.overallSection}>
        <span className={css.overallScore}>{overallAvg.toFixed(1)}</span>
        <div className={css.overallDetails}>
          <ReviewRating rating={Math.round(overallAvg)} className={css.overallStars} />
          <span className={css.reviewCount}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Sub-category breakdown */}
      {hasSubAverages && (
        <div className={css.subCategoriesSection}>
          {Object.entries(subAverages).map(([key, avg]) => (
            <SubCategoryBar
              key={key}
              label={SUB_RATING_LABELS[key] || key}
              value={avg}
            />
          ))}
        </div>
      )}

      {/* Individual reviews */}
      <div className={css.reviewsList}>
        {reviews.map((review, idx) => (
          <ReviewCard key={review?.id?.uuid ?? idx} review={review} />
        ))}
      </div>
    </div>
  );
};

export default HaulerRatingSummary;
