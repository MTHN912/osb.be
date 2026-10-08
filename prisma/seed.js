const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();
const prisma = new PrismaClient();

const standardSchedule = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isClose: false },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isClose: false },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isClose: false },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isClose: false },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isClose: false },
  { dayOfWeek: 6, startTime: '09:00', endTime: '15:00', isClose: false },
  { dayOfWeek: 7, startTime: '09:00', endTime: '18:00', isClose: true },
];

async function main() {
  const roles = [
    { code: 'super_admin', name: 'Super Admin', description: 'System Administrator' },
    { code: 'dealer_manager', name: 'Dealer Manager', description: 'Dealer Branch Manager' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }

  const dealersData = [
    {
      id: 6,
      name: 'Car Wash and Mechanic Dealer',
      code: 'CARWASH',
      address: '1305 Knight St, Arlington, TX 76015',
      phone: '(682) 847-3979',
      email: 'service@vietautorepair.com',
      active: true,
      disabled: false,
      serviceType: 'car_service',
      parentId: null,
    },
  ];

  for (const dealer of dealersData) {
    await prisma.dealer.upsert({
      where: { code: dealer.code },
      update: {
        name: dealer.name,
        address: dealer.address,
        phone: dealer.phone,
        email: dealer.email,
        active: dealer.active,
        disabled: dealer.disabled,
        serviceType: dealer.serviceType,
        parentId: null,
      },
      create: dealer,
    });

    const d = await prisma.dealer.findUnique({ where: { code: dealer.code } });
    await prisma.operatingHour.upsert({
      where: { dealerId: d.id },
      update: { schedule: standardSchedule },
      create: { dealerId: d.id, schedule: standardSchedule },
    });
  }

  const packagesData = [
    { code: 'car-service', name: 'Car Maintenance & Repair', description: 'Periodic service, brake, oil, and mechanical repairs', sortOrder: 1 },
    { code: 'car-wash', name: 'Car Detailing & Wash', description: 'Professional wash, polish, and interior deep clean', sortOrder: 2 },
  ];

  for (const pkg of packagesData) {
    await prisma.package.upsert({
      where: { code: pkg.code },
      update: { name: pkg.name, description: pkg.description, sortOrder: pkg.sortOrder },
      create: pkg,
    });
  }

  const servicesData = [
    { code: 'general-repair', name: 'General Repair', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'maintenance', name: 'Maintenance Package', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'other-check', name: 'Diagnostic Check', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'periodic-minor', name: 'Periodic Service (Minor)', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'periodic-major', name: 'Periodic Service (Major)', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'oil-filter', name: 'Oil & Filter Change', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'brake-service', name: 'Brake Service & Pad Replacement', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'tire-alignment', name: 'Tire Balancing & Wheel Alignment', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'battery', name: 'Battery Test & Replacement', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'ac-service', name: 'A/C Evacuation & Recharge', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'diagnostics', name: 'OBD-II Computer Diagnostics', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'other-request', name: 'Custom Service Request', kind: 'Package', sizeSensitive: false, packageCode: 'car-service' },
    { code: 'express-wash', name: 'Express Exterior Wash', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash' },
    { code: 'exterior-detail', name: 'Exterior Detail & Hand Wax', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash' },
    { code: 'interior-deep-clean', name: 'Interior Deep Clean & Steam', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash' },
    { code: 'full-detail', name: 'Full Detail (In & Out)', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash', isPopular: true },
    { code: 'paint-correction-1', name: 'Stage 1 Paint Correction', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash' },
    { code: 'ceramic-coating', name: 'Ceramic Coating (2-Year)', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash' },
    { code: 'ppf-front', name: 'PPF Front Bumper & Hood', kind: 'Package', sizeSensitive: true, packageCode: 'car-wash' },
    { code: 'headlight-restore', name: 'Headlight Restoration', kind: 'Package', sizeSensitive: false, packageCode: 'car-wash' },
    { code: 'engine-bay', name: 'Engine Bay Detailing', kind: 'Package', sizeSensitive: false, packageCode: 'car-wash' },
    { code: 'odor-treatment', name: 'Ozone Odor Treatment', kind: 'Package', sizeSensitive: false, packageCode: 'car-wash' },
    { code: 'leather-care', name: 'Leather Conditioning Addon', kind: 'Addon', sizeSensitive: false, packageCode: 'car-wash' },
    { code: 'glass-coating', name: 'Rain-X Glass Hydrophobic Coating', kind: 'Addon', sizeSensitive: false, packageCode: 'car-wash' },
    { code: 'wheel-coating', name: 'Ceramic Wheel Coating', kind: 'Addon', sizeSensitive: false, packageCode: 'car-wash' },
    { code: 'pet-hair', name: 'Excessive Pet Hair Removal', kind: 'Addon', sizeSensitive: false, packageCode: 'car-wash' },
  ];

  for (const s of servicesData) {
    const { packageCode, ...serviceFields } = s;
    const service = await prisma.service.upsert({
      where: { code: serviceFields.code },
      update: serviceFields,
      create: serviceFields,
    });

    const pkg = await prisma.package.findUnique({ where: { code: packageCode } });
    if (pkg) {
      await prisma.packageService.upsert({
        where: { packageId_serviceId: { packageId: pkg.id, serviceId: service.id } },
        update: {},
        create: { packageId: pkg.id, serviceId: service.id },
      });
    }
  }

  const allDealers = await prisma.dealer.findMany();
  const allPackages = await prisma.package.findMany({ include: { packageServices: { include: { service: true } } } });

  for (const dealer of allDealers) {
    for (const pkg of allPackages) {
      await prisma.dealerPackage.upsert({
        where: { dealerId_packageId: { dealerId: dealer.id, packageId: pkg.id } },
        update: {},
        create: { dealerId: dealer.id, packageId: pkg.id },
      });

      for (const ps of pkg.packageServices) {
        await prisma.dealerService.upsert({
          where: { dealerId_serviceId: { dealerId: dealer.id, serviceId: ps.serviceId } },
          update: {},
          create: { dealerId: dealer.id, serviceId: ps.serviceId },
        });
      }
    }
  }

  const brands = [
    { code: 'bmw', name: 'BMW' },
    { code: 'mercedes', name: 'Mercedes-Benz' },
    { code: 'audi', name: 'Audi' },
    { code: 'toyota', name: 'Toyota' },
    { code: 'honda', name: 'Honda' },
    { code: 'lexus', name: 'Lexus' },
    { code: 'porsche', name: 'Porsche' },
    { code: 'volkswagen', name: 'Volkswagen' },
  ];

  const models = [
    { brandCode: 'bmw', code: 'bmw-1', name: '1 Series', sizeClass: 'Compact' },
    { brandCode: 'bmw', code: 'bmw-3', name: '3 Series', sizeClass: 'Sedan' },
    { brandCode: 'bmw', code: 'bmw-5', name: '5 Series', sizeClass: 'Sedan' },
    { brandCode: 'bmw', code: 'bmw-x3', name: 'X3', sizeClass: 'Suv' },
    { brandCode: 'bmw', code: 'bmw-x7', name: 'X7', sizeClass: 'LargeSuvTruck' },
    { brandCode: 'mercedes', code: 'mb-c', name: 'C-Class', sizeClass: 'Sedan' },
    { brandCode: 'mercedes', code: 'mb-e', name: 'E-Class', sizeClass: 'Sedan' },
    { brandCode: 'mercedes', code: 'mb-glc', name: 'GLC', sizeClass: 'Suv' },
    { brandCode: 'mercedes', code: 'mb-gls', name: 'GLS', sizeClass: 'LargeSuvTruck' },
    { brandCode: 'audi', code: 'audi-a3', name: 'A3', sizeClass: 'Compact' },
    { brandCode: 'audi', code: 'audi-a4', name: 'A4', sizeClass: 'Sedan' },
    { brandCode: 'audi', code: 'audi-q5', name: 'Q5', sizeClass: 'Suv' },
    { brandCode: 'audi', code: 'audi-q7', name: 'Q7', sizeClass: 'LargeSuvTruck' },
    { brandCode: 'toyota', code: 'toyota-corolla', name: 'Corolla', sizeClass: 'Compact' },
    { brandCode: 'toyota', code: 'toyota-camry', name: 'Camry', sizeClass: 'Sedan' },
    { brandCode: 'toyota', code: 'toyota-rav4', name: 'RAV4', sizeClass: 'Suv' },
    { brandCode: 'toyota', code: 'toyota-highlander', name: 'Highlander', sizeClass: 'LargeSuvTruck' },
    { brandCode: 'honda', code: 'honda-civic', name: 'Civic', sizeClass: 'Compact' },
    { brandCode: 'honda', code: 'honda-accord', name: 'Accord', sizeClass: 'Sedan' },
    { brandCode: 'honda', code: 'honda-crv', name: 'CR-V', sizeClass: 'Suv' },
    { brandCode: 'lexus', code: 'lexus-is', name: 'IS', sizeClass: 'Sedan' },
    { brandCode: 'lexus', code: 'lexus-rx', name: 'RX', sizeClass: 'Suv' },
    { brandCode: 'lexus', code: 'lexus-lx', name: 'LX', sizeClass: 'LargeSuvTruck' },
    { brandCode: 'porsche', code: 'porsche-macan', name: 'Macan', sizeClass: 'Suv' },
    { brandCode: 'porsche', code: 'porsche-cayenne', name: 'Cayenne', sizeClass: 'Suv' },
    { brandCode: 'porsche', code: 'porsche-911', name: '911', sizeClass: 'Compact' },
    { brandCode: 'volkswagen', code: 'vw-golf', name: 'Golf', sizeClass: 'Compact' },
    { brandCode: 'volkswagen', code: 'vw-passat', name: 'Passat', sizeClass: 'Sedan' },
    { brandCode: 'volkswagen', code: 'vw-tiguan', name: 'Tiguan', sizeClass: 'Suv' },
    { brandCode: 'volkswagen', code: 'vw-touareg', name: 'Touareg', sizeClass: 'LargeSuvTruck' },
  ];

  for (const b of brands) {
    await prisma.vehicleBrand.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: b,
    });
  }

  for (const m of models) {
    const brand = await prisma.vehicleBrand.findUnique({ where: { code: m.brandCode } });
    if (brand) {
      await prisma.vehicleModel.upsert({
        where: { code: m.code },
        update: { name: m.name, sizeClass: m.sizeClass, brandId: brand.id },
        create: { code: m.code, name: m.name, sizeClass: m.sizeClass, brandId: brand.id },
      });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@vietautorepair.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const superAdminRole = await prisma.role.findUnique({ where: { code: 'super_admin' } });
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, firstName: 'System', lastName: 'Administrator' },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '(682) 847-3979',
    },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: superAdminRole.id },
    });
  }


}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
