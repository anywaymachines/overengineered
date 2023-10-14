import Logger from "shared/Logger";
import GameDefinitions from "shared/definitions/GameDefinitions";

export default class CategoriesBehavior {
	static CATEGORIES = new Map<string, Category>();

	static initialize() {
		Logger.info("[CategoriesBehavior] Initializing..");
		this.registerNativeCategories();
	}

	/** The function registers all categories that have been specified in **GameDefinitions** */
	private static registerNativeCategories() {
		GameDefinitions.NativeCategories.forEach((category) => {
			this.CATEGORIES.set(category.id, category);
		});
	}

	/** The function returns a category based on its id, which is the argument
	 * @param id The name of the category
	 */
	static getCategoryByID(id: string): Category | undefined {
		return this.CATEGORIES.get(id);
	}
}
