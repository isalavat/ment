import type { Category as PrismaCategory } from "@prisma/client";
import { Category } from "../../domain/category/Category";
import type { CategoryRepository } from "../../domain/category/CategoryRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaCategoryRepository implements CategoryRepository {
	async findAll(): Promise<Category[]> {
		const categories = await PrismaClientGetway().category.findMany({
			orderBy: { name: "asc" },
		});
		return categories.map(this.toCategory);
	}

	private toCategory(c: PrismaCategory): Category {
		return Category.create(c.id, c.name, c.slug, c.description ?? null);
	}
}
