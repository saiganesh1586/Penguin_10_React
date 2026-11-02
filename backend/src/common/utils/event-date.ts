import { BadRequestException } from '@nestjs/common';

export const EVENT_LEAD_TIME_DAYS = 7;

// Event dates are calendar dates in India, regardless of the server's timezone.
export function minimumEventDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value);
  const minimum = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  minimum.setUTCDate(minimum.getUTCDate() + EVENT_LEAD_TIME_DAYS);
  return minimum.toISOString().slice(0, 10);
}

export function assertEventLeadTime(date: string, now = new Date()): void {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new BadRequestException('Enter a valid event date');
  }
  const minimum = minimumEventDate(now);
  if (date < minimum) {
    throw new BadRequestException(
      `Event date must be at least 7 days from today (${minimum} or later).`
    );
  }
}
