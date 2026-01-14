import type { UserId } from "../user/value-objects/UserId";
import type { RefreshTokenId } from "./value-objects/RefreshTokenId";

export class RefreshToken {
	private constructor(
		public readonly id: RefreshTokenId,
		public readonly token: string,
		public readonly userId: UserId,
		private _revokedAt: Date | null,
	) {}

	public static build(id: RefreshTokenId, token: string, userId: UserId, revokedAt: Date | null) {
		return new RefreshToken(id, token, userId, revokedAt);
	}

	public revoke() {
		this._revokedAt = new Date();
	}

	public get revokedAt(): Date | null {
		return this._revokedAt;
	}

	public get isRevoked(): boolean {
		return this._revokedAt !== null;
	}
}
