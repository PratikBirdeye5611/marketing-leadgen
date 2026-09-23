const ISO_TO_NAME: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  IE: 'Ireland',
  NL: 'Netherlands',
  LU: 'Luxembourg',
  BE: 'Belgium',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IS: 'Iceland',
  SG: 'Singapore',
  MY: 'Malaysia',
  MX: 'Mexico',
  PR: 'Puerto Rico',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  JP: 'Japan',
  CN: 'China',
  ZA: 'South Africa',
  AE: 'United Arab Emirates',
};

const NAME_TO_ISO: Record<string, string> = Object.entries(ISO_TO_NAME).reduce(
  (acc, [iso, name]) => {
    acc[name.toLowerCase()] = iso;
    return acc;
  },
  {} as Record<string, string>,
);

export function getISOCode(countryName: string): string {
  if (!countryName) return '';
  if (countryName.toUpperCase() === 'UK') return 'GB';
  const found = NAME_TO_ISO[countryName.toLowerCase()];
  return found ? found.toUpperCase() : '';
}

export function getCountryName(isoCode: string): string {
  if (!isoCode) return '';
  const code = isoCode.toUpperCase() === 'UK' ? 'GB' : isoCode.toUpperCase();
  return ISO_TO_NAME[code] ?? '';
}

export function normalizeCountryCode(code: string): string {
  if (!code) return '';
  return code.toUpperCase() === 'UK' ? 'GB' : code.toUpperCase();
}
