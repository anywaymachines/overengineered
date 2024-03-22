import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";

export default class DebugTool extends ToolBase {
	constructor(mode: BuildingMode) {
		super(mode);
	}

	getDisplayName(): string {
		return "Debugging";
	}
	getImageID(): string {
		return "";
	}
}
