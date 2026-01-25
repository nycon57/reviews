"use client";

import { Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessHours } from "@/lib/seo/actions";

interface BusinessHoursCardProps {
  hours: BusinessHours | null;
  className?: string;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

function formatTime(time: string): string {
  // Handle various time formats
  try {
    // If it's already in 12-hour format, return as-is
    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }

    // Parse 24-hour format (e.g., "09:00", "17:00")
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch {
    return time;
  }
}

function getCurrentDay(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

export function BusinessHoursCard({
  hours,
  className,
}: BusinessHoursCardProps) {
  if (!hours) {
    return null;
  }

  const currentDay = getCurrentDay();

  // Check if there are any hours defined
  const hasHours = DAYS.some(
    (day) => hours[day.key as keyof BusinessHours]?.open
  );

  if (!hasHours) {
    return null;
  }

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Business Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {DAYS.map((day) => {
            const dayHours = hours[day.key as keyof BusinessHours];
            const isToday = day.key === currentDay;

            return (
              <li
                key={day.key}
                className={cn(
                  "flex justify-between text-sm",
                  isToday && "font-semibold"
                )}
              >
                <span
                  className={cn(
                    "text-repwell-teal-400",
                    isToday && "text-repwell-teal-500"
                  )}
                >
                  {day.label}
                  {isToday && (
                    <span className="ml-1 text-xs text-repwell-sage-200">(Today)</span>
                  )}
                </span>
                <span className="text-repwell-teal-300">
                  {dayHours?.open && dayHours?.close
                    ? `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`
                    : "Closed"}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
