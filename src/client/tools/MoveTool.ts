import ToolBase from "client/base/ToolBase";

/** A tool for moving the entire building as a whole */
export default class MoveTool extends ToolBase {
	protected prepareDesktop(): void {}

	protected prepareGamepad(): void {}

	protected prepareTouch(): void {}

	getDisplayName(): string {
		return "Moving Mode";
	}

	getImageID(): string {
		return "rbxassetid://12539306575";
	}

	getShortDescription(): string {
		return "hello";
	}
}
