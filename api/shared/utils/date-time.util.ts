import { BadRequestException } from '@nestjs/common';
import { t } from './i18n.util';

const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const US_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function parseTime(time: string): { hours: number; minutes: number } {
  const match = time.trim().match(TIME_PATTERN);
  if (!match) {
    throw new BadRequestException(t('INVALID_TIME', { time }));
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

export function parseDate(date: string): { year: number; month: number; day: number } {
  const value = date.trim();
  const iso = value.match(ISO_DATE_PATTERN);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  }

  const us = value.match(US_DATE_PATTERN);
  if (us) {
    return { year: Number(us[3]), month: Number(us[1]), day: Number(us[2]) };
  }

  throw new BadRequestException(t('INVALID_DATE', { date }));
}

export function parseDateTime(date: string, time: string): Date {
  const { year, month, day } = parseDate(date);
  const { hours, minutes } = parseTime(time);
  return new Date(year, month - 1, day, hours, minutes);
}

export function startOfDay(date: string): Date {
  const { year, month, day } = parseDate(date);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function endOfDay(date: string): Date {
  const { year, month, day } = parseDate(date);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMinutes(time: string): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}
