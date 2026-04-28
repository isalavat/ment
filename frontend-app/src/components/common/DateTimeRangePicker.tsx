import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./DateTimeRangePicker.css";

export interface DateTimePickerCalendarCell {
  iso: string;
  date: Date;
  inMonth: boolean;
  disabled?: boolean;
  bookable?: boolean;
}

interface DateTimeRangePickerProps {
  startLabel: string;
  endLabel: string;
  timeLabel: string;
  startValue: string;
  endValue: string;
  activePicker: "start" | "end" | null;
  pickerMonth: Date;
  calendarCells: DateTimePickerCalendarCell[];
  selectedDate: string;
  timeOptions: string[];
  selectedTime: string;
  emptyTimeLabel: string;
  weekdays?: string[];
  onOpenPicker: (target: "start" | "end") => void;
  onClosePicker: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateIso: string) => void;
  onSelectTime: (time: string) => void;
}

export const DateTimeRangePicker: React.FC<DateTimeRangePickerProps> = ({
  startLabel,
  endLabel,
  timeLabel,
  startValue,
  endValue,
  activePicker,
  pickerMonth,
  calendarCells,
  selectedDate,
  timeOptions,
  selectedTime,
  emptyTimeLabel,
  weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  onOpenPicker,
  onClosePicker,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onSelectTime,
}) => {
  return (
    <>
      <div className="dt-range-strip">
        <button
          type="button"
          className={`dt-range-panel ${activePicker === "start" ? "active" : ""}`}
          onClick={() => onOpenPicker("start")}
        >
          <span>{startLabel}</span>
          <strong>{startValue}</strong>
        </button>
        <button
          type="button"
          className={`dt-range-panel ${activePicker === "end" ? "active" : ""}`}
          onClick={() => onOpenPicker("end")}
        >
          <span>{endLabel}</span>
          <strong>{endValue}</strong>
        </button>
      </div>

      {activePicker && (
        <div className="dt-picker-shell">
          <div className="dt-picker-header">
            <button
              className="modal-close"
              type="button"
              onClick={onClosePicker}
            >
              <X size={18} />
            </button>
          </div>

          <div className="dt-picker-toolbar">
            <button
              type="button"
              className="dt-picker-arrow"
              onClick={onPrevMonth}
            >
              <ChevronLeft size={16} />
            </button>
            <strong>
              {pickerMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              className="dt-picker-arrow"
              onClick={onNextMonth}
            >
              <ChevronRight size={16} />
            </button>
            <div className="dt-picker-time-inline">
              <span className="dt-picker-toolbar-label">{timeLabel}</span>
              <span className="dt-picker-toolbar-time-box">{selectedTime}</span>
            </div>
          </div>

          <div className="dt-picker-grid">
            <div className="dt-calendar-panel">
              <div className="dt-calendar-weekdays">
                {weekdays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="dt-calendar-days">
                {calendarCells.map((cell) => (
                  <button
                    key={cell.iso}
                    type="button"
                    className={`dt-calendar-day ${cell.inMonth ? "" : "muted"} ${
                      cell.disabled ? "disabled" : ""
                    } ${cell.bookable ? "bookable" : ""} ${
                      selectedDate === cell.iso ? "selected" : ""
                    }`}
                    onClick={() => !cell.disabled && onSelectDate(cell.iso)}
                    disabled={Boolean(cell.disabled)}
                  >
                    {cell.date.getDate()}
                  </button>
                ))}
              </div>
            </div>

            <div className="dt-time-panel">
              <div className="dt-time-list">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`dt-time-item ${selectedTime === time ? "selected" : ""}`}
                    onClick={() => onSelectTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {timeOptions.length === 0 && (
                <span className="dt-time-empty">{emptyTimeLabel}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
