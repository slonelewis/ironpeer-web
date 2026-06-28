import React, { useEffect } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { displayDeliveryPickup, displayDeliveryShipping } from '../../../../util/configHelpers';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
  required,
} from '../../../../util/validators';

// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  Button,
  FieldCurrencyInput,
  FieldTextInput,
  FieldCheckbox,
  FieldRadioButton,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingDeliveryForm.module.css';

const identity = v => v;

/**
 * The EditListingDeliveryForm component.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.formId - The form ID
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.saveActionMsg - The save action message
 * @param {Object} props.selectedPlace - The selected place
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {boolean} props.hasStockInUse - Whether the stock is in use
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the form is in progress
 * @param {Object} props.fetchErrors - The fetch errors
 * @param {propTypes.error} [props.fetchErrors.showListingsError] - The show listings error
 * @param {propTypes.error} [props.fetchErrors.updateListingError] - The update listing error
 * @param {boolean} props.autoFocus - Whether the form is auto focused
 * @returns {JSX.Element} The EditListingDeliveryForm component
 */
export const EditListingDeliveryForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId = 'EditListingDeliveryForm',
        form,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        pristine,
        invalid,
        listingTypeConfig,
        marketplaceCurrency,
        allowOrdersOfMultipleItems = false,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
      } = formRenderProps;
      const intl = useIntl();

      // This is a bug fix for Final Form.
      // Without this, React will return a warning:
      //   "Cannot update a component (`ForwardRef(Field)`)
      //   while rendering a different component (`ForwardRef(Field)`)"
      // This seems to happen because validation calls listeneres and
      // that causes state to change inside final-form.
      // https://github.com/final-form/react-final-form/issues/751
      //
      // TODO: it might not be worth the trouble to show these fields as disabled,
      // if this fix causes trouble in future dependency updates.
      const { pauseValidation, resumeValidation } = form;
      pauseValidation(false);
      useEffect(() => resumeValidation(), [values]);

      const displayShipping = displayDeliveryShipping(listingTypeConfig);
      const displayPickup = displayDeliveryPickup(listingTypeConfig);
      const displayMultipleDelivery = displayShipping && displayPickup;
      const shippingEnabled = displayShipping && values.deliveryOptions?.includes('shipping');
      const pickupEnabled = displayPickup && values.deliveryOptions?.includes('pickup');

      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingDeliveryForm.optionalText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
        invalid || disabled || submitInProgress || (!shippingEnabled && !pickupEnabled);

      const shippingLabel = intl.formatMessage({ id: 'EditListingDeliveryForm.shippingLabel' });
      const pickupLabel = intl.formatMessage({ id: 'EditListingDeliveryForm.pickupLabel' });

      const pickupClasses = classNames({
        [css.deliveryOption]: displayMultipleDelivery,
        [css.disabled]: !pickupEnabled,
        [css.hidden]: !displayPickup,
      });
      const shippingClasses = classNames({
        [css.deliveryOption]: displayMultipleDelivery,
        [css.disabled]: !shippingEnabled,
        [css.hidden]: !displayShipping,
      });
      const currencyConfig = appSettings.getCurrencyFormatting(marketplaceCurrency);

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldCheckbox
            id={formId ? `${formId}.pickup` : 'pickup'}
            className={classNames(css.deliveryCheckbox, { [css.hidden]: !displayMultipleDelivery })}
            name="deliveryOptions"
            label={pickupLabel}
            value="pickup"
          />
          <div className={pickupClasses}>
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDeliveryForm.updateFailed" />
              </p>
            ) : null}

            {showListingsError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDeliveryForm.showListingFailed" />
              </p>
            ) : null}

            <FieldLocationAutocompleteInput
              disabled={!pickupEnabled}
              rootClassName={css.input}
              inputClassName={css.locationAutocompleteInput}
              iconClassName={css.locationAutocompleteInputIcon}
              predictionsClassName={css.predictionsRoot}
              validClassName={css.validLocation}
              autoFocus={autoFocus}
              name="location"
              id={`${formId}.location`}
              label={intl.formatMessage({ id: 'EditListingDeliveryForm.address' })}
              placeholder={intl.formatMessage({
                id: 'EditListingDeliveryForm.addressPlaceholder',
              })}
              useDefaultPredictions={false}
              format={identity}
              valueFromForm={values.location}
              validate={
                pickupEnabled
                  ? composeValidators(
                      autocompleteSearchRequired(addressRequiredMessage),
                      autocompletePlaceSelected(addressNotRecognizedMessage)
                    )
                  : () => {}
              }
              hideErrorMessage={!pickupEnabled}
              // Whatever parameters are being used to calculate
              // the validation function need to be combined in such
              // a way that, when they change, this key prop
              // changes, thus reregistering this field (and its
              // validation function) with Final Form.
              // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
              key={pickupEnabled ? 'locationValidation' : 'noLocationValidation'}
            />

            <FieldTextInput
              className={css.input}
              type="text"
              name="building"
              id={formId ? `${formId}.building` : 'building'}
              label={intl.formatMessage(
                { id: 'EditListingDeliveryForm.building' },
                { optionalText }
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingDeliveryForm.buildingPlaceholder',
              })}
              disabled={!pickupEnabled}
            />
          </div>

          <FieldCheckbox
            id={formId ? `${formId}.shipping` : 'shipping'}
            className={classNames(css.deliveryCheckbox, { [css.hidden]: !displayMultipleDelivery })}
            name="deliveryOptions"
            label={shippingLabel}
            value="shipping"
          />

          <div className={shippingClasses}>
            {/* IronPeer: delivery method */}
            {shippingEnabled && (
              <div className={css.deliveryMethodSection}>
                <p className={css.deliveryMethodLabel}>How will you deliver it?</p>
                <FieldRadioButton
                  id={`${formId}.deliveryMethod.self`}
                  name="deliveryMethod"
                  label="I'll deliver it myself"
                  value="self"
                />
                <FieldRadioButton
                  id={`${formId}.deliveryMethod.hauler`}
                  name="deliveryMethod"
                  label="I need a hauler to deliver it"
                  value="hauler"
                />

                {values.deliveryMethod === 'self' && (
                  <div className={css.deliverySubFields}>
                    <FieldTextInput
                      className={css.input}
                      type="number"
                      name="deliveryRadiusMiles"
                      id={`${formId}.deliveryRadiusMiles`}
                      label="Delivery radius (miles)"
                      placeholder="e.g. 50"
                      min="1"
                    />
                    <div className={css.feeTypeSection}>
                      <p className={css.feeTypeLabel}>How do you charge for delivery?</p>
                      <div className={css.feeTypeOption}>
                        <FieldRadioButton
                          id={`${formId}.deliveryFeeType.flat`}
                          name="deliveryFeeType"
                          label="Flat fee"
                          value="flat"
                        />
                        <p className={css.feeTypeHint}>One price, regardless of distance</p>
                      </div>
                      <div className={css.feeTypeOption}>
                        <FieldRadioButton
                          id={`${formId}.deliveryFeeType.flatPlusMileage`}
                          name="deliveryFeeType"
                          label="Flat fee + per mile"
                          value="flatPlusMileage"
                        />
                        <p className={css.feeTypeHint}>Base rate plus a per-mile charge</p>
                      </div>
                    </div>
                    {(values.deliveryFeeType === 'flat' || values.deliveryFeeType === 'flatPlusMileage') && (
                      <FieldCurrencyInput
                        id={`${formId}.deliveryFee`}
                        name="deliveryFee"
                        className={css.input}
                        label={values.deliveryFeeType === 'flatPlusMileage' ? 'Base delivery fee' : 'Delivery fee (leave blank if free)'}
                        placeholder="$0.00"
                        currencyConfig={currencyConfig}
                      />
                    )}
                    {values.deliveryFeeType === 'flatPlusMileage' && (
                      <FieldCurrencyInput
                        id={`${formId}.deliveryPricePerMile`}
                        name="deliveryPricePerMile"
                        className={css.input}
                        label="Rate per mile"
                        placeholder="e.g. $2.50"
                        currencyConfig={currencyConfig}
                      />
                    )}
                  </div>
                )}

                {values.deliveryMethod === 'hauler' && (
                  <div className={css.deliverySubFields}>
                    <div className={css.infoBox}>
                      🚛 <strong>Hauler network coming soon</strong> — we'll match your listing with a qualified hauler when the network launches. Fill in your equipment details below so we're ready.
                    </div>
                    <FieldTextInput
                      className={css.input}
                      type="number"
                      name="equipmentWeightLbs"
                      id={`${formId}.equipmentWeightLbs`}
                      label="Equipment weight (lbs)"
                      placeholder="e.g. 8500"
                      min="1"
                    />
                    <div className={css.dimensionsRow}>
                      <FieldTextInput
                        className={css.dimensionInput}
                        type="number"
                        name="equipmentLengthFt"
                        id={`${formId}.equipmentLengthFt`}
                        label="Length (ft)"
                        placeholder="L"
                        min="1"
                      />
                      <FieldTextInput
                        className={css.dimensionInput}
                        type="number"
                        name="equipmentWidthFt"
                        id={`${formId}.equipmentWidthFt`}
                        label="Width (ft)"
                        placeholder="W"
                        min="1"
                      />
                      <FieldTextInput
                        className={css.dimensionInput}
                        type="number"
                        name="equipmentHeightFt"
                        id={`${formId}.equipmentHeightFt`}
                        label="Height (ft)"
                        placeholder="H"
                        min="1"
                      />
                    </div>
                    <FieldTextInput
                      className={css.input}
                      type="textarea"
                      name="haulerNotes"
                      id={`${formId}.haulerNotes`}
                      label="Notes for hauler (optional)"
                      placeholder="Any special instructions for loading, access, etc."
                    />
                  </div>
                )}
              </div>
            )}

            {/* IronPeer: shipping fee fields hidden — delivery pricing handled by IronPeer's own fields above.
                Validation removed so these hidden fields don't block form submission. */}
            <FieldCurrencyInput
              id={
                formId
                  ? `${formId}.shippingPriceInSubunitsOneItem`
                  : 'shippingPriceInSubunitsOneItem'
              }
              name="shippingPriceInSubunitsOneItem"
              style={{ display: 'none' }}
              className={css.input}
              label={intl.formatMessage({
                id: 'EditListingDeliveryForm.shippingOneItemLabel',
              })}
              placeholder={intl.formatMessage({
                id: 'EditListingDeliveryForm.shippingOneItemPlaceholder',
              })}
              currencyConfig={currencyConfig}
              disabled
              validate={null}
              hideErrorMessage
              key="oneItemHidden"
            />

            {allowOrdersOfMultipleItems ? (
              <FieldCurrencyInput
                id={
                  formId
                    ? `${formId}.shippingPriceInSubunitsAdditionalItems`
                    : 'shippingPriceInSubunitsAdditionalItems'
                }
                name="shippingPriceInSubunitsAdditionalItems"
                style={{ display: 'none' }}
                className={css.input}
                label={intl.formatMessage({
                  id: 'EditListingDeliveryForm.shippingAdditionalItemsLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'EditListingDeliveryForm.shippingAdditionalItemsPlaceholder',
                })}
                currencyConfig={currencyConfig}
                disabled
                validate={null}
                hideErrorMessage
                key="additionalItemsHidden"
              />
            ) : null}
          </div>

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingDeliveryForm;
