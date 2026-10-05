export type PrismaArgs = Record<string, any>;

export interface FindOneParams {
  model?: string;
  where: PrismaArgs;
  select?: PrismaArgs;
  include?: PrismaArgs;
  orderBy?: PrismaArgs | PrismaArgs[];
  throwError?: boolean;
  dealerId?: number;
}

export interface FindAllParams {
  model?: string;
  where?: PrismaArgs;
  select?: PrismaArgs;
  include?: PrismaArgs;
  orderBy?: PrismaArgs | PrismaArgs[];
  take?: number;
  skip?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  throwError?: boolean;
  dealerId?: number;
}

export interface CreateParams {
  model?: string;
  data: PrismaArgs;
  select?: PrismaArgs;
  include?: PrismaArgs;
  dealerId?: number;
}

export interface CreateManyParams {
  model?: string;
  data: PrismaArgs[];
  skipDuplicates?: boolean;
}

export interface UpdateParams {
  model?: string;
  where: PrismaArgs;
  data: PrismaArgs;
  select?: PrismaArgs;
  include?: PrismaArgs;
  dealerId?: number;
}

export interface DeleteParams {
  model?: string;
  where: PrismaArgs;
  dealerId?: number;
}

export interface DeleteManyParams {
  model?: string;
  where: PrismaArgs;
  dealerId?: number;
}

export interface FindAllResult<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize?: number;
  totalPages: number;
}

export interface CrudOperations {
  findOne<T = any>(params: FindOneParams): Promise<T | null>;
  findAll<T = any>(params: FindAllParams): Promise<FindAllResult<T>>;
  create<T = any>(params: CreateParams): Promise<T>;
  createMany(params: CreateManyParams): Promise<number>;
  update<T = any>(params: UpdateParams): Promise<T>;
  delete<T = any>(params: DeleteParams): Promise<T>;
  deleteMany(params: DeleteManyParams): Promise<number>;
}
