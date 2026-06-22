import React from 'react';
import css from './DeliveryAddressSection.module.css';

/**
 * Shown on checkout when renter selected delivery.
 * Collects the delivery address and saves it to orderData.
 */
const DeliveryAddressSection = ({ value = {}, onChange }) => {
  const handle = field => e => onChange({ ...value, [field]: e.target.value });

  return (
    <div className={css.root}>
      <h3 className={css.title}>📍 Delivery address</h3>
      <p className={css.subtitle}>Where should the equipment be delivered?</p>

      <div className={css.row}>
        <label className={css.label}>Street address <span className={css.req}>*</span></label>
        <input
          className={css.input}
          type="text"
          placeholder="123 Main St"
          value={value.street || ''}
          onChange={handle('street')}
        />
      </div>

      <div className={css.twoCol}>
        <div className={css.col}>
          <label className={css.label}>City <span className={css.req}>*</span></label>
          <input
            className={css.input}
            type="text"
            placeholder="Ellensburg"
            value={value.city || ''}
            onChange={handle('city')}
          />
        </div>
        <div className={css.col}>
          <label className={css.label}>State <span className={css.req}>*</span></label>
          <input
            className={css.input}
            type="text"
            placeholder="WA"
            maxLength={2}
            value={value.state || ''}
            onChange={handle('state')}
          />
        </div>
      </div>

      <div className={css.row}>
        <label className={css.label}>ZIP code <span className={css.req}>*</span></label>
        <input
          className={css.input}
          type="text"
          placeholder="98926"
          maxLength={10}
          value={value.zip || ''}
          onChange={handle('zip')}
        />
      </div>

      <div className={css.row}>
        <label className={css.label}>Delivery notes (optional)</label>
        <input
          className={css.input}
          type="text"
          placeholder="Gate code, access instructions, etc."
          value={value.notes || ''}
          onChange={handle('notes')}
        />
      </div>
    </div>
  );
};

export default DeliveryAddressSection;
