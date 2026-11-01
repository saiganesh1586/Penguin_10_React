import { SESSION_KEY } from './config.js';

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

export function readSession() {
  try {
    const user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!user) return null;
    const role = normalizeRoleKey(user.role || user.userRole);
    const employeeType = normalizeRoleKey(user.employeeType);
    if (['staff', 'event_staff', 'employee'].includes(role)) {
      if (!supportTypes.has(employeeType) && !financeTypes.has(employeeType)) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return { ...user, role: 'employee', ...(user.userRole ? { userRole: 'employee' } : {}) };
    }
    return user;
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
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
