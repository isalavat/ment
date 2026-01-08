import z from "zod";

export class Email {
    private constructor(public readonly value: string) { }

    static from(email: string) {
        const { success, error } = z.email().safeParse(email);
        if (!success) {
            throw new Error(z.prettifyError(error));
        }
        return new Email(email);
    }

    equals(other: Email) {
        return this.value === other.value
    }
}