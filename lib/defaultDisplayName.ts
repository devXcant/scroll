export function generateDefaultDisplayName(): string {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `user_Scroll_${suffix}`;
}

export function greetingName(displayName: string | null | undefined): string {
  const trimmed = displayName?.trim();
  if (!trimmed || trimmed === 'SCROLL user' || trimmed === 'user') return '';
  if (trimmed.startsWith('user_Scroll_')) {
    return trimmed.replace(/^user_Scroll_/, 'User ');
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
