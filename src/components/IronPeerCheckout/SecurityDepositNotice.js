import React from 'react';

import css from './SecurityDepositNotice.module.css';

/**
 * Calculate the security deposit amount (in dollars) based on the listing's daily rate.
 *
 * @param {Object} listingPrice - Money object with { amount: cents, currency: string }
 * @returns {number} Deposit amount in dollars
 */
const getDepositAmount = listingPrice => {
  if (!listingPrice || !listingPrice.amount) {
    return 100;
  }
  // listingPrice.amount is in cents
  const dailyRateDollars = listingPrice.amount / 100;

  if (dailyRateDollars < 50) {
    return 100;
  } else if (dailyRateDollars < 150) {
    return 250;
  } else if (dailyRateDollars < 300) {
    return 500;
  } else {
    return 1000;
  }
};

/**
 * SecurityDepositNotice shows the refundable security deposit that will be held at booking.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.listingPrice - Money object { amount: cents, currency: string }
 * @param {boolean} [props.compact=false] - Compact = single notice line, full = info card
 */
const SecurityDepositNotice = props => {
  const { listingPrice, compact = false } = props;

  const depositAmount = getDepositAmount(listingPrice);
  const formatted = `$${depositAmount.toLocaleString()}`;

  if (compact) {
    return (
      <p className={css.compactText}>
        + {formatted} refundable security deposit
      </p>
    );
  }

  return (
    <div className={css.card}>
      <div className={css.cardHeader}>
        <span className={css.shieldIcon}>🔒</span>
        <h3 className={css.cardTitle}>Security Deposit</h3>
      </div>
      <p className={css.cardBody}>
        Your card will be authorized for a <strong>{formatted} refundable security deposit</strong>{' '}
        at booking. It is fully refunded within 5 business days after the rental ends with no damage
        reported.
      </p>
      <p className={css.cardNote}>
        This amount is separate from your rental charge and is never captured unless damage is
        reported.
      </p>
    </div>
  );
};

export default SecurityDepositNotice;
