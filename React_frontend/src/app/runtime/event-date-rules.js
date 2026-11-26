// Shared by creation forms and their API-backed handlers. Calendar dates use India time.
(() => {
  function minimumEventDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const value = type => Number(parts.find(part => part.type === type).value);
    const minimum = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
    minimum.setUTCDate(minimum.getUTCDate() + 7);
    return minimum.toISOString().slice(0, 10);
  }

  function validateEventLeadTime(date, now = new Date()) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    )
      return 'Enter a valid event date';
    const minimum = minimumEventDate(now);
    return date < minimum
      ? `Event date must be at least 7 days from today (${minimum} or later).`
      : '';
  }

  globalThis.EventFlowEventDates = { minimumEventDate, validateEventLeadTime };
})();
