"use client";

import {type FormEvent, useState} from "react";
import {useTranslations} from "next-intl";

import {LanguageSwitcher} from "@/components/language-switcher";
import {useLogin} from "@/hook/mutations/use-login";
import {useRouter} from "@/i18n/navigation";
import {normalizeApiError} from "@/lib/api-error";

export function LoginForm() {
  const t = useTranslations("Auth");
  const common = useTranslations("Common");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const {mutate, error, isError, isPending, reset} = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isRedirecting) return;

    setFieldErrors({});
    reset();

    const currentFieldErrors: {email?: string; password?: string} = {};
    if (!email.trim() || !email.includes("@")) {
      currentFieldErrors.email = t("emailRequired");
    }
    if (!password) {
      currentFieldErrors.password = t("passwordRequired");
    }
    if (Object.keys(currentFieldErrors).length) {
      setFieldErrors(currentFieldErrors);
      return;
    }

    mutate(
      {email: email.trim(), password},
      {
        onSuccess: () => {
          setIsRedirecting(true);
          router.replace("/");
        },
      },
    );
  }

  const isSubmitting = isPending || isRedirecting;
  const normalizedError = isError ? normalizeApiError(error, "login") : undefined;
  const emailError = fieldErrors.email ?? normalizedError?.fieldErrors.email;
  const passwordError = fieldErrors.password ?? normalizedError?.fieldErrors.password;
  const formError = !emailError && !passwordError && normalizedError
    ? common(normalizedError.translationKey)
    : undefined;

  return (
    <main className="auth-page">
      <div className="auth-toolbar">
        <LanguageSwitcher />
      </div>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">S</div>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="login-title">{t("loginTitle")}</h1>
        <p className="auth-description">{t("loginDescription")}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">{t("email")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors({});
                reset();
              }}
              placeholder={t("emailPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              required
            />
            {emailError && <p className="field-error" id="email-error" role="alert">{emailError}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors({});
                reset();
              }}
              placeholder={t("passwordPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "password-error" : undefined}
              required
            />
            {passwordError && <p className="field-error" id="password-error" role="alert">{passwordError}</p>}
          </div>

          {formError && <p className="error-message" role="alert">{formError}</p>}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting && <span className="spinner" aria-hidden="true" />}
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </form>
      </section>
    </main>
  );
}
