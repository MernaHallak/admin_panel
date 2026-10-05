export function validateTranslatedFields(
  valueEn: string | undefined,
  valueAr: string | undefined,
  fieldEn: string,
  fieldAr: string,
  messageEn: string,
  messageAr: string,
) {
  const errors: Record<string, string> = {};

  if (valueEn && !valueAr) {
    errors[fieldAr] = messageAr;
  }

  if (valueAr && !valueEn) {
    errors[fieldEn] = messageEn;
  }

  return errors;
}

export function containsArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

export function containsEnglish(value: string) {
  return /[A-Za-z]/.test(value);
}
