import Signal from "@rbxts/signal";
import InputHandler from "client/event/InputHandler";
import LogControl from "client/gui/static/LogControl";
import InputController from "./InputController";

type Operation = {
	readonly description: string;
	readonly undo: () => Promise<void>;
	readonly redo?: () => Promise<void>;
};

export default class ActionController {
	public static readonly instance = new ActionController();

	public readonly onUndo = new Signal<(operation: Operation) => void>();
	private readonly history: Operation[] = [];
	private readonly redoHistory: Operation[] = [];

	public static init() {
		const inputHandler = new InputHandler();

		inputHandler.onKeyDown(Enum.KeyCode.Z, () => {
			if (InputController.isCtrlPressed()) {
				ActionController.instance.undo();
				return true;
			}
		});

		inputHandler.onKeyDown(Enum.KeyCode.Y, () => {
			if (InputController.isCtrlPressed()) {
				ActionController.instance.redo();
				return true;
			}
		});
	}

	public async executeOperation<TInfo, TResult extends { success: boolean }>(
		description: string,
		undo: Operation["undo"],
		info: TInfo,
		func: (info: TInfo) => Promise<TResult>,
	) {
		const result = await func(info);

		if (result.success)
			this.appendOperation({
				description,
				undo,
				redo: async () => {
					await func(info);
				},
			});

		return result;
	}

	public appendOperation(operation: Operation) {
		this.history.push(operation);
	}

	public redo() {
		const operation = this.redoHistory.pop();
		if (!operation) return false;

		this.history.push(operation);
		operation.redo?.();
		LogControl.instance.addLine(`Redone "${operation.description}"`);
		return true;
	}

	public undo() {
		const operation = this.history.pop();
		if (!operation) return false;

		this.redoHistory.push(operation);
		operation.undo();
		LogControl.instance.addLine(`Undone "${operation.description}"`);
		return true;
	}
}
