import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/db.js';
import {
  approveKyc,
  upsertKycAndMarkSubmitted,
} from '../src/repositories/vendorKyc.repository.js';

const asyncSpy = (result) => {
  const calls = [];
  const fn = async (...args) => {
    calls.push(args);
    return typeof result === 'function' ? result(...args) : result;
  };
  fn.calls = calls;
  return fn;
};

const mockPrismaTransaction = (t, tx) => {
  const propertyName = '$transaction';
  const originalDescriptor = Object.getOwnPropertyDescriptor(prisma, propertyName);

  assert.ok(originalDescriptor?.configurable, 'Prisma $transaction must be mockable');
  Object.defineProperty(prisma, propertyName, {
    ...originalDescriptor,
    value: async (work) => work(tx),
  });
  t.after(() => Object.defineProperty(prisma, propertyName, originalDescriptor));
};

test('KYC submission advances only profile verification state', async (t) => {
  const vendorUserId = 'VEND-123456';
  const savedKyc = {
    vendorUserId,
    businessName: 'Royal Events',
    description: 'End-to-end wedding planning.',
    addressCity: 'Pune',
    addressCountryCode: 'IN',
  };
  const submittedKyc = {
    businessName: savedKyc.businessName,
    description: savedKyc.description,
    addressCity: savedKyc.addressCity,
    addressCountryCode: savedKyc.addressCountryCode,
  };
  const updateProfile = asyncSpy({
    userId: vendorUserId,
    kycStatus: 'SUBMITTED',
  });
  const documents = [
    { type: 'PAN', documentNumber: 'ABCDE1234F', documentUrl: 'https://example.test/pan', documentPublicId: 'pan' },
    { type: 'AADHAR', documentNumber: 'XXXXXXXX9012', documentUrl: 'https://example.test/aadhaar', documentPublicId: 'aadhaar' },
  ];
  const tx = {
    vendorProfile: {
      updateMany: asyncSpy({ count: 1 }),
      update: updateProfile,
    },
    vendorKyc: { upsert: asyncSpy(savedKyc) },
    vendorKycDocument: {
      deleteMany: asyncSpy({ count: 2 }),
      upsert: asyncSpy(null),
      findMany: asyncSpy(documents),
    },
    user: { update: asyncSpy(null) },
    refreshToken: { updateMany: asyncSpy(null) },
  };

  mockPrismaTransaction(t, tx);

  await upsertKycAndMarkSubmitted({
    vendorUserId,
    kyc: submittedKyc,
    documents,
  });

  assert.equal(updateProfile.calls.length, 1);
  assert.deepEqual(tx.vendorKycDocument.deleteMany.calls[0][0], {
    where: {
      vendorUserId,
      type: { in: ['GSTIN', 'CIN'] },
    },
  });
  assert.deepEqual(tx.vendorProfile.updateMany.calls[0][0], {
    where: {
      userId: vendorUserId,
      kycStatus: { in: ['PENDING', 'REJECTED'] },
    },
    data: { kycStatus: 'SUBMITTED' },
  });
  assert.deepEqual(tx.vendorKyc.upsert.calls[0][0].create, {
    vendorUserId,
    ...submittedKyc,
  });
  assert.equal(tx.vendorKyc.upsert.calls[0][0].update.addressCity, 'Pune');
  assert.equal(tx.vendorKyc.upsert.calls[0][0].update.addressCountryCode, 'IN');
  assert.equal(tx.vendorKyc.upsert.calls[0][0].select.addressCity, true);
  assert.equal(tx.vendorKyc.upsert.calls[0][0].select.addressCountryCode, true);
  assert.deepEqual(updateProfile.calls[0][0].data, { kycStatus: 'SUBMITTED' });
  assert.equal('businessName' in updateProfile.calls[0][0].data, false);
  assert.equal('about' in updateProfile.calls[0][0].data, false);
  assert.equal('profileStatus' in updateProfile.calls[0][0].data, false);
});

test('KYC approval rejects a stale concurrent status transition', async (t) => {
  const updateKyc = asyncSpy(null);
  const tx = {
    vendorProfile: { updateMany: asyncSpy({ count: 0 }) },
    vendorKyc: { update: updateKyc },
  };
  mockPrismaTransaction(t, tx);

  await assert.rejects(
    approveKyc({
      vendorUserId: 'VEND-STALE',
      adminId: 'ADMIN-000001',
      profileSlug: 'stale-vendor-vend-stale',
      expectedSubmittedAt: new Date('2026-10-12T08:00:00.000Z'),
    }),
    (error) => error.statusCode === 409 && /status changed/i.test(error.message),
  );
  assert.equal(updateKyc.calls.length, 0);
});

test('KYC approval rejects a superseded submission snapshot', async (t) => {
  const updateProfile = asyncSpy(null);
  const findKyc = asyncSpy(null);
  const tx = {
    vendorProfile: {
      updateMany: asyncSpy({ count: 1 }),
      update: updateProfile,
    },
    vendorKyc: {
      updateMany: asyncSpy({ count: 0 }),
      findUnique: findKyc,
    },
  };
  mockPrismaTransaction(t, tx);

  await assert.rejects(
    approveKyc({
      vendorUserId: 'VEND-SUPERSEDED',
      adminId: 'ADMIN-000001',
      profileSlug: 'superseded-vendor-vend-superseded',
      expectedSubmittedAt: new Date('2026-10-12T08:00:00.000Z'),
    }),
    (error) => error.statusCode === 409 && /newer KYC application/i.test(error.message),
  );
  assert.equal(findKyc.calls.length, 0);
  assert.equal(updateProfile.calls.length, 0);
});

test('KYC approval initializes public profile fields and approved capabilities', async (t) => {
  const vendorUserId = 'VEND-123456';
  const adminId = 'ADMIN-000001';
  const profileSlug = 'royal-events-vend-123456';
  const serviceSubcategoryIds = ['sub-planning', 'sub-decoration'];
  const submittedAt = new Date('2026-10-12T08:00:00.000Z');
  const approvedKyc = {
    vendorUserId,
    businessName: 'Royal Events',
    companyName: 'Royal Events Private Limited',
    description: 'End-to-end wedding planning and decoration.',
    primaryCityId: 'city-delhi',
    primaryOperatingCity: 'Delhi',
    addressState: 'Delhi',
    serviceSubcategoryIds,
    submittedAt,
  };
  const updateProfile = asyncSpy({
    userId: vendorUserId,
    kycStatus: 'APPROVED',
    businessName: approvedKyc.businessName,
    slug: profileSlug,
    about: approvedKyc.description,
    primaryCityId: 'city-delhi',
    profileStatus: 'DRAFT',
  });
  const deactivateOldCapabilities = asyncSpy({ count: 0 });
  const upsertCapability = asyncSpy(null);
  const tx = {
    vendorKyc: {
      updateMany: asyncSpy({ count: 1 }),
      findUnique: asyncSpy(approvedKyc),
    },
    city: { findFirst: asyncSpy({ id: 'city-delhi' }) },
    vendorCapability: {
      updateMany: deactivateOldCapabilities,
      upsert: upsertCapability,
      findMany: asyncSpy([]),
    },
    vendorKycDocument: {
      updateMany: asyncSpy({ count: 0 }),
      findMany: asyncSpy([]),
    },
    vendorProfile: {
      updateMany: asyncSpy({ count: 1 }),
      update: updateProfile,
    },
    user: {
      update: asyncSpy({ id: vendorUserId, isActive: true }),
    },
  };

  mockPrismaTransaction(t, tx);

  await approveKyc({
    vendorUserId,
    adminId,
    profileSlug,
    expectedSubmittedAt: submittedAt,
  });

  assert.deepEqual(tx.vendorProfile.updateMany.calls[0][0], {
    where: {
      userId: vendorUserId,
      kycStatus: { in: ['SUBMITTED'] },
    },
    data: { kycStatus: 'APPROVED' },
  });
  assert.deepEqual(tx.vendorKyc.updateMany.calls[0][0].where, {
    vendorUserId,
    submittedAt,
  });
  assert.deepEqual(tx.city.findFirst.calls[0][0], {
    where: { id: approvedKyc.primaryCityId, isActive: true },
    select: { id: true },
  });
  assert.deepEqual(updateProfile.calls[0][0].data, {
    kycStatus: 'APPROVED',
    businessName: approvedKyc.businessName,
    about: approvedKyc.description,
    slug: profileSlug,
    primaryCityId: 'city-delhi',
    profileStatus: 'DRAFT',
  });
  assert.deepEqual(
    deactivateOldCapabilities.calls[0][0].where.serviceSubcategoryId,
    { notIn: serviceSubcategoryIds },
  );
  assert.equal(upsertCapability.calls.length, serviceSubcategoryIds.length);
  assert.deepEqual(
    upsertCapability.calls.map(([args]) => args.create.serviceSubcategoryId),
    serviceSubcategoryIds,
  );
  for (const [args] of upsertCapability.calls) {
    assert.equal(args.create.vendorUserId, vendorUserId);
    assert.equal(args.create.status, 'APPROVED');
    assert.equal(args.create.source, 'KYC');
    assert.equal(args.update.status, 'APPROVED');
    assert.equal(args.update.source, 'KYC');
    assert.equal(args.create.reviewedByAdminId, adminId);
  }
});

test('KYC approval stops when the selected primary city is no longer active', async (t) => {
  const vendorUserId = 'VEND-INACTIVE-CITY';
  const submittedAt = new Date('2026-10-12T08:00:00.000Z');
  const updateProfile = asyncSpy(null);
  const updateCapabilities = asyncSpy({ count: 0 });
  const tx = {
    vendorProfile: {
      updateMany: asyncSpy({ count: 1 }),
      update: updateProfile,
    },
    vendorKyc: {
      updateMany: asyncSpy({ count: 1 }),
      findUnique: asyncSpy({
        vendorUserId,
        primaryCityId: 'city-inactive',
        primaryOperatingCity: 'Old City',
        serviceSubcategoryIds: [],
        submittedAt,
      }),
    },
    city: { findFirst: asyncSpy(null) },
    vendorCapability: { updateMany: updateCapabilities },
  };

  mockPrismaTransaction(t, tx);

  await assert.rejects(
    approveKyc({
      vendorUserId,
      adminId: 'ADMIN-000001',
      profileSlug: 'inactive-city-vendor',
      expectedSubmittedAt: submittedAt,
    }),
    (error) => error.statusCode === 409 && /no longer active/i.test(error.message),
  );

  assert.deepEqual(tx.city.findFirst.calls[0][0], {
    where: { id: 'city-inactive', isActive: true },
    select: { id: true },
  });
  assert.equal(updateCapabilities.calls.length, 0);
  assert.equal(updateProfile.calls.length, 0);
});

test('KYC approval resolves a legacy city-name snapshot when no primary city ID exists', async (t) => {
  const vendorUserId = 'VEND-LEGACY-CITY';
  const submittedAt = new Date('2026-10-12T08:00:00.000Z');
  const updateProfile = asyncSpy({
    userId: vendorUserId,
    kycStatus: 'APPROVED',
    primaryCityId: 'city-delhi',
  });
  const tx = {
    vendorProfile: {
      updateMany: asyncSpy({ count: 1 }),
      update: updateProfile,
    },
    vendorKyc: {
      updateMany: asyncSpy({ count: 1 }),
      findUnique: asyncSpy({
        vendorUserId,
        businessName: 'Legacy Events',
        description: 'Legacy submission',
        primaryCityId: null,
        primaryOperatingCity: 'Delhi',
        addressState: 'Delhi',
        serviceSubcategoryIds: [],
        submittedAt,
      }),
    },
    city: { findMany: asyncSpy([{ id: 'city-delhi' }]) },
    vendorCapability: {
      updateMany: asyncSpy({ count: 0 }),
      upsert: asyncSpy(null),
      findMany: asyncSpy([]),
    },
    vendorKycDocument: {
      updateMany: asyncSpy({ count: 0 }),
      findMany: asyncSpy([]),
    },
    user: { update: asyncSpy({ id: vendorUserId, isActive: true }) },
  };

  mockPrismaTransaction(t, tx);

  await approveKyc({
    vendorUserId,
    adminId: 'ADMIN-000001',
    profileSlug: 'legacy-events-vend-legacy-city',
    expectedSubmittedAt: submittedAt,
  });

  assert.deepEqual(tx.city.findMany.calls[0][0], {
    where: {
      name: { equals: 'Delhi', mode: 'insensitive' },
      isActive: true,
    },
    select: { id: true },
    take: 2,
  });
  assert.equal(updateProfile.calls[0][0].data.primaryCityId, 'city-delhi');
});
