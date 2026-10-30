import { SESSION_KEY } from './config.js';

const normalize = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const supportTypes = new Set(['support_executive', 'registration_verification', 'event_operations']);
const financeTypes = new Set(['finance_executive', 'support_finance']);

export function readSession() {
  try {
    const user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!user) return null;
    const role = normalize(user.role || user.userRole), type = normalize(user.employeeType);
    if (['staff', 'event_staff', 'employee'].includes(role)) {
      if (!supportTypes.has(type) && !financeTypes.has(type)) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return { ...user, role: 'employee', ...(user.userRole ? { userRole: 'employee' } : {}) };
    }
    return user;
  } catch { return null; }
}

export function logout() { sessionStorage.removeItem(SESSION_KEY); }

export function workspaceFor(user) {
  const role = normalize(user?.role || user?.userRole), type = normalize(user?.employeeType);
  if (['superuser', 'super_admin', 'superadmin', 'admin'].includes(role)) return '/admin';
  if (financeTypes.has(type)) return '/employee2';
  if (supportTypes.has(type)) return '/employee1';
  return { client: '/client', organizer: '/organizer', event_organizer: '/organizer', attendee: '/attendee' }[role] || '/landing';
}
