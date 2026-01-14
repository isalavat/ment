export class AccessToken {
	private constructor(private readonly token: string) {
		Object.freeze(this);
	}

	public static create(token: string) {
		//Maybe add invariant
		return new AccessToken(token);
	}

	public toString(): string {
		return this.token;
	}

	public equal(other: AccessToken) {
		return this.token === other.toString();
	}
}
