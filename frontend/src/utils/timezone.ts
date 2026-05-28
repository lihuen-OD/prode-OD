export const TOURNAMENT_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const ARGENTINA_OFFSET = '-03:00';

type DateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

function getDateTimeParts(value: string | Date, timeZone = TOURNAMENT_TIME_ZONE): DateTimeParts {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const extracted = parts.reduce<Partial<DateTimeParts>>((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type as keyof DateTimeParts] = part.value;
    }
    return accumulator;
  }, {});

  return {
    year: extracted.year ?? '1970',
    month: extracted.month ?? '01',
    day: extracted.day ?? '01',
    hour: extracted.hour ?? '00',
    minute: extracted.minute ?? '00',
  };
}

function normalizeTimeValue(value: string): string {
  const trimmed = value.trim();
  const match = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap]\.??m\.??|AM|PM)?$/i.exec(trimmed);

  if (!match) {
    return trimmed;
  }

  let hour = Number(match[1]);
  const minute = match[2] ?? '00';
  const suffix = match[3]?.replaceAll('.', '').toUpperCase();

  if (suffix === 'AM' || suffix === 'PM') {
    if (hour === 12) {
      hour = 0;
    }
    if (suffix === 'PM') {
      hour += 12;
    }
  }

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

export function buildTournamentDateTimeIso(date: string, time: string): string {
  return `${date}T${normalizeTimeValue(time)}:00${ARGENTINA_OFFSET}`;
}

export function parseTournamentDateTime(date: string, time: string): Date {
  return new Date(buildTournamentDateTimeIso(date, time));
}

export function formatTournamentDateKey(value: string | Date): string {
  const parts = getDateTimeParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatTournamentTime(value: string | Date): string {
  const parts = getDateTimeParts(value);
  return `${parts.hour}:${parts.minute}`;
}

export function formatTournamentDateTimeInput(value: string | Date): string {
  const parts = getDateTimeParts(value);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatTournamentDateLabel(value: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TOURNAMENT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }).format(typeof value === 'string' ? new Date(value) : value);
}
