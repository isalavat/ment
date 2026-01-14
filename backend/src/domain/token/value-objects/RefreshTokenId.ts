import { v4 as uuid4, validate as uuidValidate } from "uuid";
import { InvalidRefreshTokenIdFormatError } from "../errors/InvalidRefreshTokenIdFormatError";

export class RefreshTokenId {
	private constructor(public readonly value: string) {}

	static generate(): RefreshTokenId {
		return new RefreshTokenId(uuid4());
	}

	static fromString(id: string): RefreshTokenId {
		if (!uuidValidate(id)) {
			throw new InvalidRefreshTokenIdFormatError();
		}
		return new RefreshTokenId(id);
	}

	equals(other: RefreshTokenId): boolean {
		return this.value === other.value;
	}
}
