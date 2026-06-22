import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { isTransactionsTransitionAlreadyReviewed } from '../../../util/errors';
import { propTypes } from '../../../util/types';
import { required, minLength, composeValidators } from '../../../util/validators';

import { FieldReviewRating, Form, PrimaryButton, FieldTextInput } from '../../../components';

import css from './ReviewForm.module.css';

/**
 * Sub-category rating categories per review type.
 */
const SUB_CATEGORIES = {
  customerReviewsProvider: [
    { key: 'equipmentCondition', labelId: 'ReviewForm.subRating.equipmentCondition' },
    { key: 'accuracy', labelId: 'ReviewForm.subRating.accuracy' },
    { key: 'communication', labelId: 'ReviewForm.subRating.communication' },
    { key: 'valueForMoney', labelId: 'ReviewForm.subRating.valueForMoney' },
  ],
  providerReviewsCustomer: [
    { key: 'communication', labelId: 'ReviewForm.subRating.communication' },
    { key: 'careOfEquipment', labelId: 'ReviewForm.subRating.careOfEquipment' },
    { key: 'onTimeReturn', labelId: 'ReviewForm.subRating.onTimeReturn' },
  ],
};

/**
 * Fallback labels when intl message IDs haven't been added yet.
 */
const SUB_CATEGORY_FALLBACK_LABELS = {
  'ReviewForm.subRating.equipmentCondition': 'Equipment condition',
  'ReviewForm.subRating.accuracy': 'Accuracy of listing',
  'ReviewForm.subRating.communication': 'Communication',
  'ReviewForm.subRating.valueForMoney': 'Value for money',
  'ReviewForm.subRating.careOfEquipment': 'Care of equipment',
  'ReviewForm.subRating.onTimeReturn': 'On-time return',
};

/**
 * Review form
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The form id
 * @param {Function} props.onSubmit - The on submit function
 * @param {boolean} props.reviewSent - Whether the review is sent
 * @param {propTypes.error} props.sendReviewError - The send review error
 * @param {boolean} props.sendReviewInProgress - Whether the send review is in progress
 * @param {'customerReviewsProvider'|'providerReviewsCustomer'} [props.reviewType] - Controls which sub-category ratings are shown
 * @returns {JSX.Element} The ReviewForm component
 */
const ReviewForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        className,
        rootClassName,
        disabled,
        handleSubmit,
        formId,
        invalid,
        reviewSent,
        sendReviewError,
        sendReviewInProgress,
        reviewType,
      } = fieldRenderProps;
      const intl = useIntl();

      const reviewRating = intl.formatMessage({ id: 'ReviewForm.reviewRatingLabel' });
      const reviewRatingRequiredMessage = intl.formatMessage({
        id: 'ReviewForm.reviewRatingRequired',
      });

      const reviewContent = intl.formatMessage({ id: 'ReviewForm.reviewContentLabel' });
      const reviewContentPlaceholderMessage = intl.formatMessage({
        id: 'ReviewForm.reviewContentPlaceholder',
      });
      const reviewContentRequiredMessage = intl.formatMessage({
        id: 'ReviewForm.reviewContentRequired',
      });

      const errorMessage = isTransactionsTransitionAlreadyReviewed(sendReviewError) ? (
        <p className={css.error}>
          <FormattedMessage id="ReviewForm.reviewSubmitAlreadySent" />
        </p>
      ) : (
        <p className={css.error}>
          <FormattedMessage id="ReviewForm.reviewSubmitFailed" />
        </p>
      );
      const errorArea = sendReviewError ? errorMessage : <p className={css.errorPlaceholder} />;

      const reviewSubmitMessage = intl.formatMessage({
        id: 'ReviewForm.reviewSubmit',
      });

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = sendReviewInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      // Sub-category ratings for the given reviewType
      const subCategories = reviewType ? SUB_CATEGORIES[reviewType] || [] : [];

      const minLengthValidator = minLength('Please write at least 20 characters', 20);
      const reviewContentValidate = composeValidators(
        required(reviewContentRequiredMessage),
        minLengthValidator
      );

      // Helper: safely format a message with fallback
      const formatSubLabel = labelId =>
        SUB_CATEGORY_FALLBACK_LABELS[labelId] ||
        intl.formatMessage({ id: labelId, defaultMessage: labelId });

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {/* Sub-category ratings */}
          {subCategories.length > 0 && (
            <div className={css.subRatingsSection}>
              <p className={css.subRatingsSectionTitle}>
                <FormattedMessage
                  id="ReviewForm.subRatingsTitle"
                  defaultMessage="Rate your experience"
                />
              </p>
              {subCategories.map((cat, idx) => (
                <div
                  key={cat.key}
                  className={classNames(css.subRatingRow, {
                    [css.subRatingRowLast]: idx === subCategories.length - 1,
                  })}
                >
                  <span className={css.subRatingLabel}>{formatSubLabel(cat.labelId)}</span>
                  <FieldReviewRating
                    className={css.subRatingStars}
                    id={formId ? `${formId}.subRatings.${cat.key}` : `subRatings.${cat.key}`}
                    name={`subRatings.${cat.key}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Overall rating */}
          <FieldReviewRating
            className={css.reviewRating}
            id={formId ? `${formId}.starRating` : 'starRating'}
            name="reviewRating"
            label={reviewRating}
            validate={required(reviewRatingRequiredMessage)}
          />

          {/* Written review */}
          <FieldTextInput
            className={css.reviewContent}
            type="textarea"
            id={formId ? `${formId}.reviewContent` : 'reviewContent'}
            name="reviewContent"
            label={reviewContent}
            placeholder={reviewContentPlaceholderMessage}
            validate={reviewContentValidate}
          />

          {errorArea}
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={reviewSent}
          >
            {reviewSubmitMessage}
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

export default ReviewForm;
