import React from 'react';
import classNames from 'classnames';

import css from './CancellationPolicyBox.module.css';

/**
 * CancellationPolicyBox displays IronPeer's 3-tier cancellation policy.
 *
 * @component
 * @param {Object} props
 * @param {boolean} [props.compact=false] - If true, renders a single-line summary. If false, renders a full policy card.
 */
const CancellationPolicyBox = props => {
  const { compact = false } = props;

  if (compact) {
    return (
      <p className={css.compactText}>
        Free cancellation up to 72h before pickup. 50% refund 24–72h. No refund under 24h.
      </p>
    );
  }

  return (
    <div className={css.card}>
      <h3 className={css.cardTitle}>Cancellation Policy</h3>
      <ul className={css.tierList}>
        <li className={css.tier}>
          <span className={css.tierIcon}>✅</span>
          <div className={css.tierContent}>
            <span className={css.tierTitle}>72+ hours before pickup</span>
            <span className={css.tierDesc}>Full refund — cancel anytime more than 72 hours ahead.</span>
          </div>
        </li>
        <li className={css.tier}>
          <span className={css.tierIcon}>⚠️</span>
          <div className={css.tierContent}>
            <span className={css.tierTitle}>24–72 hours before pickup</span>
            <span className={css.tierDesc}>50% refund — partial refund if you cancel 1–3 days out.</span>
          </div>
        </li>
        <li className={css.tier}>
          <span className={css.tierIcon}>❌</span>
          <div className={css.tierContent}>
            <span className={css.tierTitle}>Under 24 hours before pickup</span>
            <span className={css.tierDesc}>No refund — cancellations less than 24 hours before are non-refundable.</span>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default CancellationPolicyBox;
