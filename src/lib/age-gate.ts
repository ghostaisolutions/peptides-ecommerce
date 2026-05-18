export const MINIMUM_AGE = 21;

const buildValidatedDate = (year: number, month: number, day: number): Date | null => {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;

  // Use a fixed local-midday timestamp to avoid timezone edge cases.
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;

  return parsed;
};

export const parseDateOfBirth = (dob: string): Date | null => {
  const normalized = dob.trim();
  const isoLikeMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const usLikeMatch = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const compactMatch = normalized.match(/^\d{8}$/);

  if (isoLikeMatch) {
    return buildValidatedDate(Number(isoLikeMatch[1]), Number(isoLikeMatch[2]), Number(isoLikeMatch[3]));
  }

  if (usLikeMatch) {
    return buildValidatedDate(Number(usLikeMatch[3]), Number(usLikeMatch[1]), Number(usLikeMatch[2]));
  }

  if (compactMatch) {
    const possibleYear = Number(normalized.slice(0, 4));
    if (possibleYear >= 1900) {
      return buildValidatedDate(possibleYear, Number(normalized.slice(4, 6)), Number(normalized.slice(6, 8)));
    }

    return buildValidatedDate(Number(normalized.slice(4, 8)), Number(normalized.slice(0, 2)), Number(normalized.slice(2, 4)));
  }

  return null;
};

export const calculateAge = (birth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const formatDateOfBirthForStorage = (dob: string): string | null => {
  const parsedDob = parseDateOfBirth(dob);
  if (!parsedDob) return null;

  const year = parsedDob.getFullYear();
  const month = String(parsedDob.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDob.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isAtLeastMinimumAge = (dob: string, minimumAge = MINIMUM_AGE): boolean => {
  const parsedDob = parseDateOfBirth(dob);
  if (!parsedDob) return false;

  const age = calculateAge(parsedDob);
  return !Number.isNaN(age) && age >= minimumAge;
};
