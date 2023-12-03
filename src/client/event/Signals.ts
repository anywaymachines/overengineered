import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import { Workspace } from "@rbxts/services";
import ObservableValue from "shared/event/ObservableValue";
import InputController from "client/controller/InputController";

/** Class for working with local networking signals */
export default class Signals {
	public static readonly CAMERA = {
		MOVED: (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"),
	} as const;

	public static readonly INPUT_TYPE_CHANGED_EVENT = this.registerSignal(new Signal<(platform: InputType) => void>());
	public static readonly INPUT_TYPE = new ObservableValue<InputType>(InputController.getPhysicalInputType());

	public static readonly PLAYER = {
		SPAWN: this.registerSignal(new Signal<() => void>()),
		DIED: this.registerSignal(new Signal<() => void>()),
	} as const;

	public static readonly BLOCKS = {
		ADDED: this.registerSignal(new Signal<(block: Model) => void>()),
		REMOVED: this.registerSignal(new Signal<(block: Model) => void>()),
	} as const;

	public static readonly CONTRAPTION = {
		CLEARED: this.registerSignal(new Signal<() => void>()),
		MOVED: this.registerSignal(new Signal<(offset: Vector3) => void>()),
	} as const;

	private static registerSignal<T extends Signal>(signal: T): T {
		return signal;
	}

	static {
		this.INPUT_TYPE.changed.Connect((input) => this.INPUT_TYPE_CHANGED_EVENT.Fire(input));
	}
}
