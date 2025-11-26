export function generateCalendarFile(
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string,
  volunteerEmail: string,
  volunteerName: string
): string {
  // Parse time slot like "10:00 AM – 12:00 PM"
  const [startTime, endTime] = timeSlot.split("–").map(t => t.trim());
  
  const parseTime = (time: string, date: string): string => {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    // Parse the date as local date to avoid timezone shifts
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Format as YYYYMMDDTHHMMSS
    return dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const dtstart = parseTime(startTime, eventDate);
  const dtend = parseTime(endTime, eventDate);
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `volunteer-${Date.now()}@thedrawer.org`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//The Drawer//Volunteer Signup//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
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
