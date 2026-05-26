import React from "react";
import "./WeekTimelineGrid.css";

export type TimelineStatus = "AVAILABLE" | "BOOKED" | "UNAVAILABLE";

export interface TimelineSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: TimelineStatus;
}

interface WeekTimelineGridProps {
  weekDates: Date[];
  slots: TimelineSlot[];
  selectedSlotId?: string;
  onSlotClick?: (slot: TimelineSlot) => void;
  interactiveStatuses?: TimelineStatus[];
  hourStart?: number;
  hourEnd?: number;
  hourHeight?: number;
  onCellClick?: (day: Date, hour: number) => void;
  mergeAdjacentSlots?: boolean;
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const minutesFromMidnight = (dateIso: string) => {
  const date = new Date(dateIso);
  return date.getHours() * 60 + date.getMinutes();
};

export const WeekTimelineGrid: React.FC<WeekTimelineGridProps> = ({
  weekDates,
  slots,
  selectedSlotId,
  onSlotClick,
  interactiveStatuses = ["AVAILABLE"],
  hourStart = 0,
  hourEnd = 24,
  hourHeight = 28,
  onCellClick,
  mergeAdjacentSlots = false,
}) => {
  const dayCount = Math.max(weekDates.length, 1);
  const hours = Array.from(
    { length: hourEnd - hourStart + 1 },
    (_, i) => i + hourStart,
  );
  const timelineHeight = (hourEnd - hourStart) * hourHeight;

  const slotsByDay = weekDates.map((day) => {
    const key = dayKey(day);
    return {
      day,
      slots: slots.filter((slot) => dayKey(new Date(slot.startTime)) === key),
    };
  });

  const mergeSlotsForDisplay = (daySlots: TimelineSlot[]) => {
    if (!mergeAdjacentSlots) {
      return daySlots;
    }

    const sorted = [...daySlots].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const merged: TimelineSlot[] = [];

    sorted.forEach((slot) => {
      const last = merged[merged.length - 1];
      if (!last) {
        merged.push(slot);
        return;
      }

      const lastEnd = new Date(last.endTime).getTime();
      const currentStart = new Date(slot.startTime).getTime();
      if (last.status === slot.status && currentStart <= lastEnd) {
        if (new Date(slot.endTime).getTime() > lastEnd) {
          last.endTime = slot.endTime;
        }
        return;
      }

      merged.push(slot);
    });

    return merged;
  };

  return (
    <div className="week-timeline">
      <div
        className="week-timeline-header-row"
        style={{
          gridTemplateColumns: `46px repeat(${dayCount}, minmax(0, 1fr))`,
        }}
      >
        <div className="week-timeline-time-head" />
        {slotsByDay.map(({ day }) => (
          <div key={day.toISOString()} className="week-timeline-day-head">
            <strong>
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </strong>
            <span>
              {day.toLocaleDateString(undefined, {
                month: "numeric",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="week-timeline-body">
        <div
          className="week-timeline-axis"
          style={{ height: `${timelineHeight}px` }}
        >
          {hours
            .filter((h) => h % 2 === 0)
            .map((hour) => (
              <div
                key={hour}
                className="week-timeline-axis-label"
                style={{ top: `${(hour - hourStart) * hourHeight}px` }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
        </div>

        <div
          className="week-timeline-days-wrap"
          style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}
        >
          {slotsByDay.map(({ day, slots: daySlots }) => {
            const displaySlots = mergeSlotsForDisplay(daySlots);
            return (
              <div key={day.toISOString()} className="week-timeline-day-col">
                <div
                  className="week-timeline-grid"
                  style={{ height: `${timelineHeight}px` }}
                >
                  {Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="week-timeline-hour-line"
                      style={{ top: `${i * hourHeight}px` }}
                    />
                  ))}

                  {onCellClick &&
                    Array.from({ length: hourEnd - hourStart }, (_, i) => {
                      const hour = i + hourStart;
                      return (
                        <button
                          key={`cell-${hour}`}
                          type="button"
                          className="week-timeline-cell-hit"
                          style={{
                            top: `${i * hourHeight}px`,
                            height: `${hourHeight}px`,
                          }}
                          onClick={() => onCellClick?.(day, hour)}
                        />
                      );
                    })}

                  {displaySlots.map((slot) => {
                    const startMin = minutesFromMidnight(slot.startTime);
                    const endMin = minutesFromMidnight(slot.endTime);
                    const top = ((startMin - hourStart * 60) / 60) * hourHeight;
                    const height = ((endMin - startMin) / 60) * hourHeight;
                    const isInteractive =
                      Boolean(onSlotClick) &&
                      interactiveStatuses.includes(slot.status);
                    const isSelected = selectedSlotId === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        className={`week-timeline-slot week-timeline-slot-${slot.status.toLowerCase()} ${
                          isSelected ? "selected" : ""
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 10)}px`,
                        }}
                        onClick={() => isInteractive && onSlotClick?.(slot)}
                        disabled={!isInteractive}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
