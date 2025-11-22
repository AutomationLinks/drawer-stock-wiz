/**
 * Utility functions for generating calendar integration links
 */

/**
 * Formats a date and time for Google Calendar URLs (ISO 8601 format without separators)
 * Example: "2026-01-15T10:00:00Z" becomes "20260115T100000Z"
 */
const formatDateForGoogle = (dateStr: string, timeStr: string): string => {
  const [startTime] = timeStr.split("–").map(t => t.trim());
  const [timePart, period] = startTime.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  
  // Format as YYYYMMDDTHHmmssZ
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

/**
 * Formats a date and time for Outlook Calendar URLs (ISO 8601 format)
 * Example: "2026-01-15T10:00:00Z"
 */
const formatDateForOutlook = (dateStr: string, timeStr: string): string => {
  const [startTime] = timeStr.split("–").map(t => t.trim());
  const [timePart, period] = startTime.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  
  return date.toISOString();
};

/**
 * Calculates end time based on start time and time slot
 */
const getEndTime = (dateStr: string, timeStr: string): { google: string; outlook: string } => {
  const [, endTime] = timeStr.split("–").map(t => t.trim());
  const [timePart, period] = endTime.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  
  return {
    google: date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
    outlook: date.toISOString()
  };
};

/**
 * Generates a Google Calendar URL for adding an event
 */
export const generateGoogleCalendarUrl = (
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string
): string => {
  const startDate = formatDateForGoogle(eventDate, timeSlot);
  const endDate = getEndTime(eventDate, timeSlot).google;
  
  const title = encodeURIComponent(`Volunteer at The Drawer - ${location}`);
  const details = encodeURIComponent(
    "Thank you for volunteering with The Drawer! Please arrive 10 minutes early. Contact us at 877-829-5500 or info@thedrawer.org if you have any questions."
  );
  const locationEncoded = encodeURIComponent(locationAddress);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${locationEncoded}`;
};

/**
 * Generates an Outlook Calendar URL for adding an event
 */
export const generateOutlookCalendarUrl = (
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string
): string => {
  const startDate = formatDateForOutlook(eventDate, timeSlot);
  const endDate = getEndTime(eventDate, timeSlot).outlook;
  
  const subject = encodeURIComponent(`Volunteer at The Drawer - ${location}`);
  const body = encodeURIComponent(
    "Thank you for volunteering with The Drawer! Please arrive 10 minutes early. Contact us at 877-829-5500 or info@thedrawer.org if you have any questions."
  );
  const locationEncoded = encodeURIComponent(locationAddress);
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${startDate}&enddt=${endDate}&body=${body}&location=${locationEncoded}`;
};
