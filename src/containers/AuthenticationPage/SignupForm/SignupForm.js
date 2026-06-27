import React from 'react';
import { Form as FinalForm } from 'react-final-form';
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
    // fname + lname required by Sharetribe API — collected for real in ProfileCompletionPage
    initialValues={{ fname: 'New', lname: 'Member' }}
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
