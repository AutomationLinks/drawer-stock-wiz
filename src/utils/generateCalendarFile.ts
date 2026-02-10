const VTIMEZONE_CHICAGO = `BEGIN:VTIMEZONE
TZID:America/Chicago
X-LIC-LOCATION:America/Chicago
BEGIN:DAYLIGHT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
TZNAME:CDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;

function formatLocalDateTime(date: string, time: string): string {
  const [timePart, period] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const [year, month, day] = date.split('-').map(Number);
  const yy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const mi = String(minutes).padStart(2, '0');

  return `${yy}${mm}${dd}T${hh}${mi}00`;
}

export function generateCalendarFile(
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string,
  volunteerEmail: string,
  volunteerName: string
): string {
  const [startTime, endTime] = timeSlot.split("–").map(t => t.trim());

  const dtstart = formatLocalDateTime(eventDate, startTime);
  const dtend = formatLocalDateTime(eventDate, endTime);
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `volunteer-${Date.now()}@thedrawer.org`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//The Drawer//Volunteer Signup//EN
METHOD:REQUEST
${VTIMEZONE_CHICAGO}
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;TZID=America/Chicago:${dtstart}
DTEND;TZID=America/Chicago:${dtend}
SUMMARY:Volunteer at The Drawer - ${location}
LOCATION:${locationAddress}
DESCRIPTION:Thank you for volunteering with The Drawer! Please arrive 10 minutes early. Contact us at 877-829-5500 or info@thedrawer.org if you have any questions.
ORGANIZER;CN=The Drawer:mailto:contact@automationlinks.com
ATTENDEE;CN=${volunteerName};RSVP=TRUE:mailto:${volunteerEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

export function downloadCalendarFile(icsContent: string, filename: string = "volunteer-event.ics") {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
