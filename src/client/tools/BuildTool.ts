import ToolBase from "client/base/ToolBase";

/** A tool for building in the world with blocks */
export default class BuildTool extends ToolBase {
	getDisplayName(): string {
		return "Building Mode";
	}

	getImageID(): string {
		return "rbxassetid://12539295858";
	}

	getShortDescription(): string {
		return "hello";
	}

	protected prepareDesktop(): void {}
	protected prepareTouch(): void {}
	protected prepareGamepad(): void {}
}
