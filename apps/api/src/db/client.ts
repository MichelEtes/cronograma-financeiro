import { PrismaClient } from "@prisma/client";

/** Cliente Prisma único da aplicação. */
export const prisma = new PrismaClient();
