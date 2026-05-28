const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const ARGENTINA_OFFSET = '-03:00';

function normalizeWithOffset(value: string): Date {
  const trimmed = value.trim();

  const argentinaDateTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (argentinaDateTime) {
    const [, day, month, year, hour = '00', minute = '00'] = argentinaDateTime;
    return new Date(
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00${ARGENTINA_OFFSET}`,
    );
  }

  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(trimmed)) {
    return new Date(trimmed);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00${ARGENTINA_OFFSET}`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}:00${ARGENTINA_OFFSET}`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}${ARGENTINA_OFFSET}`);
  }

  return new Date(trimmed);
}

export function parseArgentinaDateTime(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  return normalizeWithOffset(value);
}

export const TORNEO_TIME_ZONE = ARGENTINA_TIME_ZONE;
