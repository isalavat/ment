import { v7 as uuid7, validate as uuidValidate } from 'uuid'
import { InvalidUserIdFormatError } from './errors/InvalidUserIdFormatError';

export class UserId {
    private constructor(public readonly value: string) { }

    static generate(): UserId {
        return new UserId(uuid7());
    }

    static fromString(id: string): UserId {
        if (!uuidValidate(id)) {
            throw new InvalidUserIdFormatError();
        }
        return new UserId(id);
    }

    equals(other: UserId): boolean {
        return this.value === other.value;
    }
}