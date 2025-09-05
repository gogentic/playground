// Email whitelist validation
export function isEmailAllowed(email: string): boolean {
  const whitelist = import.meta.env.VITE_EMAIL_WHITELIST || '';
  
  // Allow all if whitelist is "*" or empty
  if (whitelist === '*' || whitelist === '') {
    return true;
  }
  
  const allowedList = whitelist.split(',').map((item: string) => item.trim());
  
  for (const allowed of allowedList) {
    // Check if it's a domain whitelist (starts with @)
    if (allowed.startsWith('@')) {
      const domain = allowed.substring(1);
      if (email.endsWith('@' + domain)) {
        return true;
      }
    }
    // Check if it's a specific email
    else if (email.toLowerCase() === allowed.toLowerCase()) {
      return true;
    }
  }
  
  return false;
}

export function getWhitelistMessage(): string {
  const whitelist = import.meta.env.VITE_EMAIL_WHITELIST || '';
  
  if (whitelist === '*' || whitelist === '') {
    return '';
  }
  
  return 'Registration is restricted to authorized emails only.';
}