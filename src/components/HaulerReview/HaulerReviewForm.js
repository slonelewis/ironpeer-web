import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FieldReviewRating, Form, PrimaryButton, FieldTextInput } from '../index';
import { required, minLength, composeValidators } from '../../util/validators';

import css from './HaulerReviewForm.module.css';

/**
 * Sub-category ratings for reviewing a hauler.
 */
const HAULER_RATING_CATEGORIES = [
  { key: 'onTime', label: 'On time' },
  { key: 'equipmentHandledWithCare', label: 'Equipment handled with care' },
  { key: 'communication', label: 'Communication' },
];

/**
 * Standalone form for leaving a review on a hauler (separate from the
 * Sharetribe transaction review system).
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with { subRatings, reviewContent }
 * @param {boolean} [props.reviewSent] - Whether the review was successfully sent
 * @param {boolean} [props.sendReviewInProgress] - Submission in progress
 * @param {string} [props.haulerName] - Display name of the hauler being reviewed
 * @returns {JSX.Element}
 */
const HaulerReviewForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        className,
        rootClassName,
        disabled,
        handleSubmit,
        invalid,
        reviewSent,
        sendReviewInProgress,
        haulerName,
      } = fieldRenderProps;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = sendReviewInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const minLengthValidator = minLength('Please write at least 20 characters', 20);
      const reviewContentValidate = composeValidators(
        required('Please write a review'),
        minLengthValidator
      );

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <p className={css.intro}>
            {haulerName ? `How was your experience with ${haulerName}?` : 'How was your hauler?'}
          </p>

          {/* Sub-category ratings */}
          <div className={css.subRatingsSection}>
            {HAULER_RATING_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.key}
                className={classNames(css.subRatingRow, {
                  [css.subRatingRowLast]: idx === HAULER_RATING_CATEGORIES.length - 1,
                })}
              >
                <span className={css.subRatingLabel}>{cat.label}</span>
                <FieldReviewRating
                  className={css.subRatingStars}
                  id={`haulerReview.subRatings.${cat.key}`}
                  name={`subRatings.${cat.key}`}
                />
              </div>
            ))}
          </div>

          {/* Written review */}
          <FieldTextInput
            className={css.reviewContent}
            type="textarea"
            id="haulerReview.reviewContent"
            name="reviewContent"
            label="Overall review"
            placeholder="Describe your experience with this hauler..."
            validate={reviewContentValidate}
          />

          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={reviewSent}
          >
            {reviewSent ? 'Review sent!' : 'Submit review'}
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

export default HaulerReviewForm;
