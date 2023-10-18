import Logger from "./Logger";
import AESKeyGenerator from "./data/AESKeyGenerator";
import BlockRegistry from "./registry/BlocksRegistry";

export default class SharedLoader {
	static load() {
		Logger.info("Initializing shared components");
		AESKeyGenerator.initialize();
		BlockRegistry.initialize();
	}
}
