import Logger from "shared/Logger";

export default abstract class BaseRemoteHandler {
	constructor(name: string) {
		Logger.info(`Enabling ${name} remote handler`);
	}
}
