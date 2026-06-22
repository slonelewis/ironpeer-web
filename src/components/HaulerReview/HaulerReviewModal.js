import React from 'react';
import classNames from 'classnames';

import { Modal, IconReviewUser } from '../index';
import HaulerReviewForm from './HaulerReviewForm';

import css from './HaulerReviewModal.module.css';

/**
 * Modal for leaving a review on a hauler.
 * Mirrors the structure of Sharetribe's ReviewModal but uses HaulerReviewForm.
 *
 * @component
 * @param {Object} props
 * @param {string} props.id - Modal id
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onManageDisableScrolling - Scroll lock handler
 * @param {Function} props.onSubmit - Called with hauler review values
 * @param {string} [props.haulerName] - Display name of the hauler
 * @param {boolean} [props.reviewSent] - Whether review was submitted successfully
 * @param {boolean} [props.sendReviewInProgress] - Submission in progress
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * @returns {JSX.Element}
 */
const HaulerReviewModal = props => {
  const {
    className,
    rootClassName,
    id,
    isOpen,
    onClose,
    onManageDisableScrolling,
    onSubmit,
    haulerName,
    reviewSent = false,
    sendReviewInProgress = false,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <Modal
      id={id}
      containerClassName={classes}
      contentClassName={css.modalContent}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      closeButtonMessage="Later"
    >
      <IconReviewUser className={css.modalIcon} />
      <p className={css.modalTitle}>
        {haulerName ? `Review ${haulerName}` : 'Review your hauler'}
      </p>
      <p className={css.modalMessage}>
        Your honest feedback helps the IronPeer community find reliable haulers.
      </p>
      <HaulerReviewForm
        onSubmit={onSubmit}
        reviewSent={reviewSent}
        sendReviewInProgress={sendReviewInProgress}
        haulerName={haulerName}
      />
    </Modal>
  );
};

export default HaulerReviewModal;
