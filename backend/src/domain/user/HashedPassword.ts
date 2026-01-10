import { InternalServerError } from "../../lib/error";

export class HashedPassword {
    private constructor(public readonly value: string) { }
    static fromHash(hash: string) {
        if (hash.length < 20) throw new InternalServerError('An unexpected error occurred while processing security credentials.', 'Invalid hash format detected');
        return new HashedPassword(hash);
    }
}