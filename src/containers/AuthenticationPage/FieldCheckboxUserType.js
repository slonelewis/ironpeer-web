import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';

import css from './AuthenticationPage.module.css';

/**
 * Checkbox-based user role selector. Allows selecting one or more roles at signup.
 * Stores selections in the `userRoles` field as an array.
 *
 * @component
 * @param {Object} props
 * @param {string} props.name - The field name (should be 'userRoles')
 * @param {Array<propTypes.userType>} props.userTypes - The available user types
 * @param {boolean} props.hasExistingUserType - Whether the user already has a type (hide if so)
 * @param {intlShape} props.intl - The intl object
 */
const FieldCheckboxUserType = props => {
  const { name, userTypes, hasExistingUserType, intl } = props;
  const hasMultipleUserTypes = userTypes?.length > 1;

  if (!hasMultipleUserTypes || hasExistingUserType) return null;

  return (
    <div className={css.userTypeCheckboxGroup}>
      <label className={css.userTypeCheckboxLabel}>
        {intl.formatMessage({ id: 'FieldSelectUserType.label' })}
        {' '}<span style={{ color: '#E8450A', fontWeight: 600 }}>*</span>
      </label>
      <div className={css.userTypeCheckboxOptions}>
        {userTypes.map(config => {
          const type = config.userType;
          const isComingSoon = !!config.comingSoon;
          return (
            <Field key={type} name={name} type="checkbox" value={type}>
              {({ input }) => (
                <label
                  className={css.userTypeCheckboxOption}
                  style={isComingSoon ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                >
                  <input
                    {...input}
                    className={css.userTypeCheckboxInput}
                    disabled={isComingSoon}
                  />
                  <span className={css.userTypeCheckboxText}>
                    <strong>{config.label}</strong>
                    {isComingSoon && (
                      <span style={{
                        display: 'inline-block',
                        marginLeft: '8px',
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '20px',
                        verticalAlign: 'middle',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>Coming Soon</span>
                    )}
                    {config.description ? (
                      <span className={css.userTypeCheckboxDesc}>{config.description}</span>
                    ) : null}
                  </span>
                </label>
              )}
            </Field>
          );
        })}
      </div>
    </div>
  );
};

export default FieldCheckboxUserType;
