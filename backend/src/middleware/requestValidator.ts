import type { NextFunction, Request, Response } from "express";
import type z from "zod";
import { RequestValidationError } from "./RequestValidationError";

export const validateBodyWith =
	<T extends z.ZodTypeAny>(schema: T) =>
	async (req: Request, _: Response, next: NextFunction) => {
		const { data, error, success } = await schema.safeParseAsync(req.body);
		if (!success) {
			throw new RequestValidationError(error);
		}
		req.body = data;
		next();
	};
