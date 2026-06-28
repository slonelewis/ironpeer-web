import React from 'react';
import classNames from 'classnames';

import css from './DeliveryPickupSelector.module.css';

/**
 * DeliveryPickupSelector allows renters to choose between pickup and delivery at booking.
 * Only renders if `deliveryAvailable` is true.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.deliveryAvailable - Whether delivery is offered for this listing
 * @param {number} [props.deliveryFee] - Delivery fee in cents (flat, or base fee for flat+mile)
 * @param {number} [props.deliveryRadius] - Delivery radius in miles
 * @param {'flat'|'flatPlusMileage'} [props.deliveryFeeType] - Fee structure type
 * @param {number} [props.deliveryPricePerMile] - Per-mile rate in cents (flatPlusMileage only)
 * @param {'pickup'|'delivery'} props.value - Currently selected method
 * @param {Function} props.onChange - Called with 'pickup' or 'delivery' when selection changes
 */
const DeliveryPickupSelector = props => {
  const { deliveryAvailable, deliveryFee, deliveryRadius, deliveryFeeType, deliveryPricePerMile, value, onChange } = props;

  if (!deliveryAvailable) {
    return null;
  }

  const isPerMile = deliveryFeeType === 'flatPlusMileage' && deliveryPricePerMile;
  const baseFeeDollars = deliveryFee ? (deliveryFee / 100) : 0;
  const perMileDollars = deliveryPricePerMile ? (deliveryPricePerMile / 100) : 0;

  let deliveryFeeText;
  if (isPerMile) {
    const basePart = baseFeeDollars > 0 ? `$${baseFeeDollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : null;
    const perMilePart = `$${perMileDollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/mi`;
    deliveryFeeText = basePart ? `${basePart} + ${perMilePart}` : `From ${perMilePart}`;
  } else if (deliveryFee) {
    deliveryFeeText = `+$${Math.round(baseFeeDollars).toLocaleString()}`;
  } else {
    deliveryFeeText = 'Free';
  }

  const radiusText = deliveryRadius ? `, within ${deliveryRadius} miles` : '';

  const handleSelect = method => {
    if (onChange) {
      onChange(method);
    }
  };

  return (
    <div className={css.root}>
      <p className={css.label}>How would you like to get the equipment?</p>
      <div className={css.options}>
        <button
          type="button"
          className={classNames(css.optionCard, { [css.optionCardSelected]: value === 'pickup' })}
          onClick={() => handleSelect('pickup')}
          aria-pressed={value === 'pickup'}
        >
          <span className={css.optionIcon} aria-hidden="true">📍</span>
          <div className={css.optionContent}>
            <span className={css.optionTitle}>Pickup</span>
            <span className={css.optionDetail}>Free — you pick it up</span>
          </div>
          {value === 'pickup' && (
            <span className={css.checkmark} aria-hidden="true">✓</span>
          )}
        </button>

        <button
          type="button"
          className={classNames(css.optionCard, { [css.optionCardSelected]: value === 'delivery' })}
          onClick={() => handleSelect('delivery')}
          aria-pressed={value === 'delivery'}
        >
          <span className={css.optionIcon} aria-hidden="true">🚚</span>
          <div className={css.optionContent}>
            <span className={css.optionTitle}>Delivery</span>
            <span className={css.optionDetail}>{deliveryFeeText}{radiusText}</span>
          </div>
          {value === 'delivery' && (
            <span className={css.checkmark} aria-hidden="true">✓</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeliveryPickupSelector;
