export class HashedPassword {
    private constructor(public readonly value: string) { }
    static fromHash(hash: string) {
        if (hash.length < 20) throw new Error('Invalid hash for password');
        return new HashedPassword(hash);
    }
}