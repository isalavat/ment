import type { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/client";
import type { Transaction } from "../../Transaction";
import { PrismaTransactionalContext } from "../PrismaTransactionalContext";

export class PrismaTransaction implements Transaction {
	async run<T>(work: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			return await PrismaTransactionalContext.run({ tx }, work);
		});
	}
}
