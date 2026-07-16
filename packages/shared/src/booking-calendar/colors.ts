import { CalendarModel } from "./enums";
import type { BookingModel } from "./enums";

export interface CalendarModelColor {
  bg: string;
  text: string;
  border: string;
  light: string;
}

export const CALENDAR_MODEL_COLORS: Record<string, CalendarModelColor> = {
  [CalendarModel.HOURLY]: { bg: "#F59E0B", text: "#92400E", border: "#FCD34D", light: "#FEF3C7" },
  [CalendarModel.DAILY]: { bg: "#3B82F6", text: "#1E40AF", border: "#93C5FD", light: "#DBEAFE" },
  [CalendarModel.OVERNIGHT]: { bg: "#8B5CF6", text: "#5B21B6", border: "#C4B5FD", light: "#EDE9FE" },
  [CalendarModel.WEEKLY_CHARTER]: { bg: "#10B981", text: "#065F46", border: "#6EE7B7", light: "#D1FAE5" },
};

export const CALENDAR_MODEL_LABELS: Record<string, string> = {
  [CalendarModel.HOURLY]: "Saatlik",
  [CalendarModel.DAILY]: "Günlük",
  [CalendarModel.OVERNIGHT]: "Konaklamalı",
  [CalendarModel.WEEKLY_CHARTER]: "Haftalık",
};

const FALLBACK_COLOR: CalendarModelColor = {
  bg: "#0097A7",
  text: "#006064",
  border: "#80DEEA",
  light: "#E0F7FA",
};

export function calendarModelColor(model: string): CalendarModelColor {
  return CALENDAR_MODEL_COLORS[model] ?? FALLBACK_COLOR;
}

export function calendarModelLabel(model: string): string {
  return CALENDAR_MODEL_LABELS[model] ?? model;
}

export const BOOKING_MODEL_COLORS: Record<BookingModel, string> = {
  HOURLY: "#F59E0B",
  DAILY: "#3B82F6",
  STAY_INCLUDED: "#8B5CF6",
  WEEKLY: "#10B981",
};
