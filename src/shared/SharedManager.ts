import Logger from "./Logger";
import BlockRegistry from "./building/BlocksRegistry";
import CategoriesRegistry from "./building/CategoriesRegistry";

export default class SharedManager {
	static initialize() {
		Logger.info("Initializing shared components");
		CategoriesRegistry.initialize();
		BlockRegistry.initialize();
	}
}
