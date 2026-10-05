import { BookingStatus } from '@prisma/client';

export const UPDATABLE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.Pending,
  BookingStatus.BookedIn,
  BookingStatus.CheckIn,
  BookingStatus.Cancelled,
];

export const LOCKED_BOOKING_STATUSES: BookingStatus[] = [BookingStatus.Completed, BookingStatus.Cancelled];

export const SLOT_INTERVAL_MINUTES = 30;
export const SLOT_MIN_DURATION_MINUTES = 30;
export const DEFAULT_BOOKING_DURATION_MINUTES = 30;
export const SLOT_MAX_RANGE_DAYS = 62;
export const LOOKUP_MIN_IDENTIFIER_LENGTH = 4;
