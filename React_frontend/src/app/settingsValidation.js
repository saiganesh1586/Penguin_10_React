// Match the existing settings handlers; the API remains responsible for account validation.
export function validateProfile({ name, email }) {
  return !name.trim() || !email.trim().includes('@') ? 'Enter a name and valid email.' : '';
}

export function validatePassword({ current, next, confirm }) {
  if (!current.trim() || next.trim().length < 6)
    return 'Enter your current password and a new password of at least 6 characters.';
  return next.trim() !== confirm.trim() ? 'Passwords do not match.' : '';
}
