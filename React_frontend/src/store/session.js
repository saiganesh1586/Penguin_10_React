import { SESSION_KEY } from '../app/config.js';

const normalizeRoleKey = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
const supportTypes = new Set([
  'support_executive',
  'registration_verification',
  'event_operations',
]);
const financeTypes = new Set(['finance_executive', 'support_finance']);

export function normalizeSession(user) {
  if (!user?.token) return null;
  const { password, ...account } = user;
  const role = normalizeRoleKey(user.role || user.userRole);
  const employeeType = normalizeRoleKey(user.employeeType);
  const employee = ['staff', 'event_staff', 'employee'].includes(role);
  if (employee && !supportTypes.has(employeeType) && !financeTypes.has(employeeType)) return null;
  const id = user.userId || user.id;
  return {
    ...account,
    id,
    userId: id,
    role: employee
      ? 'employee'
      : { super_admin: 'superuser', event_organizer: 'organizer' }[role] || role,
    ...(user.avatarImage
      ? { avatarImage: user.avatarImage.replace('/avatars/staff-', '/avatars/employee-') }
      : {}),
    avatar: user.avatar || (user.name || 'U').trim().split(/\s+/)
      .map(word => word[0]).join('').toUpperCase().slice(0, 2),
  };
}

export function readPersistedSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const user = normalizeSession(JSON.parse(raw || 'null'));
    if (raw && !user) persistSession(null);
    return user;
  } catch {
    persistSession(null);
    return null;
  }
}

export function persistSession(user) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // The in-memory session is still usable if browser storage is disabled.
  }
}

export function workspaceFor(user) {
  const role = normalizeRoleKey(user?.role || user?.userRole);
  const employeeType = normalizeRoleKey(user?.employeeType);
  if (['superuser', 'super_admin', 'superadmin', 'admin'].includes(role)) return '/admin';
  if (financeTypes.has(employeeType)) return '/employee2';
  if (supportTypes.has(employeeType)) return '/employee1';
  return (
    {
      client: '/client',
      organizer: '/organizer',
      event_organizer: '/organizer',
      attendee: '/attendee',
    }[role] || '/landing'
  );
}
