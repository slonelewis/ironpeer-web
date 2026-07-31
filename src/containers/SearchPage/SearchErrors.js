import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';

import { H3, H5 } from '../../components';

import css from './SearchPage.module.css';

/**
 * Search listing API error and invalid dates filter messages shared by map and grid variants.
 *
 * @param {Object} props
 * @param {boolean} [props.searchListingsError] - Truthy when search failed
 * @param {boolean} props.isValidDatesFilter - False when URL dates conflict with selected filter
 * @param {number} [props.resultCount] - Number of results currently shown; suppress error when > 0
 * @returns {JSX.Element}
 */
const SearchErrors = ({ searchListingsError, isValidDatesFilter, resultCount = 0 }) => (
  <>
    {searchListingsError && resultCount === 0 ? (
      <H3 className={css.error}>
        <FormattedMessage id="SearchPage.searchError" />
      </H3>
    ) : null}
    {!isValidDatesFilter ? (
      <H5>
        <FormattedMessage id="SearchPage.invalidDatesFilter" />
      </H5>
    ) : null}
  </>
);

export default SearchErrors;
