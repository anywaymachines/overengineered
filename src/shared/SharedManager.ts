import Logger from "./Logger";
import BlocksBehavior from "./building/BlocksBehavior";
import CategoriesBehavior from "./building/CategoriesBehavior";

export default class SharedManager {
	static initialize() {
		Logger.info("Initializing shared components");
		CategoriesBehavior.initialize();
		BlocksBehavior.initialize();
	}
}
