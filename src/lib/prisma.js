import { PrismaClient } from '@prisma/client';

// Next.js dev hot-reloads modules; keep a single client on globalThis so we do
// not exhaust the MySQL connection pool.
const globalForPrisma = globalThis;

export const prisma =
    globalForPrisma.__callmine_prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__callmine_prisma = prisma;
}

export default prisma;
