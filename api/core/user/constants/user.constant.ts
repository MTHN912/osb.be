import { ROLE_CODES } from '../../../shared/constants/role.constant';

export const USER_DETAIL_INCLUDE = {
  roles: { include: { role: true } },
  dealer: { select: { id: true, name: true, code: true } },
};

export const TECHNICIAN_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  dealerId: true,
  isBookable: true,
};

export function bookableTechnicianWhere() {
  return {
    isActive: true,
    isBookable: true,
    roles: { some: { role: { code: ROLE_CODES.TECHNICIAN } } },
  };
}
