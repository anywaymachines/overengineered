import Signal from "@rbxts/signal";
import InputController from "../controller/InputController";
import ToolBase from "client/base/ToolBase";

/** Class for working with local networking signals */
export default class Signals {
	public static readonly INPUT_TYPE_CHANGED_EVENT = new Signal<
		(platform: typeof InputController.inputType) => void
	>();

	public static readonly PLAYER = {
		SPAWN: new Signal<() => void>(),
		DIED: new Signal<() => void>(),
	};

	public static readonly TOOL = {
		EQUIPPED: new Signal<(tool: ToolBase) => void>(),
		UNEQUIPPED: new Signal<(tool: ToolBase) => void>(),
	};
}
