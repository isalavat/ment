import bcrypt from "bcryptjs";

export interface IPasswordHasher {
    hash(password: string): Promise<string>
}

export class BCrpytPasswordHasher implements IPasswordHasher{
    async hash(password: string): Promise<string> {
        return await bcrypt.hash(password, 12);
    }

}