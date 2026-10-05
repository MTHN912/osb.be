export const CACHE_PREFIX = 'cache';

export const TENANT_MODELS = new Set<string>([
  'Customer',
  'Booking',
  'User',
  'OperatingHour',
  'DealerService',
  'DealerPackage',
]);

export const MODEL_CACHE_DEPENDENCIES: Record<string, string[]> = {
  Dealer: ['OperatingHour', 'DealerService', 'DealerPackage'],
  OperatingHour: ['Dealer'],
  DealerService: ['Dealer', 'Service'],
  DealerPackage: ['Dealer', 'Package'],
  Service: ['Package', 'PackageService', 'DealerService', 'Dealer'],
  Package: ['Service', 'PackageService', 'DealerPackage', 'Dealer'],
  PackageService: ['Package', 'Service'],
  Customer: ['Booking', 'Vehicle'],
  Vehicle: ['Customer', 'Booking'],
  Booking: ['BookingService', 'Customer', 'Vehicle'],
  BookingService: ['Booking'],
  User: ['UserRole', 'Booking'],
  UserRole: ['User'],
  Role: ['UserRole', 'User'],
  VehicleBrand: ['VehicleModel'],
  VehicleModel: ['VehicleBrand', 'Vehicle'],
};

export interface ModelSearchConfig {
  numberFields?: string[];
  stringFields?: string[];
  relationFields?: Record<string, string[]>;
}

export const MODEL_SEARCH_CONFIG: Record<string, ModelSearchConfig> = {
  Dealer: {
    numberFields: ['id'],
    stringFields: ['name', 'code', 'email', 'phone', 'address', 'city'],
  },
  Customer: {
    numberFields: ['id'],
    stringFields: ['firstName', 'lastName', 'email', 'phoneNumber'],
  },
  Booking: {
    numberFields: ['id'],
    stringFields: [],
    relationFields: {
      customer: ['firstName', 'lastName', 'email', 'phoneNumber'],
      vehicle: ['plate', 'vin'],
    },
  },
  Vehicle: {
    numberFields: ['id', 'year'],
    stringFields: ['plate', 'vin', 'variant'],
  },
  User: {
    numberFields: ['id'],
    stringFields: ['firstName', 'lastName', 'email', 'phoneNumber'],
  },
  Service: {
    numberFields: ['id'],
    stringFields: ['code', 'name', 'description'],
  },
  Package: {
    numberFields: ['id'],
    stringFields: ['code', 'name', 'description'],
  },
  VehicleBrand: {
    stringFields: ['code', 'name'],
  },
  VehicleModel: {
    stringFields: ['code', 'name'],
  },
};
