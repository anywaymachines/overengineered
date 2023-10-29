import AbstractCategory from "./AbstractCategory";
import BlocksCategory from "./categories/BlocksCategory";
import TestCategory from "./categories/TestCategory";

export default class CategoriesRegistry {
	public static categories: Map<string, AbstractCategory> = new Map<string, AbstractCategory>();
	public static registeredCategories: AbstractCategory[] = [];

	public static readonly BLOCKS_CATEGORY = this.register(new BlocksCategory());
	public static readonly TEST_CATEGORY = this.register(new TestCategory());

	public static register(category: AbstractCategory): AbstractCategory {
		this.categories.set(category.id, category);
		this.registeredCategories.push(category);
		return category;
	}
}
