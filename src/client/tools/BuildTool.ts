import ToolBase from "client/base/ToolBase";

export default class BuildTool extends ToolBase {
	getImageID(): string {
		return "";
	}
	getDisplayName(): string {
		return "Building Mode";
	}
	getShortDescription(): string {
		return "hello";
	}
}
