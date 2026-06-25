/** Strip dashes Coach should not use in user facing copy. */
export function sanitizeCoachText(text: string): string {
  return text
    .replace(/\u2014/g, '. ')
    .replace(/\u2013/g, ', ')
    .replace(/\s-\s/g, ', ')
    .replace(/\s+-\s+/g, ', ')
    .replace(/\.\s+\./g, '.')
    .replace(/,\s+,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
