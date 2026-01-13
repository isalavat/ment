import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { PrismaTransactionalContext } from "./PrismaTransactionalContext";

export function PrismaClientGetway(): PrismaClient | Prisma.TransactionClient {
	return PrismaTransactionalContext.getStore()?.tx ?? prisma;
}
