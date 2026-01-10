import z from "zod";
import { InvalidEmailFormatError } from "./InvalidEmailFormatError";

export class Email {
    private constructor(public readonly value: string) { }

    static from(email: string) {
        const { success } = z.email().safeParse(email);
        if (!success) {
            throw new InvalidEmailFormatError(email);
        }
        return new Email(email);
    }

    equals(other: Email) {
        return this.value === other.value
    }
}