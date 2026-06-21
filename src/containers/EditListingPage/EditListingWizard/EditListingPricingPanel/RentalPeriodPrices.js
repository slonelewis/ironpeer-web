import React from 'react';
import appSettings from '../../../../config/settings';
import { useIntl } from '../../../../util/reactIntl';
import { FieldCurrencyInput } from '../../../../components';
import * as validators from '../../../../util/validators';

const PERIOD_LABELS = {
  hourly: 'Price per hour',
  daily: 'Price per day',
  weekly: 'Price per week',
  monthly: 'Price per month',
};

const PERIOD_PLACEHOLDERS = {
  hourly: 'e.g. $25',
  daily: 'e.g. $150',
  weekly: 'e.g. $800',
  monthly: 'e.g. $2,500',
};

/**
 * Renders a required price input for each rental period the owner selected.
 * rentalPeriods comes from publicData set in the Details step.
 */
const RentalPeriodPrices = ({ rentalPeriods = [], formId, marketplaceCurrency, listingMinimumPriceSubUnits = 0 }) => {
  const intl = useIntl();

  if (!rentalPeriods.length) {
    return (
      <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
        No rental periods selected. Go back to Details and select at least one rental period.
      </p>
    );
  }

  const priceRequired = validators.required('Price is required');
  const minPriceValidator = listingMinimumPriceSubUnits
    ? validators.moneySubUnitAmountAtLeast(
        `Minimum price is $${listingMinimumPriceSubUnits / 100}`,
        listingMinimumPriceSubUnits
      )
    : null;
  const validate = minPriceValidator
    ? validators.composeValidators(priceRequired, minPriceValidator)
    : priceRequired;

  return (
    <div>
      {rentalPeriods.map(period => (
        <FieldCurrencyInput
          key={period}
          id={`${formId}_rentalPrice_${period}`}
          name={`rentalPrice_${period}`}
          label={PERIOD_LABELS[period] || `Price per ${period}`}
          placeholder={PERIOD_PLACEHOLDERS[period] || '$0'}
          currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
          validate={validate}
          style={{ marginBottom: '1.25rem' }}
        />
      ))}
    </div>
  );
};

export default RentalPeriodPrices;
