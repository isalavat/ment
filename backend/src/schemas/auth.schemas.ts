import z from "zod";
import type { CreateUserDTO } from "../use-cases/register-user.use-case";

export const CreateUserSchema: z.ZodType<CreateUserDTO> = z.strictObject({
	email: z.email(),
	password: z.string(),
	firstName: z.string("first name is required"),
	lastName: z.string(),
	role: z.literal(["MENTEE", "MENTOR", "ADMIN"]),
});
