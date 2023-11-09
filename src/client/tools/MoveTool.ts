import ToolBase from "client/base/ToolBase";

export default class MoveTool extends ToolBase {
	getImageID(): string {
		return "";
	}
	getDisplayName(): string {
		return "Moving Mode";
	}
	getShortDescription(): string {
		return "hello";
	}
}
