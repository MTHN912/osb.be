import { BookingStatus, VehicleSizeClass } from '@prisma/client';
import { SIZE_MULTIPLIERS } from '../../../shared/constants/vehicle.constant';
import { DEFAULT_BOOKING_DURATION_MINUTES } from '../../../shared/constants/booking.constant';

export type BookingMode = 'customer' | 'guest' | 'admin';

export interface QuotableService {
  id: number;
  price: number | null;
  duration: number;
  sizeSensitive: boolean;
}

export interface BookingQuote {
  items: { serviceId: number; price: number | null; duration: number }[];
  estimatedPrice: number | null;
  estimatedDuration: number;
}

export interface BlockingRange {
  technicianId: number;
  start: number;
  end: number;
}

const MINUTE_MS = 60 * 1000;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function quoteServices(services: QuotableService[], sizeClass?: VehicleSizeClass | null): BookingQuote {
  const items = services.map((service) => {
    const multiplier = service.sizeSensitive && sizeClass ? SIZE_MULTIPLIERS[sizeClass] : 1;
    return {
      serviceId: service.id,
      price: service.price === null ? null : roundMoney(service.price * multiplier),
      duration: Math.round(service.duration * multiplier),
    };
  });

  const prices = items.map((item) => item.price).filter((price): price is number => price !== null);

  return {
    items,
    estimatedPrice: prices.length > 0 ? roundMoney(prices.reduce((sum, price) => sum + price, 0)) : null,
    estimatedDuration: items.reduce((sum, item) => sum + item.duration, 0),
  };
}

export function toRange(start: Date, durationMinutes: number): { start: number; end: number } {
  const begin = start.getTime();
  return { start: begin, end: begin + (durationMinutes || DEFAULT_BOOKING_DURATION_MINUTES) * MINUTE_MS };
}

export function toBlockingRanges(bookings: { technicianId: number; bookingDate: Date; estimatedDuration: number }[]): BlockingRange[] {
  return bookings.map((booking) => ({
    technicianId: booking.technicianId,
    ...toRange(new Date(booking.bookingDate), booking.estimatedDuration),
  }));
}

export function isTechnicianFree(technicianId: number, ranges: BlockingRange[], range: { start: number; end: number }): boolean {
  return !ranges.some((r) => r.technicianId === technicianId && range.start < r.end && range.end > r.start);
}

export function isLocked(status: BookingStatus, locked: BookingStatus[]): boolean {
  return locked.includes(status);
}

type BookingServiceRecord = {
  price: number | null;
  duration: number;
  service: {
    id: number;
    code: string;
    name: string;
    kind: string;
    packageServices?: { package: { id: number; code: string; name: string } }[];
  };
};

export function groupPackages(bookingServices: BookingServiceRecord[]) {
  const groups = new Map<number | null, { packageId: number | null; packageCode: string | null; packageName: string | null; services: object[] }>();

  for (const item of bookingServices) {
    const pkg = item.service.packageServices?.[0]?.package ?? null;
    const key = pkg?.id ?? null;
    if (!groups.has(key)) {
      groups.set(key, { packageId: key, packageCode: pkg?.code ?? null, packageName: pkg?.name ?? null, services: [] });
    }
    groups.get(key)!.services.push({
      id: item.service.id,
      code: item.service.code,
      name: item.service.name,
      kind: item.service.kind,
      price: item.price,
      duration: item.duration,
    });
  }

  return [...groups.values()];
}

export function formatBooking<T extends Record<string, any>>(booking: T) {
  const { bookingServices, ...rest } = booking;
  return { ...rest, packages: groupPackages(bookingServices ?? []) };
}

export function vehicleLabel(vehicle?: { plate: string; variant?: string | null; brand?: { name: string } | null; model?: { name: string } | null } | null): string {
  if (!vehicle) return '';
  const name = [vehicle.brand?.name, vehicle.model?.name, vehicle.variant].filter(Boolean).join(' ');
  return name ? `${name} (${vehicle.plate})` : vehicle.plate;
}
