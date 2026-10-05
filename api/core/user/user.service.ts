import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { hashPassword } from '../../shared/utils/hash.util';
import { stripSecrets } from '../../shared/utils/sanitize.util';
import { t } from '../../shared/utils/i18n.util';
import { ROLE_CODES } from '../../shared/constants/role.constant';
import { CreateUserDto, CreateTechnicianDto } from './dto/user.dto';
import { USER_DETAIL_INCLUDE, TECHNICIAN_PUBLIC_SELECT, bookableTechnicianWhere } from './constants/user.constant';

@Injectable()
export class UserService extends CrudService {
  protected readonly modelName = 'User';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createUser(dto: CreateUserDto) {
    await this.assertEmailAvailable(dto.email);
    await this.findOne({ model: 'Role', where: { id: dto.roleId }, throwError: true });

    const { roleId, password, ...profile } = dto;
    const user = await this.transaction(async (tx) => {
      const created = await tx.create({ data: { ...profile, password: await hashPassword(password) } });
      await tx.create({ model: 'UserRole', data: { userId: created.id, roleId } });
      return created;
    });

    return this.getProfile(user.id);
  }

  async createTechnician(dto: CreateTechnicianDto, dealerId?: number) {
    if (!dealerId) {
      throw new BadRequestException(t('DEALER_ID_REQUIRED'));
    }
    if (dto.email) {
      await this.assertEmailAvailable(dto.email);
    }

    const role = await this.findOne({ model: 'Role', where: { code: ROLE_CODES.TECHNICIAN } });
    if (!role) {
      throw new NotFoundException(t('ROLE_NOT_FOUND', { code: ROLE_CODES.TECHNICIAN }));
    }

    const { isBookable, ...profile } = dto;
    const user = await this.transaction(async (tx) => {
      const created = await tx.create({
        data: { ...profile, isBookable: isBookable ?? true },
        dealerId,
      });
      await tx.create({ model: 'UserRole', data: { userId: created.id, roleId: role.id } });
      return created;
    });

    return this.getProfile(user.id);
  }

  async getProfile(id: number) {
    const user = await this.findOne({ where: { id }, include: USER_DETAIL_INCLUDE, throwError: true });
    return stripSecrets(user);
  }

  async searchUsers(dto: BaseSearchDto, dealerId?: number) {
    const result = await this.findAll({
      where: dto.where,
      include: dto.include ?? USER_DETAIL_INCLUDE,
      orderBy: dto.orderBy ?? { createdAt: 'desc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
      dealerId,
    });
    return { ...result, data: result.data.map((u) => stripSecrets(u)) };
  }

  async searchTechnicians(dto: BaseSearchDto, dealerId?: number) {
    return this.findAllCached({
      where: { ...(dto.where ?? {}), ...bookableTechnicianWhere() },
      select: TECHNICIAN_PUBLIC_SELECT,
      orderBy: dto.orderBy ?? { firstName: 'asc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
      dealerId,
    });
  }

  async findBookableTechnicians(dealerId: number) {
    const result = await this.findAll({
      where: bookableTechnicianWhere(),
      select: TECHNICIAN_PUBLIC_SELECT,
      orderBy: { id: 'asc' },
      dealerId,
    });
    return result.data;
  }

  async findTechnician(id: number, dealerId: number) {
    const technician = await this.findOne({ where: { id, ...bookableTechnicianWhere() }, select: TECHNICIAN_PUBLIC_SELECT, dealerId });
    if (!technician) {
      throw new NotFoundException(t('TECHNICIAN_NOT_FOUND', { id }));
    }
    return technician;
  }

  private async assertEmailAvailable(email: string) {
    const existing = await this.findOne({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ConflictException(t('EMAIL_ALREADY_EXISTS', { email }));
    }
  }
}
