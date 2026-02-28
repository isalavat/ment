export class Category {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly slug: string,
		public readonly description: string | null,
	) {}

	static create(id: string, name: string, slug: string, description: string | null = null): Category {
		return new Category(id, name, slug, description);
	}
}
