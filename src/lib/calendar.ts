// Add-to-calendar helpers: a Google Calendar link for one all-day event, and an .ics file (Apple / Outlook / Android) for one or more.
const ymd = (iso: string) => iso.replace(/-/g, '');
const nextDay = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function googleCalUrl(title: string, iso: string, details: string): string {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${ymd(iso)}/${ymd(nextDay(iso))}`, details });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

/** All-day events with a reminder at 9:00 the day before. */
export function icsFile(title: string, dates: string[], details: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//hasibcalc.com//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const iso of dates) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ymd(iso)}-${Math.abs(hash(title))}@hasibcalc.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(iso)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(iso))}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(details)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:-PT15H', 'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}
