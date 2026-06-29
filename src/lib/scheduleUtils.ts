import type { WeeklySchedule } from "@/types";

const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export function generateScheduleDates(schedule: WeeklySchedule, count: number): number[] {
  const dates: number[] = [];
  
  // Create a deep copy and parse times for easier processing
  const scheduleRules = DAYS_OF_WEEK.map(day => {
    return (schedule[day] || []).map(timeStr => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return { hours, minutes };
    }).sort((a, b) => (a.hours * 60 + a.minutes) - (b.hours * 60 + b.minutes));
  });

  const now = new Date();
  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start at midnight today
  
  while (dates.length < count) {
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday
    const todayRules = scheduleRules[dayOfWeek];

    for (const rule of todayRules) {
      const candidateDate = new Date(currentDate);
      candidateDate.setHours(rule.hours, rule.minutes, 0, 0);

      // Only add if the candidate time is in the future
      if (candidateDate.getTime() > now.getTime()) {
        dates.push(candidateDate.getTime());
        if (dates.length >= count) break;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function generateTitleFromFilename(filename: string): string {
  // Remove extension
  let title = filename.replace(/\.[^/.]+$/, "");
  // Replace underscores and hyphens with spaces
  title = title.replace(/[_-]/g, " ");
  // Capitalize first letters
  title = title.replace(/\b\w/g, c => c.toUpperCase());
  return title;
}
