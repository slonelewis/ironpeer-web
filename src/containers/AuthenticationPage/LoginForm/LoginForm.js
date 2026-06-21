import React, { useState, useEffect } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, NamedLink } from '../../../components';

import css from './LoginForm.module.css';

const REMEMBER_ME_KEY = 'ironpeer_remember_email';

const LoginFormComponent = props => {
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(REMEMBER_ME_KEY);
    if (stored) {
      setSavedEmail(stored);
      setRememberMe(true);
    }
  }, []);

  const handleRememberSubmit = (values, form) => {
    if (rememberMe && values.email) {
      localStorage.setItem(REMEMBER_ME_KEY, values.email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
    if (props.onSubmit) props.onSubmit(values, form);
  };

  return (
  <FinalForm
    {...props}
    initialValues={savedEmail ? { email: savedEmail } : props.initialValues}
    onSubmit={handleRememberSubmit}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        intl,
        invalid,
        values,
        errors,
      } = fieldRenderProps;

      // email
      const emailLabel = intl.formatMessage({
        id: 'LoginForm.emailLabel',
      });
      const emailPlaceholder = intl.formatMessage({
        id: 'LoginForm.emailPlaceholder',
      });
      const emailRequiredMessage = intl.formatMessage({
        id: 'LoginForm.emailRequired',
      });
      const emailRequired = validators.required(emailRequiredMessage);
      const emailInvalidMessage = intl.formatMessage({
        id: 'LoginForm.emailInvalid',
      });
      const emailValid = validators.emailFormatValid(emailInvalidMessage);

      // password
      const passwordLabel = intl.formatMessage({
        id: 'LoginForm.passwordLabel',
      });
      const passwordPlaceholder = intl.formatMessage({
        id: 'LoginForm.passwordPlaceholder',
      });
      const passwordRequiredMessage = intl.formatMessage({
        id: 'LoginForm.passwordRequired',
      });
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      const passwordRecoveryLink = (
        <NamedLink
          name="PasswordRecoveryPage"
          className={css.recoveryLink}
          to={{
            search:
              values?.email && !errors?.email ? `email=${encodeURIComponent(values.email)}` : '',
          }}
        >
          <FormattedMessage id="LoginForm.forgotPassword" />
        </NamedLink>
      );

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div>
            <FieldTextInput
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={emailLabel}
              placeholder={emailPlaceholder}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
            <FieldTextInput
              className={css.password}
              type="password"
              id={formId ? `${formId}.password` : 'password'}
              name="password"
              autoComplete="current-password"
              label={passwordLabel}
              placeholder={passwordPlaceholder}
              validate={passwordRequired}
            />
          </div>
          <div className={css.rememberMeRow}>
            <label className={css.rememberMeLabel}>
              <input
                type="checkbox"
                className={css.rememberMeCheckbox}
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>
          <div className={css.bottomWrapper}>
            <p className={css.bottomWrapperText}>
              <span className={css.recoveryLinkInfo}>
                <FormattedMessage
                  id="LoginForm.forgotPasswordInfo"
                  values={{ passwordRecoveryLink }}
                />
              </span>
            </p>
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="LoginForm.logIn" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
  );
};

/**
 * A component that renders the login form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @returns {JSX.Element}
 */
const LoginForm = props => {
  const intl = useIntl();
  return <LoginFormComponent {...props} intl={intl} />;
};

export default LoginForm;
