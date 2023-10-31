import Signal from "@rbxts/signal";
import AbstractToolMeta from "./gui/abstract/AbstractToolMeta";

export default class ClientSignals {
	public static TOOL_EQUIPED = new Signal<(tool: AbstractToolMeta) => void>();
	public static TOOL_UNEQUIPED = new Signal<(tool: AbstractToolMeta) => void>();
}
