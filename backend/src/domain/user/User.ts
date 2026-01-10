import { Email } from "./value-objects/Email";
import { HashedPassword } from "./value-objects/HashedPassword";
import { UserId } from "./value-objects/UserId";

export type UserRole = "MENTEE" | "MENTOR" | "ADMIN"

export class User{
    private constructor(
        public readonly id: UserId,
        public readonly email: Email,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly hashedPassword: HashedPassword,
        public readonly role: UserRole
    ){}

    static create(id: UserId, email: Email, firstName: string, lastName: string, hashedPassword: HashedPassword, role: UserRole){
        return new User(id, email, firstName, lastName, hashedPassword, role)
    }
}