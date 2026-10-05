export interface MailDealer {
  name: string;
  address: string;
  phone: string | null;
}

export interface BookingMailService {
  name: string;
  duration: number;
  price: number | null;
}

export interface BookingMailData {
  to: string;
  customerName: string;
  bookingId: number;
  bookingDate: Date;
  vehicle: string;
  services: BookingMailService[];
  estimatedDuration: number;
  estimatedPrice: number | null;
  technicianName: string;
  customerNote: string | null;
  dealer: MailDealer;
}
