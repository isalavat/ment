import { Request, Response, NextFunction } from "express"
import z from "zod"
import logger from "../lib/logger"

export const validateBody = <T extends z.ZodTypeAny>(schema: T) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const { data, error, success } = await schema.safeParseAsync(req.body)
        if (!success) {
            logger.error(`Validation Error`)
            return res.status(400).json({ error: z.flattenError(error) })
        }

        req.body = data
        next()
    }