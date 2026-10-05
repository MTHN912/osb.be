import { TECHNICIAN_PUBLIC_SELECT } from '../../../core/user/constants/user.constant';
import { VEHICLE_DEFAULT_INCLUDE } from '../../vehicle/constants/vehicle.constant';

export const SERVICE_QUOTE_SELECT = {
  id: true,
  code: true,
  name: true,
  price: true,
  duration: true,
  sizeSensitive: true,
};

export const BOOKING_CUSTOMER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  companyName: true,
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
  technician: { select: TECHNICIAN_PUBLIC_SELECT },
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

export const BLOCKING_BOOKING_SELECT = {
  technicianId: true,
  bookingDate: true,
  estimatedDuration: true,
};
