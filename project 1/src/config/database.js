import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Configure the .env file.');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
export const prisma = new PrismaClient({ adapter });
