import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma } from "@prisma/client";

export const PrismaTransactionalContext = new AsyncLocalStorage<{ tx: Prisma.TransactionClient }>();
