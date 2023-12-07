import BuildingWrapper from "server/BuildingWrapper";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class MoveRemoteHandler {
	static init() {
		registerOnRemoteFunction("Building", "MoveRequest", BuildingWrapper.movePlotAsPlayer);
	}
}
