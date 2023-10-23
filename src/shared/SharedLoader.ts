import Logger from "./Logger";
import BlockRegistry from "./registry/BlocksRegistry";

export default class SharedLoader {
	static load() {
		Logger.info("Initializing shared components");
		BlockRegistry.initialize();
	}
}
