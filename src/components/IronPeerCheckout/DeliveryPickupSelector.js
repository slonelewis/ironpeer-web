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
 * @param {number} [props.deliveryFee] - Delivery fee in cents
 * @param {number} [props.deliveryRadius] - Delivery radius in miles
 * @param {'pickup'|'delivery'} props.value - Currently selected method
 * @param {Function} props.onChange - Called with 'pickup' or 'delivery' when selection changes
 */
const DeliveryPickupSelector = props => {
  const { deliveryAvailable, deliveryFee, deliveryRadius, value, onChange } = props;

  if (!deliveryAvailable) {
    return null;
  }

  const deliveryFeeDollars = deliveryFee ? Math.round(deliveryFee / 100) : 0;
  const deliveryFeeText = deliveryFee
    ? `+$${deliveryFeeDollars.toLocaleString()}`
    : 'Free';
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
