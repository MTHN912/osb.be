import { Injectable } from '@nestjs/common';
import { CrudService } from '../../core/crud/crud.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BaseSearchDto } from '../../core/crud/dto/base-search.dto';
import { sanitizeCustomer } from '../../shared/utils/sanitize.util';
import { t } from '../../shared/utils/i18n.util';
import { UpdateCustomerDto } from './dto/customer.dto';
import { CUSTOMER_LIST_INCLUDE } from './constants/customer.constant';

@Injectable()
export class CustomerService extends CrudService {
  protected readonly modelName = 'Customer';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async searchCustomers(dto: BaseSearchDto, dealerId?: number) {
    const result = await this.findAll({
      where: dto.where,
      select: dto.select,
      include: dto.select ? undefined : (dto.include ?? CUSTOMER_LIST_INCLUDE),
      orderBy: dto.orderBy ?? { createdAt: 'desc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
      dealerId,
    });
    return { ...result, data: result.data.map((c) => sanitizeCustomer(c)) };
  }

  async checkEmailExists(email: string, dealerId?: number) {
    const customer = await this.findOne({ where: { email, isGuest: false }, select: { id: true }, dealerId });
    return customer
      ? { exists: true, message: t('EMAIL_EXISTS') }
      : { exists: false, message: t('EMAIL_AVAILABLE') };
  }

  async updateCustomer(id: number, dto: UpdateCustomerDto, dealerId?: number) {
    await this.findOne({ where: { id }, dealerId, throwError: true });
    const customer = await this.update({ where: { id }, data: { ...dto }, dealerId });
    return sanitizeCustomer(customer);
  }
}
