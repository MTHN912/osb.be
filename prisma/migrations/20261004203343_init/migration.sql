-- CreateEnum
CREATE TYPE "DealerServiceType" AS ENUM ('insurance_claim', 'car_service');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'BookedIn', 'CheckIn', 'Cancelled', 'Completed');

-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('Package', 'Addon');

-- CreateEnum
CREATE TYPE "VehicleSizeClass" AS ENUM ('Compact', 'Sedan', 'Suv', 'LargeSuvTruck');

-- CreateTable
CREATE TABLE "dealers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "logoUrl" TEXT,
    "serviceType" "DealerServiceType" NOT NULL DEFAULT 'car_service',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_hours" (
    "id" SERIAL NOT NULL,
    "dealerId" INTEGER NOT NULL,
    "schedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "dealerId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "suburb" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "currentResetToken" TEXT,
    "currentRefreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "dealerId" INTEGER,
    "email" TEXT,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "currentRefreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "action" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "experienceYear" INTEGER,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_brands" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeClass" "VehicleSizeClass" NOT NULL DEFAULT 'Sedan',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "vin" TEXT,
    "brandId" INTEGER,
    "modelId" INTEGER,
    "variant" TEXT,
    "year" INTEGER,
    "city" TEXT,
    "mileage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "dealerId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "technicianId" INTEGER,
    "vehicleId" INTEGER,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'Pending',
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "needMobility" BOOLEAN NOT NULL DEFAULT false,
    "estimatedDuration" INTEGER NOT NULL DEFAULT 0,
    "estimatedPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "serviceNote" TEXT,
    "technicianNote" TEXT,
    "customerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_services" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ServiceKind" NOT NULL DEFAULT 'Package',
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationUnit" TEXT NOT NULL DEFAULT 'minutes',
    "sizeSensitive" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_services" (
    "id" SERIAL NOT NULL,
    "packageId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_services" (
    "id" SERIAL NOT NULL,
    "dealerId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_packages" (
    "id" SERIAL NOT NULL,
    "dealerId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealers_code_key" ON "dealers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "operating_hours_dealerId_key" ON "operating_hours"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_dealerId_key" ON "customers"("email", "dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_userId_key" ON "technician_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_code_key" ON "vehicle_brands"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_code_key" ON "vehicle_models"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_customerId_plate_key" ON "vehicles"("customerId", "plate");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingCode_key" ON "bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "bookings_dealerId_bookingDate_idx" ON "bookings"("dealerId", "bookingDate");

-- CreateIndex
CREATE UNIQUE INDEX "booking_services_bookingId_serviceId_key" ON "booking_services"("bookingId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "packages_code_key" ON "packages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "package_services_packageId_serviceId_key" ON "package_services"("packageId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_services_dealerId_serviceId_key" ON "dealer_services"("dealerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_packages_dealerId_packageId_key" ON "dealer_packages"("dealerId", "packageId");

-- AddForeignKey
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_services" ADD CONSTRAINT "dealer_services_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_services" ADD CONSTRAINT "dealer_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_packages" ADD CONSTRAINT "dealer_packages_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_packages" ADD CONSTRAINT "dealer_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
