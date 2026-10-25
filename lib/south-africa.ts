export const locale = 'en-ZA';
export const timeZone = 'Africa/Johannesburg';

const wholeRand = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const randAndCents = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export function money(value: number) {
  return (Number.isInteger(value) ? wholeRand : randAndCents).format(value).replace(/R\s/, 'R');
}
export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}
export function southAfricanDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function addDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function dateLabel(
  day: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(
    new Date(`${day}T12:00:00Z`),
  );
}

// Accept both local decimal commas and decimal points, including spaced rand
// amounts. Keep the older grouped currency input forms readable too.
export function learnerNumber(value: string): number | null {
  let text = value.trim().replace(/^([+-]?)\s*(?:ZAR|R|[$£€])\s*(?=[+-]?\d)/i, '$1');
  text = text.replace(/[\u00a0\u202f]/g, ' ');
  if (/\s/.test(text)) {
    if (!/^[+-]?\d{1,3}(?: \d{3})+(?:[.,]\d+)?$/.test(text)) return null;
    text = text.replace(/ /g, '');
  }
  if (text.includes(',') && text.includes('.')) {
    if (/^[+-]?\d{1,3}(?:,\d{3})+\.\d+$/.test(text)) text = text.replace(/,/g, '');
    else if (/^[+-]?\d{1,3}(?:\.\d{3})+,\d+$/.test(text))
      text = text.replace(/\./g, '').replace(',', '.');
    else return null;
  } else if (text.includes(',')) {
    if (/^[+-]?\d+,\d{1,2}$/.test(text)) text = text.replace(',', '.');
    else if (/^[+-]?\d{1,3}(?:,\d{3})+$/.test(text)) text = text.replace(/,/g, '');
    else return null;
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

const accounts: Record<string, string> = {
  'accounts receivable': 'trade receivables',
  'account receivable': 'trade receivables',
  'trade receivable': 'trade receivables',
  debtors: 'trade receivables',
  'trade debtors': 'trade receivables',
  'debtors control': 'trade receivables',
  'debtors control account': 'trade receivables',
  'accounts payable': 'trade payables',
  'account payable': 'trade payables',
  'trade payable': 'trade payables',
  creditors: 'trade payables',
  'trade creditors': 'trade payables',
  'creditors control': 'trade payables',
  'creditors control account': 'trade payables',
  'cost of goods sold': 'cost of sales',
};
export function accountName(value: string) {
  return accounts[value] || value;
}

export const learningContext =
  'South African examples · Amounts in rand (R). VAT is left out of practice calculations unless stated.';
