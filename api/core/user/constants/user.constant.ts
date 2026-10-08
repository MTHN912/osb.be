export const USER_DETAIL_INCLUDE = {
  roles: { include: { role: true } },
  dealer: { select: { id: true, name: true, code: true } },
};

