import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { t } from '../../shared/utils/i18n.util';
import {
  PrismaArgs,
  FindOneParams,
  FindAllParams,
  CreateParams,
  CreateManyParams,
  UpdateParams,
  DeleteParams,
  DeleteManyParams,
  FindAllResult,
  CrudOperations,
} from './interfaces/crud.interface';
import { CACHE_PREFIX, TENANT_MODELS, MODEL_CACHE_DEPENDENCIES, MODEL_SEARCH_CONFIG } from './constants/crud.constant';

export * from './interfaces/crud.interface';

type PrismaClientLike = Record<string, any>;

function getDelegate(client: PrismaClientLike, model: string) {
  const delegate = client[model.charAt(0).toLowerCase() + model.slice(1)];
  if (!delegate) {
    throw new Error(t('UNKNOWN_MODEL', { model }));
  }
  return delegate;
}

function withTenant(where: PrismaArgs | undefined, model: string, dealerId?: number): PrismaArgs {
  const result = { ...(where || {}) };
  if (dealerId && TENANT_MODELS.has(model)) {
    result.dealerId = dealerId;
  }
  return result;
}

function nestRelation(path: string, condition: PrismaArgs): PrismaArgs {
  return path.split('.').reduceRight<PrismaArgs>((acc, part) => ({ [part]: acc }), condition);
}

function sanitizeInclude(model: string, include?: PrismaArgs): PrismaArgs | undefined {
  if (!include || typeof include !== 'object') return include;
  const result: PrismaArgs = { ...include };
  if (model === 'Booking') {
    delete result.technician;
  }
  for (const [key, value] of Object.entries(result)) {
    if (value && typeof value === 'object') {
      if (key === 'bookings' || key === 'booking') {
        const nested = value as PrismaArgs;
        result[key] = {
          ...nested,
          ...(nested.include ? { include: sanitizeInclude('Booking', nested.include) } : {}),
        };
      }
    }
  }
  return result;
}

function withSearch(where: PrismaArgs, model: string, search?: string): PrismaArgs {
  const query = search?.trim();
  const config = MODEL_SEARCH_CONFIG[model];
  if (!query || !config) return where;

  const or: PrismaArgs[] = [];
  const asNumber = Number(query);
  if (!isNaN(asNumber)) {
    for (const field of config.numberFields ?? []) {
      or.push({ [field]: asNumber });
    }
  }
  for (const field of config.stringFields ?? []) {
    or.push({ [field]: { contains: query, mode: 'insensitive' } });
  }
  for (const [path, fields] of Object.entries(config.relationFields ?? {})) {
    for (const field of fields) {
      or.push(nestRelation(path, { [field]: { contains: query, mode: 'insensitive' } }));
    }
  }
  if (or.length === 0) return where;

  const existingAnd = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : [];
  return { ...where, AND: [...existingAnd, { OR: or }] };
}

function cacheKey(model: string, operation: string, params: object): string {
  const hash = createHash('sha256').update(JSON.stringify(params)).digest('hex').substring(0, 16);
  return `${CACHE_PREFIX}:${model}:${operation}:${hash}`;
}

async function runFindOne<T>(client: PrismaClientLike, model: string, params: FindOneParams): Promise<T | null> {
  const query: PrismaArgs = { where: withTenant(params.where, model, params.dealerId) };
  if (params.select) query.select = params.select;
  if (params.include) query.include = sanitizeInclude(model, params.include);
  if (params.orderBy) query.orderBy = params.orderBy;

  const result = await getDelegate(client, model).findFirst(query);
  if (!result && params.throwError) {
    throw new NotFoundException(t('NOT_FOUND', { model }));
  }
  return result as T | null;
}

async function runFindAll<T>(client: PrismaClientLike, model: string, params: FindAllParams): Promise<FindAllResult<T>> {
  const where = withSearch(withTenant(params.where, model, params.dealerId), model, params.search);
  const take = params.take ?? params.pageSize;
  const skip = params.skip ?? (params.page && take ? (params.page - 1) * take : undefined);

  const query: PrismaArgs = { where };
  if (params.select) query.select = params.select;
  if (params.include) query.include = sanitizeInclude(model, params.include);
  if (params.orderBy) query.orderBy = params.orderBy;
  if (take !== undefined) query.take = take;
  if (skip !== undefined) query.skip = skip;

  const delegate = getDelegate(client, model);
  const [data, total] = await Promise.all([delegate.findMany(query), delegate.count({ where })]);

  if (data.length === 0 && params.throwError) {
    throw new NotFoundException(t('NO_RECORDS_FOUND', { model }));
  }

  return {
    data: data as T[],
    total,
    page: take && skip !== undefined ? Math.floor(skip / take) + 1 : 1,
    pageSize: take,
    totalPages: take ? Math.ceil(total / take) : 1,
  };
}

async function runCreate<T>(client: PrismaClientLike, model: string, params: CreateParams): Promise<T> {
  const data = { ...params.data };
  if (params.dealerId && TENANT_MODELS.has(model)) {
    data.dealerId = params.dealerId;
  }
  const query: PrismaArgs = { data };
  if (params.select) query.select = params.select;
  if (params.include) query.include = sanitizeInclude(model, params.include);
  return getDelegate(client, model).create(query);
}

async function runCreateMany(client: PrismaClientLike, model: string, params: CreateManyParams): Promise<number> {
  if (params.data.length === 0) return 0;
  const result = await getDelegate(client, model).createMany({
    data: params.data,
    skipDuplicates: params.skipDuplicates ?? false,
  });
  return result.count;
}

async function runUpdate<T>(client: PrismaClientLike, model: string, params: UpdateParams): Promise<T> {
  const query: PrismaArgs = {
    where: withTenant(params.where, model, params.dealerId),
    data: params.data,
  };
  if (params.select) query.select = params.select;
  if (params.include) query.include = sanitizeInclude(model, params.include);
  return getDelegate(client, model).update(query);
}

async function runDelete<T>(client: PrismaClientLike, model: string, params: DeleteParams): Promise<T> {
  return getDelegate(client, model).delete({ where: withTenant(params.where, model, params.dealerId) });
}

async function runDeleteMany(client: PrismaClientLike, model: string, params: DeleteManyParams): Promise<number> {
  const result = await getDelegate(client, model).deleteMany({
    where: withTenant(params.where, model, params.dealerId),
  });
  return result.count;
}

@Injectable()
export class CrudService {
  protected readonly modelName: string = '';

  @Optional()
  @Inject(RedisService)
  private readonly redis?: RedisService;

  constructor(private readonly prisma: PrismaService) {}

  private resolveModel(model?: string): string {
    const resolved = model || this.modelName;
    if (!resolved) {
      throw new Error(t('MODEL_NAME_REQUIRED'));
    }
    return resolved;
  }

  async findOne<T = any>(params: FindOneParams): Promise<T | null> {
    return runFindOne<T>(this.prisma, this.resolveModel(params.model), params);
  }

  async findAll<T = any>(params: FindAllParams): Promise<FindAllResult<T>> {
    return runFindAll<T>(this.prisma, this.resolveModel(params.model), params);
  }

  async findOneCached<T = any>(params: FindOneParams): Promise<T | null> {
    const model = this.resolveModel(params.model);
    const key = cacheKey(model, 'findOne', { ...params, model });
    const cached = await this.redis?.getJson<T>(key);
    if (cached) return cached;

    const result = await runFindOne<T>(this.prisma, model, params);
    if (result) await this.redis?.setJson(key, result);
    return result;
  }

  async findAllCached<T = any>(params: FindAllParams): Promise<FindAllResult<T>> {
    const model = this.resolveModel(params.model);
    const key = cacheKey(model, 'findAll', { ...params, model });
    const cached = await this.redis?.getJson<FindAllResult<T>>(key);
    if (cached) return cached;

    const result = await runFindAll<T>(this.prisma, model, params);
    await this.redis?.setJson(key, result);
    return result;
  }

  async create<T = any>(params: CreateParams): Promise<T> {
    const model = this.resolveModel(params.model);
    const result = await runCreate<T>(this.prisma, model, params);
    await this.clearModelCache(model);
    return result;
  }

  async createMany(params: CreateManyParams): Promise<number> {
    const model = this.resolveModel(params.model);
    const result = await runCreateMany(this.prisma, model, params);
    await this.clearModelCache(model);
    return result;
  }

  async update<T = any>(params: UpdateParams): Promise<T> {
    const model = this.resolveModel(params.model);
    const result = await runUpdate<T>(this.prisma, model, params);
    await this.clearModelCache(model);
    return result;
  }

  async delete<T = any>(params: DeleteParams): Promise<T> {
    const model = this.resolveModel(params.model);
    const result = await runDelete<T>(this.prisma, model, params);
    await this.clearModelCache(model);
    return result;
  }

  async deleteMany(params: DeleteManyParams): Promise<number> {
    const model = this.resolveModel(params.model);
    const result = await runDeleteMany(this.prisma, model, params);
    await this.clearModelCache(model);
    return result;
  }

  async transaction<T>(callback: (tx: CrudOperations) => Promise<T>): Promise<T> {
    const affected = new Set<string>();
    const track = (model?: string) => {
      const resolved = this.resolveModel(model);
      affected.add(resolved);
      return resolved;
    };

    const result = await this.prisma.$transaction((client) => {
      const tx: CrudOperations = {
        findOne: (p) => runFindOne(client, this.resolveModel(p.model), p),
        findAll: (p) => runFindAll(client, this.resolveModel(p.model), p),
        create: (p) => runCreate(client, track(p.model), p),
        createMany: (p) => runCreateMany(client, track(p.model), p),
        update: (p) => runUpdate(client, track(p.model), p),
        delete: (p) => runDelete(client, track(p.model), p),
        deleteMany: (p) => runDeleteMany(client, track(p.model), p),
      };
      return callback(tx);
    });

    for (const model of affected) {
      await this.clearModelCache(model);
    }
    return result;
  }

  async clearModelCache(model?: string, visited = new Set<string>()): Promise<void> {
    if (!this.redis?.isReady) return;
    const resolved = this.resolveModel(model);
    if (visited.has(resolved)) return;
    visited.add(resolved);

    await this.redis.delByPattern(`${CACHE_PREFIX}:${resolved}:*`);
    for (const dependent of MODEL_CACHE_DEPENDENCIES[resolved] ?? []) {
      await this.clearModelCache(dependent, visited);
    }
  }
}
