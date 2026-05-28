const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const ARGENTINA_OFFSET = '-03:00';

function normalizeWithOffset(value: string): Date {
  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(value)) {
    return new Date(value);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00${ARGENTINA_OFFSET}`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}:00${ARGENTINA_OFFSET}`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}${ARGENTINA_OFFSET}`);
  }

  return new Date(value);
}

export function parseArgentinaDateTime(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  return normalizeWithOffset(value);
}

export const TORNEO_TIME_ZONE = ARGENTINA_TIME_ZONE;
