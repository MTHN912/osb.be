const SECRET_FIELDS = ['password', 'currentRefreshToken', 'currentResetToken'];

export function stripSecrets<T extends Record<string, any> | null | undefined>(entity: T): T {
  if (!entity || typeof entity !== 'object') return entity;
  const result: Record<string, any> = { ...entity };
  for (const field of SECRET_FIELDS) {
    delete result[field];
  }
  return result as T;
}

export function sanitizeBooking<T extends Record<string, any> | null | undefined>(booking: T): T {
  if (!booking || typeof booking !== 'object') return booking;
  const result: Record<string, any> = { ...booking };
  if (result.customer) result.customer = stripSecrets(result.customer);
  return result as T;
}

export function sanitizeCustomer<T extends Record<string, any> | null | undefined>(customer: T): T {
  if (!customer || typeof customer !== 'object') return customer;
  const result: Record<string, any> = stripSecrets(customer) as Record<string, any>;
  if (Array.isArray(result.bookings)) {
    result.bookings = result.bookings.map((b: Record<string, any>) => sanitizeBooking(b));
  }
  return result as T;
}

export function normalizeIdentifier(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
