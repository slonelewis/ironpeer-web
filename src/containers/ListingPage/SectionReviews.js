import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { Heading, H2, Reviews } from '../../components';

import css from './ListingPage.module.css';
import subCss from './SectionReviews.module.css';

/**
 * Human-readable labels for sub-rating keys.
 */
const SUB_RATING_LABELS = {
  equipmentCondition: 'Equipment condition',
  accuracy: 'Accuracy of listing',
  communication: 'Communication',
  valueForMoney: 'Value for money',
  careOfEquipment: 'Care of equipment',
  onTimeReturn: 'On-time return',
  onTime: 'On time',
  equipmentHandledWithCare: 'Equipment handled with care',
};

/**
 * Sub-category breakdown for a single review.
 * Renders only if the review has subRatings metadata.
 */
const SubRatingBreakdown = ({ subRatings }) => {
  if (!subRatings || typeof subRatings !== 'object') return null;

  const entries = Object.entries(subRatings).filter(([, v]) => v && !isNaN(Number(v)));
  if (entries.length === 0) return null;

  return (
    <div className={subCss.subRatingBreakdown}>
      {entries.map(([key, value]) => {
        const rating = Number(value);
        const label = SUB_RATING_LABELS[key] || key;
        const pct = (rating / 5) * 100;
        return (
          <div key={key} className={subCss.subRatingRow}>
            <span className={subCss.subRatingLabel}>{label}</span>
            <div className={subCss.subRatingBarWrapper}>
              <div className={subCss.subRatingBar} style={{ width: `${pct}%` }} />
            </div>
            <span className={subCss.subRatingValue}>{rating.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Enhanced Reviews wrapper that shows sub-category breakdown when present.
 */
const ReviewsWithSubRatings = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div>
      {reviews.map(review => {
        const subRatings =
          review?.attributes?.metadata?.subRatings ||
          review?.attributes?.publicData?.subRatings ||
          null;

        return (
          <div key={review.id?.uuid} className={subCss.reviewEntry}>
            <Reviews reviews={[review]} />
            {subRatings && <SubRatingBreakdown subRatings={subRatings} />}
          </div>
        );
      })}
    </div>
  );
};

const SectionReviews = props => {
  const { reviews, fetchReviewsError } = props;

  return (
    <section className={css.sectionReviews}>
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.reviewsTitle" values={{ count: reviews.length }} />
      </Heading>
      {fetchReviewsError ? (
        <H2 className={css.errorText}>
          <FormattedMessage id="ListingPage.reviewsError" />
        </H2>
      ) : null}
      <ReviewsWithSubRatings reviews={reviews} />
    </section>
  );
};

export default SectionReviews;
