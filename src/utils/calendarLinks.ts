/**
 * Utility functions for generating calendar integration links
 * All times are in America/Chicago (Central Time)
 */

function parseTimeToLocal(dateStr: string, time: string): { year: number; month: number; day: number; hours: number; minutes: number } {
  const [timePart, period] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day, hours, minutes };
}

function formatForGoogle(dateStr: string, time: string): string {
  const { year, month, day, hours, minutes } = parseTimeToLocal(dateStr, time);
  const yy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const mi = String(minutes).padStart(2, '0');
  return `${yy}${mm}${dd}T${hh}${mi}00`;
}

function formatForOutlook(dateStr: string, time: string): string {
  const { year, month, day, hours, minutes } = parseTimeToLocal(dateStr, time);
  const yy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const mi = String(minutes).padStart(2, '0');
  return `${yy}-${mm}-${dd}T${hh}:${mi}:00`;
}

export const generateGoogleCalendarUrl = (
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string
): string => {
  const [startTime, endTime] = timeSlot.split("–").map(t => t.trim());
  const startDate = formatForGoogle(eventDate, startTime);
  const endDate = formatForGoogle(eventDate, endTime);

  const title = encodeURIComponent(`Volunteer at The Drawer - ${location}`);
  const details = encodeURIComponent(
    "Thank you for volunteering with The Drawer! Please arrive 10 minutes early. Contact us at 877-829-5500 or info@thedrawer.org if you have any questions."
  );
  const locationEncoded = encodeURIComponent(locationAddress);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${locationEncoded}&ctz=America/Chicago`;
};

export const generateOutlookCalendarUrl = (
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string
): string => {
  const [startTime, endTime] = timeSlot.split("–").map(t => t.trim());
  const startDate = formatForOutlook(eventDate, startTime);
  const endDate = formatForOutlook(eventDate, endTime);

  const subject = encodeURIComponent(`Volunteer at The Drawer - ${location}`);
  const body = encodeURIComponent(
    "Thank you for volunteering with The Drawer! Please arrive 10 minutes early. Contact us at 877-829-5500 or info@thedrawer.org if you have any questions."
  );
  const locationEncoded = encodeURIComponent(locationAddress);

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${startDate}&enddt=${endDate}&body=${body}&location=${locationEncoded}`;
};
