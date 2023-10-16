import BlocksCategory from "shared/categories/BlocksCategory";
import Category from "../abstract/Category";

export default class CategoriesRegistry {
	public static Categories: Map<string, Category> = new Map<string, Category>();

	public static Blocks = new BlocksCategory();

	public static initialize() {
		this.Categories.set(this.Blocks.id, this.Blocks);
	}
}
