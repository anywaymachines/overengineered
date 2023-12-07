import BuildingWrapper from "server/BuildingWrapper";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class ConfigRemoteHandler {
	static init() {
		registerOnRemoteFunction("Building", "UpdateConfigRequest", BuildingWrapper.updateConfigAsPlayer);
	}
}
