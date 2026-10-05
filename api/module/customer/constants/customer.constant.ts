export const CUSTOMER_LIST_INCLUDE = {
  vehicles: { include: { brand: true, model: true } },
  _count: { select: { bookings: true } },
};
