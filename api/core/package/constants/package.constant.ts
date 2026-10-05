export const PACKAGE_DEFAULT_INCLUDE = {
  packageServices: {
    where: { service: { isActive: true } },
    include: { service: true },
    orderBy: { service: { sortOrder: 'asc' as const } },
  },
};
