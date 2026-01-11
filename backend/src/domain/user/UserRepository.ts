import { Email } from "./value-objects/Email";
import { User } from "./User";

export interface UserRepository{
    save(user: User): Promise<User>
    existsByEmail(email: Email): Promise<boolean>
}