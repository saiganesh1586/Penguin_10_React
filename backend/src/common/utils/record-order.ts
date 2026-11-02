type CreatedRecord = {
  createdAt?: Date | string | number;
  registrationDate?: Date | string;
  created?: Date | string;
};

export function creationTime(record: CreatedRecord): number {
  for (const value of [record.createdAt, record.registrationDate, record.created]) {
    if (value == null || value === '') continue;
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (Number.isFinite(time)) return time;
  }
  return 0;
}

// The store appends new records. For equal timestamps, the later insertion wins.
// Sort a copy so display ordering never changes registration/waitlist processing order.
export function newestRecords<T extends CreatedRecord>(records: readonly T[]): T[] {
  return records
    .map((record, index) => ({ record, index }))
    .sort(
      (left, right) =>
        creationTime(right.record) - creationTime(left.record) || right.index - left.index
    )
    .map(({ record }) => record);
}
