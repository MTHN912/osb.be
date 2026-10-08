export const CUSTOMER_PROFILE_INCLUDE = {
  vehicles: {
    include: { brand: true, model: true },
    orderBy: { createdAt: 'desc' as const },
  },
  bookings: {
    include: {
      dealer: { select: { id: true, name: true, code: true, address: true, phone: true } },
      vehicle: { include: { brand: true, model: true } },
      bookingServices: { include: { service: true } },
    },
    orderBy: { bookingDate: 'desc' as const },
  },
};
