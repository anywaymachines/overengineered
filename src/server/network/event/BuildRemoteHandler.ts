import BuildingWrapper from "server/BuildingWrapper";
import { registerOnRemoteFunction } from "./RemoteHandler";

/** Class for **server-based** construction management from blocks */
export default class BuildRemoteHandler {
	static init() {
		registerOnRemoteFunction("Building", "PlaceBlockRequest", BuildingWrapper.placeBlockAsPlayer);
	}
}
