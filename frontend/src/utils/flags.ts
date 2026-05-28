const FLAG_CODE_BY_TEAM_NAME: Record<string, string> = {
  // Grupo A
  mexico: 'mx',
  'méxico': 'mx',
  sudafrica: 'za',
  'sudáfrica': 'za',
  'corea del sur': 'kr',
  'republica checa': 'cz',
  'república checa': 'cz',

  // Grupo B
  canada: 'ca',
  'canadá': 'ca',
  'bosnia y herzegovina': 'ba',
  qatar: 'qa',
  suiza: 'ch',

  // Grupo C
  brasil: 'br',
  marruecos: 'ma',
  haiti: 'ht',
  'haití': 'ht',
  escocia: 'gb-sct',

  // Grupo D
  'estados unidos': 'us',
  paraguay: 'py',
  australia: 'au',
  turquia: 'tr',
  'turquía': 'tr',

  // Grupo E
  alemania: 'de',
  curazao: 'cw',
  'costa de marfil': 'ci',
  ecuador: 'ec',

  // Grupo F
  'paises bajos': 'nl',
  'países bajos': 'nl',
  japon: 'jp',
  'japón': 'jp',
  suecia: 'se',
  tunez: 'tn',
  'túnez': 'tn',

  // Grupo G
  belgica: 'be',
  'bélgica': 'be',
  egipto: 'eg',
  iran: 'ir',
  'irán': 'ir',
  'nueva zelanda': 'nz',

  // Grupo H
  espana: 'es',
  'españa': 'es',
  'cabo verde': 'cv',
  'arabia saudita': 'sa',
  uruguay: 'uy',

  // Grupo I
  francia: 'fr',
  senegal: 'sn',
  irak: 'iq',
  noruega: 'no',

  // Grupo J
  argentina: 'ar',
  argelia: 'dz',
  austria: 'at',
  jordania: 'jo',

  // Grupo K
  portugal: 'pt',
  'rd de congo': 'cd',
  'republica democratica del congo': 'cd',
  'república democrática del congo': 'cd',
  uzbekistan: 'uz',
  'uzbekistán': 'uz',
  colombia: 'co',

  // Grupo L
  inglaterra: 'gb-eng',
  croacia: 'hr',
  ghana: 'gh',
  panama: 'pa',
  'panamá': 'pa',
};

function normalizeTeamName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export function getFlagCodeForTeamName(teamName: string): string | null {
  const normalized = normalizeTeamName(teamName);
  return FLAG_CODE_BY_TEAM_NAME[normalized] ?? null;
}