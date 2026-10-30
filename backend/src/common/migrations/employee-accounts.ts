// Compatibility for saved data created before department accounts had their own role.
// Legacy field names are isolated here and never exposed by the active application.
const departmentTypes = new Set(['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS', 'SUPPORT_FINANCE', 'FINANCE_EXECUTIVE']);

export function upgradeEmployeeAccounts(input: Record<string, any>): Record<string, any> {
  const normalize = (value: unknown) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const removedIds = new Set<string>();
  const users = (input.users || []).flatMap((user: any) => {
    const role = normalize(user.userRole || user.role);
    if (!['staff', 'event_staff', 'employee'].includes(role)) return [user];
    const type = String(user.employeeType || '').toUpperCase().replace(/[\s-]+/g, '_');
    if (!departmentTypes.has(type)) { removedIds.add(user.userId || user.id); return []; }
    return [{ ...user, userRole: 'employee', ...(user.role ? { role: 'employee' } : {}), employeeType: type }];
  });
  const output: Record<string, any> = { ...input, users };
  for (const key of Object.keys(output)) {
    if (/staff/i.test(key)) { delete output[key]; continue; }
    if (!Array.isArray(output[key])) continue;
    output[key] = output[key].filter((row: any) => !removedIds.has(row.userId) && !removedIds.has(row.submittedBy));
    output[key] = output[key].map((row: any) => {
      const clean = { ...row };
      for (const field of Object.keys(clean)) if (/staff/i.test(field)) delete clean[field];
      if (['staff', 'event_staff'].includes(normalize(clean.role))) clean.role = 'employee';
      return clean;
    });
  }
  if (output.notifications) output.notifications = output.notifications.filter((item: any) => !/staff|assignment/i.test(item.type || ''));
  return output;
}
