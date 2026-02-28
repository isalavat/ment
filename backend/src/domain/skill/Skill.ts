export class Skill {
	private constructor(
		public readonly id: string,
		public readonly name: string,
	) {}

	static create(id: string, name: string): Skill {
		return new Skill(id, name);
	}
}
