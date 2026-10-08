import { VEHICLE_DEFAULT_INCLUDE } from '../../vehicle/constants/vehicle.constant';

export const SERVICE_QUOTE_SELECT = {
  id: true,
  code: true,
  name: true,
  sizeSensitive: true,
};

export const BOOKING_CUSTOMER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  companyName: true,
  addressLine1: true,
  addressLine2: true,
  suburb: true,
  city: true,
  state: true,
  zipCode: true,
  isGuest: true,
};

export const BOOKING_DEALER_SELECT = {
  id: true,
  name: true,
  code: true,
  address: true,
  phone: true,
};

export const BOOKING_DETAIL_INCLUDE = {
  customer: { select: BOOKING_CUSTOMER_SELECT },
  dealer: { select: BOOKING_DEALER_SELECT },
  vehicle: { include: VEHICLE_DEFAULT_INCLUDE },
  bookingServices: {
    include: {
      service: {
        select: {
          id: true,
          code: true,
          name: true,
          kind: true,
          packageServices: { select: { package: { select: { id: true, code: true, name: true } } } },
        },
      },
    },
  },
};

