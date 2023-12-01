import AbstractCategory from "./abstract/AbstractCategory";
import BlocksCategory from "./categories/BlocksCategory";
import EnginesCategory from "./categories/EnginesCategory";
import SeatsCategory from "./categories/SeatsCategory";
import WingsCategory from "./categories/WingsCategory";

export default class CategoriesRegistry {
	public static categories: Map<string, AbstractCategory> = new Map<string, AbstractCategory>();
	public static registeredCategories: AbstractCategory[] = [];

	public static readonly BLOCKS_CATEGORY = this.register(new BlocksCategory());
	public static readonly SEATS_CATEGORY = this.register(new SeatsCategory());
	public static readonly WINGS_CATEGORY = this.register(new WingsCategory());
	public static readonly ENGINES_CATEGORY = this.register(new EnginesCategory());

	public static register(category: AbstractCategory): AbstractCategory {
		this.categories.set(category.id, category);
		this.registeredCategories.push(category);
		return category;
	}
}
