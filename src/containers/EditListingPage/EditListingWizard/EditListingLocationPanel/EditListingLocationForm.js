import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
} from '../../../../util/validators';
import { useConfiguration } from '../../../../context/configurationContext';
import { userLocation } from '../../../../util/maps';
import { locationBounds } from '../../../../util/googleMaps';
import { Map } from '../../../../components/Map/Map';

// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  Button,
  FieldTextInput,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingLocationForm.module.css';

const identity = v => v;

/**
 * The EditListingLocationForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} props.formId - The form id
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} props.autoFocus - Whether the form is auto focused
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.fetchErrors - The fetch errors object
 * @param {string} props.saveActionMsg - The save action message
 * @param {Function} props.onSubmit - The submit function
 * @param {Object} props.errors - The errors object
 * @param {propTypes.error} props.errors.showListingsError - The show listings error
 * @param {propTypes.error} props.errors.updateListingError - The update listing error
 * @returns {JSX.Element}
 */
export const EditListingLocationForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId = 'EditListingLocationForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress = false,
        fetchErrors,
        values,
      } = formRenderProps;

      // Extract coordinates from the selected location for map display
      const selectedLocation = values?.location?.selectedPlace;
      const mapCenter = selectedLocation?.origin
        ? { lat: selectedLocation.origin.lat, lng: selectedLocation.origin.lng }
        : null;
      const mapAddress = selectedLocation?.address || '';

      const intl = useIntl();
      const config = useConfiguration();
      const [locating, setLocating] = useState(false);
      const [locateError, setLocateError] = useState(null);

      const handleUseCurrentLocation = () => {
        setLocating(true);
        setLocateError(null);
        userLocation()
          .then(latlng => {
            // Reverse geocode using Google Maps Geocoder
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latlng.lat, lng: latlng.lng } }, (results, status) => {
              setLocating(false);
              if (status === 'OK' && results?.[0]) {
                const address = results[0].formatted_address;
                const bounds = locationBounds(latlng, config.maps?.search?.currentLocationBoundsDistance || 1000);
                formRenderProps.form.change('location', {
                  search: address,
                  selectedPlace: { address, origin: latlng, bounds },
                });
              } else {
                setLocateError('Could not determine your address. Please type it manually.');
              }
            });
          })
          .catch(() => {
            setLocating(false);
            setLocateError('Location access denied. Please type your address.');
          });
      };

      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingLocationForm.optionalText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.updateFailed" />
            </p>
          ) : null}

          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.showListingFailed" />
            </p>
          ) : null}

          <button
            type="button"
            className={css.currentLocationButton}
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px', verticalAlign: 'middle'}}>
              <path d="M11.9269636.07279915c-.0779984-.0770013-.1959959-.0950016-.2924939-.04400074L.13470842 6.02889945c-.10199788.05300089-.15499678.16900284-.12749735.28100473.02799942.11150188.12799734.1900032.24299496.1900032h5.249891v5.25008842c0 .1150019.07899836.2160036.19049604.2430041C5.71009267 11.998 5.73059224 12 5.75009184 12c.0914981 0 .1779963-.0505009.22199539-.1345023L11.9719627.36530407c.0499989-.09650162.0319993-.21500362-.0449991-.29250492" fillRule="evenodd" />
            </svg>
            {locating ? 'Locating…' : 'Use my current location'}
          </button>
          {locateError ? <p className={css.locateError}>{locateError}</p> : null}

          <FieldLocationAutocompleteInput
            rootClassName={css.locationAddress}
            inputClassName={css.locationAutocompleteInput}
            iconClassName={css.locationAutocompleteInputIcon}
            predictionsClassName={css.predictionsRoot}
            validClassName={css.validLocation}
            autoFocus={autoFocus}
            name="location"
            id={`${formId}.location`}
            label={<>{intl.formatMessage({ id: 'EditListingLocationForm.address' })} <span className={css.requiredStar}>*</span></>}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.addressPlaceholder',
            })}
            useDefaultPredictions={false}
            format={identity}
            valueFromForm={values.location}
            validate={composeValidators(
              autocompleteSearchRequired(addressRequiredMessage),
              autocompletePlaceSelected(addressNotRecognizedMessage)
            )}
          />

          {mapCenter ? (
            <div className={css.mapContainer}>
              <Map
                center={mapCenter}
                obfuscatedCenter={mapCenter}
                address={mapAddress}
                zoom={15}
                useStaticMap={false}
              />
            </div>
          ) : null}

          <FieldTextInput
            className={css.building}
            type="text"
            name="building"
            id={`${formId}building`}
            label={intl.formatMessage({ id: 'EditListingLocationForm.building' }, { optionalText })}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.buildingPlaceholder',
            })}
          />

          <p className={css.requiredLegend}>* Required</p>

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

export default EditListingLocationForm;
