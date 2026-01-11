import { AsyncLocalStorage } from "node:async_hooks";
import { Transaction } from "../Transaction";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from '../../prisma/client'

const transactionalContext = new AsyncLocalStorage<{ tx: Prisma.TransactionClient }>

export class PrismaTransaction implements Transaction {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return await prisma.$transaction(async(tx: Prisma.TransactionClient)=>{
            return await transactionalContext.run({tx}, work);
        })
    }
}

export function getPrismaClient(): PrismaClient | Prisma.TransactionClient {
    return transactionalContext.getStore()?.tx ?? prisma
}