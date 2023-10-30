import Signal from "@rbxts/signal";
import GuiAbstractTool from "./gui/abstract/AbstractToolGui";

export default class ClientSignals {
	public static TOOL_EQUIPED = new Signal<(tool: GuiAbstractTool) => void>();
	public static TOOL_UNEQUIPED = new Signal<(tool: GuiAbstractTool) => void>();
}
