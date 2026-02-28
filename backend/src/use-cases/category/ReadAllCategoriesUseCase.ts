import type { Category } from "../../domain/category/Category";
import type { CategoryRepository } from "../../domain/category/CategoryRepository";

export class ReadAllCategoriesUseCase {
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async execute(): Promise<Category[]> {
		return this.categoryRepository.findAll();
	}
}
