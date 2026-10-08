export interface MailDealer {
  name: string;
  address: string;
  phone: string | null;
}

export interface BookingMailService {
  name: string;
  duration?: number;
  price?: number | null;
}

export interface BookingMailData {
  to: string;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  customerAddress?: string;
  bookingId: number;
  bookingDate: Date;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
  vehicle?: string;
  services: BookingMailService[];
  estimatedDuration?: number;
  estimatedPrice?: number | null;
  customerNote?: string | null;
  dealer: MailDealer;
}
