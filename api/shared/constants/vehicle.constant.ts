import { VehicleSizeClass } from '@prisma/client';

export const SIZE_MULTIPLIERS: Record<VehicleSizeClass, number> = {
  [VehicleSizeClass.Compact]: 0.9,
  [VehicleSizeClass.Sedan]: 1.0,
  [VehicleSizeClass.Suv]: 1.2,
  [VehicleSizeClass.LargeSuvTruck]: 1.4,
};
