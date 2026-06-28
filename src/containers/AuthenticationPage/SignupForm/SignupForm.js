import React from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';

import { Form, PrimaryButton, FieldTextInput } from '../../../components';

import css from './SignupForm.module.css';

const isPasswordUsedMoreThanOnce = formValues => {
  const pw = formValues.password;
  const hasPasswordString = pw != null && pw.length >= validators.PASSWORD_MIN_LENGTH;
  if (hasPasswordString) {
    return Object.values(formValues).filter(v => v === pw).length > 1;
  }
  return false;
};

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    initialValues={{ fname: '', lname: '', userRoles: [] }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
        values,
      } = formRenderProps;

      const emailRequired = validators.required(
        intl.formatMessage({ id: 'SignupForm.emailRequired' })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({ id: 'SignupForm.emailInvalid' })
      );

      const passwordRequiredMessage = intl.formatMessage({ id: 'SignupForm.passwordRequired' });
      const passwordMinLength = validators.minLength(
        intl.formatMessage({ id: 'SignupForm.passwordTooShort' }, { minLength: validators.PASSWORD_MIN_LENGTH }),
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        intl.formatMessage({ id: 'SignupForm.passwordTooLong' }, { maxLength: validators.PASSWORD_MAX_LENGTH }),
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordValidators = validators.composeValidators(
        validators.requiredStringNoTrim(passwordRequiredMessage),
        passwordMinLength,
        passwordMaxLength
      );

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress || isPasswordUsedMoreThanOnce(values);

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {/* Name fields — collected here so users don't show up as 'New Member' */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <FieldTextInput
              type="text"
              id={formId ? `${formId}.fname` : 'fname'}
              name="fname"
              autoComplete="given-name"
              label={intl.formatMessage({ id: 'SignupForm.firstNameLabel' }) + ' *'}
              placeholder={intl.formatMessage({ id: 'SignupForm.firstNamePlaceholder' })}
              validate={validators.required(intl.formatMessage({ id: 'SignupForm.firstNameRequired' }))}
              style={{ flex: 1 }}
            />
            <FieldTextInput
              type="text"
              id={formId ? `${formId}.lname` : 'lname'}
              name="lname"
              autoComplete="family-name"
              label={intl.formatMessage({ id: 'SignupForm.lastNameLabel' }) + ' *'}
              placeholder={intl.formatMessage({ id: 'SignupForm.lastNamePlaceholder' })}
              validate={validators.required(intl.formatMessage({ id: 'SignupForm.lastNameRequired' }))}
              style={{ flex: 1 }}
            />
          </div>

          <Field name="userRoles" render={() => null} />

          <FieldTextInput
            type="email"
            id={formId ? `${formId}.email` : 'email'}
            name="email"
            autoComplete="email"
            label={intl.formatMessage({ id: 'SignupForm.emailLabel' }) + ' *'}
            placeholder={intl.formatMessage({ id: 'SignupForm.emailPlaceholder' })}
            validate={validators.composeValidators(emailRequired, emailValid)}
          />

          <FieldTextInput
            className={css.password}
            type="password"
            id={formId ? `${formId}.password` : 'password'}
            name="password"
            autoComplete="new-password"
            label={intl.formatMessage({ id: 'SignupForm.passwordLabel' }) + ' *'}
            placeholder={intl.formatMessage({ id: 'SignupForm.passwordPlaceholder' })}
            validate={passwordValidators}
          />

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            {isPasswordUsedMoreThanOnce(values) ? (
              <div className={css.error}>
                <FormattedMessage id="SignupForm.passwordRepeatedOnOtherFields" />
              </div>
            ) : null}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="SignupForm.signUp" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

const SignupForm = props => {
  const intl = useIntl();
  return <SignupFormComponent {...props} intl={intl} />;
};

export default SignupForm;
