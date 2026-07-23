import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { catalogPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.catalogPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.catalogPrisma = prisma;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
