export function creationTime(record) {
  const source = record.rawEvent || record.event || record.rawRequest || record.request || {};
  for (const value of [
    record.createdAt,
    record.registrationDate,
    record.created,
    source.createdAt,
    source.created,
  ]) {
    if (value == null || value === '') continue;
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return time;
  }
  return 0;
}

// API responses already resolve equal creation times by insertion order.
export function compareNewestFirst(left, right) {
  return creationTime(right) - creationTime(left);
}

export function newestRecords(records) {
  return [...records].sort(compareNewestFirst);
}
