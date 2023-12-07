import BuildingWrapper from "server/BuildingWrapper";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class DeleteRemoteHandler {
	static init() {
		registerOnRemoteFunction("Building", "Delete", BuildingWrapper.deleteBlockAsPlayer);
	}
}
