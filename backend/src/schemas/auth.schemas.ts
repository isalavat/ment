import z from "zod";

export const CreateUserSchema = z.strictObject({
    email: z.email(),
    password: z.string(),
    firstName: z.string('first name is required'),
    lastName: z.string(),
    role: z.literal(["MENTEE", "MENTOR", "ADMIN"]),
})

export type CreateUserDTO = z.infer<typeof CreateUserSchema>




