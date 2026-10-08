import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { CrudService, CrudOperations } from '../../core/crud/crud.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BaseSearchDto } from '../../core/crud/dto/base-search.dto';
import { MailService } from '../../core/mail/mail.service';
import { AuthCustomerService } from '../../core/auth-customer/auth-customer.service';
import { VehicleService, ResolvedVehicle } from '../vehicle/vehicle.service';
import { AuthUser } from '../../shared/decorators/current-user.decorator';
import { t } from '../../shared/utils/i18n.util';
import { requireDealerId } from '../../shared/utils/tenant.util';
import { parseDateTime } from '../../shared/utils/date-time.util';
import { normalizeIdentifier, normalizePlate, sanitizeBooking } from '../../shared/utils/sanitize.util';
import {
  LOCKED_BOOKING_STATUSES,
  LOOKUP_MIN_IDENTIFIER_LENGTH,
  UPDATABLE_BOOKING_STATUSES,
} from '../../shared/constants/booking.constant';
import {
  AdminBookingDto,
  AppointmentDto,
  BaseBookingDto,
  CustomerVehicleBookingSearchDto,
  GuestBookingDto,
  LookupBookingDto,
  PackageDto,
  RescheduleLookupDto,
  UpdateServiceDto,
} from './dto/booking.dto';
import { BOOKING_DETAIL_INCLUDE, SERVICE_QUOTE_SELECT } from './constants/booking.constant';
import { BookingMode, QuotableService, formatBooking, isLocked, quoteServices, vehicleLabel } from './helpers/booking.helper';

const ADMIN_LOCKED_STATUSES: BookingStatus[] = [BookingStatus.Completed];

@Injectable()
export class BookingService extends CrudService {
  protected readonly modelName = 'Booking';
  private readonly logger = new Logger(BookingService.name);

  constructor(
    prisma: PrismaService,
    private readonly vehicleService: VehicleService,
    private readonly mailService: MailService,
    private readonly authCustomerService: AuthCustomerService,
  ) {
    super(prisma);
  }

  async processBooking(dto: BaseBookingDto, dealerId: number | undefined, mode: BookingMode, user?: AuthUser) {
    const tenantId = requireDealerId(dealerId);
    const services = await this.validatePackages(dto.packages);

    const bookingDate = parseDateTime(dto.bookingDate, dto.bookingTime);
    const vehicle = await this.vehicleService.resolve(dto.vehicle);
    const quote = quoteServices(services, vehicle.sizeClass);

    const { booking, newCustomerId } = await this.transaction(async (tx) => {
      const customer = await this.resolveCustomer(tx, dto, tenantId, mode, user);
      const vehicleId = await this.upsertVehicle(tx, customer.id, vehicle);

      const created = await tx.create({
        data: {
          customerId: customer.id,
          vehicleId,
          bookingDate,
          isGuest: mode === 'guest',
          isAdmin: mode === 'admin',
          needMobility: dto.needMobility ?? false,
          estimatedDuration: quote.estimatedDuration,
          estimatedPrice: quote.estimatedPrice,
          serviceNote: dto.serviceNote,
          customerNote: dto.customerNote,
        },
        dealerId: tenantId,
      });

      await tx.createMany({
        model: 'BookingService',
        data: quote.items.map((item) => ({ bookingId: created.id, ...item })),
      });

      return { booking: created, newCustomerId: customer.isNew ? customer.id : null };
    });

    const detail = await this.getDetail(booking.id);
    void this.sendNotifications(detail, newCustomerId);
    return detail;
  }

  async searchBookings(dto: BaseSearchDto, dealerId?: number) {
    if (dto.include && typeof dto.include === 'object' && 'technician' in dto.include) {
      const { technician: _t, ...restInclude } = dto.include as any;
      dto.include = restInclude;
    }
    const result = await this.findAll({
      where: dto.where,
      include: dto.include ?? BOOKING_DETAIL_INCLUDE,
      orderBy: dto.orderBy ?? { bookingDate: 'desc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
      dealerId,
    });
    const data = dto.include ? result.data.map((b) => sanitizeBooking(b)) : result.data.map((b) => formatBooking(b));
    return { ...result, data };
  }

  async searchCustomerVehicleBookings(customerId: number, dto: CustomerVehicleBookingSearchDto = {}) {
    const where: Record<string, any> = {
      customerId,
      ...(dto?.vehicleId ? { vehicleId: Number(dto.vehicleId) } : {}),
      ...(dto?.status ? { status: dto.status } : {}),
      ...(dto?.where ?? {}),
    };

    const result = await this.findAll({
      where,
      include: dto?.include ?? BOOKING_DETAIL_INCLUDE,
      orderBy: dto?.orderBy ?? { bookingDate: 'desc' },
      search: dto?.search,
      page: dto?.page,
      pageSize: dto?.pageSize,
      take: dto?.take,
      skip: dto?.skip,
    });

    const data = result.data.map((b) => formatBooking(b));
    return { ...result, data };
  }

  async cancelBooking(id: number, dealerId?: number) {
    await this.findMutable(id, dealerId, ADMIN_LOCKED_STATUSES);
    return this.setStatus(id, BookingStatus.Cancelled);
  }

  async updateStatus(id: number, status: BookingStatus, dealerId?: number) {
    if (!UPDATABLE_BOOKING_STATUSES.includes(status)) {
      throw new BadRequestException(t('INVALID_BOOKING_STATUS', { status }));
    }
    await this.findMutable(id, dealerId, ADMIN_LOCKED_STATUSES);
    return this.setStatus(id, status);
  }

  async completeBooking(id: number, dealerId?: number) {
    await this.findMutable(id, dealerId, LOCKED_BOOKING_STATUSES);
    return this.setStatus(id, BookingStatus.Completed);
  }

  async updateServices(id: number, dto: UpdateServiceDto, dealerId?: number) {
    const booking = await this.findOne({
      where: { id },
      include: { vehicle: { include: { model: true } } },
      dealerId,
      throwError: true,
    });
    this.assertNotLocked(booking.status, ADMIN_LOCKED_STATUSES);

    const services = await this.findActiveServices([...new Set(dto.serviceIds)]);
    const quote = quoteServices(services, booking.vehicle?.model?.sizeClass);

    await this.transaction(async (tx) => {
      await tx.deleteMany({ model: 'BookingService', where: { bookingId: id } });
      await tx.createMany({
        model: 'BookingService',
        data: quote.items.map((item) => ({ bookingId: id, ...item })),
      });
      await tx.update({
        where: { id },
        data: { estimatedDuration: quote.estimatedDuration, estimatedPrice: quote.estimatedPrice },
      });
    });

    return this.getDetail(id);
  }

  async updateAppointment(id: number, dto: AppointmentDto, dealerId?: number) {
    await this.findMutable(id, dealerId, ADMIN_LOCKED_STATUSES);
    await this.update({ where: { id }, data: { bookingDate: parseDateTime(dto.bookingDate, dto.bookingTime) } });
    return this.getDetail(id);
  }

  async lookup(dto: LookupBookingDto) {
    return formatBooking(await this.findByLookup(dto));
  }

  async cancelByLookup(dto: LookupBookingDto) {
    const booking = await this.findByLookup(dto);
    this.assertNotLocked(booking.status, LOCKED_BOOKING_STATUSES);
    return this.setStatus(booking.id, BookingStatus.Cancelled);
  }

  async rescheduleByLookup(dto: RescheduleLookupDto) {
    const booking = await this.findByLookup(dto);
    this.assertNotLocked(booking.status, LOCKED_BOOKING_STATUSES);
    await this.update({ where: { id: booking.id }, data: { bookingDate: parseDateTime(dto.bookingDate, dto.bookingTime) } });
    return this.getDetail(booking.id);
  }

  private async getDetail(id: number) {
    const booking = await this.findOne({ where: { id }, include: BOOKING_DETAIL_INCLUDE, throwError: true });
    return formatBooking(booking);
  }

  private async setStatus(id: number, status: BookingStatus) {
    await this.update({ where: { id }, data: { status } });
    return this.getDetail(id);
  }

  private async findMutable(id: number, dealerId: number | undefined, locked: BookingStatus[]) {
    const booking = await this.findOne({ where: { id }, select: { id: true, status: true }, dealerId, throwError: true });
    this.assertNotLocked(booking.status, locked);
    return booking;
  }

  private assertNotLocked(status: BookingStatus, locked: BookingStatus[]) {
    if (isLocked(status, locked)) {
      throw new BadRequestException(t('BOOKING_LOCKED', { status }));
    }
  }

  private async validatePackages(packages: PackageDto[]): Promise<QuotableService[]> {
    const requested = packages.flatMap((pkg) => pkg.services);
    const ids = [...new Set(requested.map((s) => s.serviceId))];
    const services = await this.findActiveServices(ids);
    const byId = new Map(services.map((s) => [s.id, s]));

    for (const item of requested) {
      if (byId.get(item.serviceId)?.code !== item.serviceCode) {
        throw new BadRequestException(t('SERVICE_CODE_MISMATCH', { id: item.serviceId }));
      }
    }
    return services;
  }

  private async findActiveServices(ids: number[]): Promise<(QuotableService & { code: string; name: string })[]> {
    const { data } = await this.findAll({
      model: 'Service',
      where: { id: { in: ids }, isActive: true },
      select: SERVICE_QUOTE_SELECT,
    });
    const found = new Set(data.map((s) => s.id));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(t('SERVICE_NOT_FOUND_OR_INACTIVE', { ids: missing.join(', ') }));
    }
    return data;
  }

  private async resolveCustomer(
    tx: CrudOperations,
    dto: BaseBookingDto,
    dealerId: number,
    mode: BookingMode,
    user?: AuthUser,
  ): Promise<{ id: number; isNew: boolean }> {
    if (mode === 'admin') {
      const email = (dto as AdminBookingDto).customerEmail;
      const customer = await tx.findOne({ model: 'Customer', where: { email }, select: { id: true }, dealerId });
      if (!customer) {
        throw new NotFoundException(t('CUSTOMER_NOT_FOUND', { email }));
      }
      return { id: customer.id, isNew: false };
    }

    if (mode === 'customer') {
      const customer = await tx.findOne({ model: 'Customer', where: { id: user?.id, isActive: true }, select: { id: true }, dealerId });
      if (!customer) {
        throw new NotFoundException(t('CUSTOMER_NOT_FOUND', { email: user?.email ?? '' }));
      }
      return { id: customer.id, isNew: false };
    }

    const guest = dto as GuestBookingDto;
    const existing = await tx.findOne({ model: 'Customer', where: { email: guest.email }, select: { id: true }, dealerId });
    if (existing) return { id: existing.id, isNew: false };

    const created = await tx.create({
      model: 'Customer',
      data: {
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phoneNumber: guest.phoneNumber,
        companyName: guest.companyName,
        addressLine1: guest.addressLine1,
        addressLine2: guest.addressLine2,
        city: guest.city,
        state: guest.state,
        zipCode: guest.zipCode,
        isGuest: true,
      },
      dealerId,
    });
    return { id: created.id, isNew: true };
  }

  private async upsertVehicle(tx: CrudOperations, customerId: number, vehicle: ResolvedVehicle): Promise<number> {
    const existing = await tx.findOne({
      model: 'Vehicle',
      where: { customerId, plate: vehicle.data.plate },
      select: { id: true },
    });
    if (existing) {
      await tx.update({ model: 'Vehicle', where: { id: existing.id }, data: vehicle.data });
      return existing.id;
    }
    const created = await tx.create({ model: 'Vehicle', data: { ...vehicle.data, customerId } });
    return created.id;
  }

  private async findByLookup(dto: LookupBookingDto) {
    const booking = await this.findOne({ where: { id: dto.bookingId }, include: BOOKING_DETAIL_INCLUDE });
    if (!booking || !this.matchesIdentifier(booking, dto.identifier)) {
      throw new NotFoundException(t('BOOKING_NOT_FOUND'));
    }
    return booking;
  }

  private matchesIdentifier(booking: Record<string, any>, identifier: string): boolean {
    const plate = booking.vehicle?.plate;
    if (plate && normalizePlate(identifier) === plate) return true;

    const value = normalizeIdentifier(identifier);
    const phone = normalizeIdentifier(booking.customer?.phoneNumber ?? '');
    if (value.length < LOOKUP_MIN_IDENTIFIER_LENGTH || phone.length < LOOKUP_MIN_IDENTIFIER_LENGTH) return false;
    return phone.includes(value) || value.includes(phone);
  }

  private async sendNotifications(booking: Record<string, any>, newCustomerId: number | null) {
    const tasks: Promise<void>[] = [this.sendConfirmation(booking)];
    if (newCustomerId && booking.customer?.email) {
      tasks.push(this.authCustomerService.sendWelcomeWithSetPassword(booking.customer, booking.dealer));
    }
    await Promise.all(tasks);
  }

  private async sendConfirmation(booking: Record<string, any>) {
    if (!booking.customer?.email) return;
    try {
      const cust = booking.customer || {};
      const fullAddress = [
        cust.addressLine1,
        cust.addressLine2,
        cust.suburb,
        cust.city,
        cust.state,
        cust.zipCode,
      ]
        .filter(Boolean)
        .join(', ') || '-';

      const v = booking.vehicle || {};
      await this.mailService.sendBookingConfirmation({
        to: cust.email,
        customerName: `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Valued Customer',
        customerEmail: cust.email || '-',
        customerMobile: cust.phoneNumber || '-',
        customerAddress: fullAddress,
        bookingId: booking.id,
        bookingDate: booking.bookingDate,
        licensePlate: v.plate || '-',
        make: v.brand?.name || '-',
        model: v.model?.name || '-',
        year: v.year ? String(v.year) : '-',
        vin: v.vin || '-',
        vehicle: vehicleLabel(booking.vehicle),
        services: (booking.packages || []).flatMap((pkg: { services: { name: string; duration?: number; price?: number | null }[] }) =>
          (pkg.services || []).map((s) => ({ name: s.name, duration: s.duration, price: s.price })),
        ),
        estimatedDuration: booking.estimatedDuration,
        estimatedPrice: booking.estimatedPrice,
        customerNote: booking.customerNote,
        dealer: { name: booking.dealer.name, address: booking.dealer.address, phone: booking.dealer.phone },
      });
    } catch (error) {
      this.logger.error(t('BOOKING_MAIL_FAILED', { id: booking.id, error: error instanceof Error ? error.message : String(error) }));
    }
  }
}
