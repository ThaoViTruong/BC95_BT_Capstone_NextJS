export function normalizeBookingDate(value?: string) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const isoMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})T/);

  if (isoMatch) {
    return isoMatch[1];
  }

  const viMatch = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (viMatch) {
    const [, day, month, year] = viMatch;
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toBookingDateTime(value?: string) {
  const normalizedValue = normalizeBookingDate(value);

  if (!normalizedValue) {
    return null;
  }

  const date = new Date(`${normalizedValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function getBookingNightCount(checkIn?: string, checkOut?: string) {
  const checkInTime = toBookingDateTime(checkIn);
  const checkOutTime = toBookingDateTime(checkOut);

  if (checkInTime === null || checkOutTime === null) {
    return 0;
  }

  const diffTime = checkOutTime - checkInTime;
  const diffDays = Math.round(diffTime / 86_400_000);

  return diffDays > 0 ? diffDays : 0;
}

export function hasMinimumOneNightStay(checkIn?: string, checkOut?: string) {
  return getBookingNightCount(checkIn, checkOut) >= 1;
}
