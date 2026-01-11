import { Request, Response, NextFunction } from "express"
import z from "zod"
import { RequestValidationError } from "../controllers/RequestValidationError"

export const validateBody = <T extends z.ZodTypeAny>(schema: T) =>
    async (req: Request, _: Response, next: NextFunction) => {
        const { data, error, success } = await schema.safeParseAsync(req.body)
        if (!success) {
            throw new RequestValidationError(error);
        }
        req.body = data
        next()
    }