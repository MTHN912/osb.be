import { BadRequestException, Injectable } from '@nestjs/common';
import { VehicleSizeClass } from '@prisma/client';
import { CrudService } from '../../core/crud/crud.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OperatingDayDto } from '../../core/dealer/dto/dealer.dto';
import { t } from '../../shared/utils/i18n.util';
import { requireDealerId } from '../../shared/utils/tenant.util';
import { endOfDay, formatLocalDate, formatMinutes, isoWeekday, startOfDay, toMinutes } from '../../shared/utils/date-time.util';
import { SLOT_INTERVAL_MINUTES, SLOT_MAX_RANGE_DAYS, SLOT_MIN_DURATION_MINUTES } from '../../shared/constants/booking.constant';
import { TimeSlotsPeriodDto } from './dto/booking.dto';
import { SERVICE_QUOTE_SELECT } from './constants/booking.constant';
import { quoteServices } from './helpers/booking.helper';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BookingAppointmentService extends CrudService {
  protected readonly modelName = 'Booking';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getTimeSlotsPeriod(dto: TimeSlotsPeriodDto, dealerId?: number) {
    const tenantId = requireDealerId(dealerId);
    const start = startOfDay(dto.startDate);
    const end = endOfDay(dto.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / DAY_MS);
    if (days < 1 || days > SLOT_MAX_RANGE_DAYS) {
      throw new BadRequestException(t('INVALID_DATE_RANGE', { max: SLOT_MAX_RANGE_DAYS }));
    }

    const [schedule, duration] = await Promise.all([
      this.getSchedule(tenantId),
      this.getServiceDuration(dto.serviceCodes, tenantId, dto.vehicleModelId),
    ]);

    const dates: object[] = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      dates.push(this.buildDay(new Date(day), schedule, duration));
    }

    return { data: { dates } };
  }

  private buildDay(day: Date, schedule: OperatingDayDto[], duration: number) {
    const date = formatLocalDate(day);
    const hours = schedule.find((d) => d.dayOfWeek === isoWeekday(day));
    if (!hours || hours.isClose) {
      return { date, disabled: true, timeSlots: [] };
    }

    const open = toMinutes(hours.startTime);
    const close = toMinutes(hours.endTime);
    const timeSlots: { time: string; isAvailable: boolean }[] = [];

    for (let minute = open; minute + SLOT_MIN_DURATION_MINUTES <= close; minute += SLOT_INTERVAL_MINUTES) {
      if (duration > 0 && minute + duration > close) continue;

      timeSlots.push({ time: formatMinutes(minute), isAvailable: true });
    }

    return { date, disabled: false, timeSlots };
  }

  private async getSchedule(dealerId: number): Promise<OperatingDayDto[]> {
    const operatingHour = await this.findOneCached({ model: 'OperatingHour', where: {}, dealerId });
    return (operatingHour?.schedule ?? []) as OperatingDayDto[];
  }

  private async getServiceDuration(serviceCodes: string[], dealerId: number, vehicleModelId?: number): Promise<number> {
    if (serviceCodes.length === 0) return 0;

    const { data } = await this.findAll({
      model: 'DealerService',
      where: { service: { code: { in: serviceCodes }, isActive: true } },
      select: { service: { select: SERVICE_QUOTE_SELECT } },
      dealerId,
    });

    let sizeClass: VehicleSizeClass | null = null;
    if (vehicleModelId) {
      const model = await this.findOne({ model: 'VehicleModel', where: { id: vehicleModelId }, select: { sizeClass: true }, throwError: true });
      sizeClass = model.sizeClass;
    }

    return quoteServices(data.map((d) => d.service), sizeClass).estimatedDuration;
  }
}

