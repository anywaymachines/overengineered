import Signal from "@rbxts/signal";
import ComponentBase from "client/component/ComponentBase";
import LogControl from "client/gui/static/LogControl";
import InputController from "./InputController";

type Operation = {
	readonly description: string;
	readonly undo: () => Promise<void>;
	readonly redo?: () => Promise<void>;
};

export default class ActionController extends ComponentBase {
	static readonly instance = new ActionController();

	readonly onUndo = new Signal<(operation: Operation) => void>();
	private readonly history: Operation[] = [];
	private readonly redoHistory: Operation[] = [];

	constructor() {
		super();

		this.event.onKeyDown("Z", () => {
			if (InputController.isCtrlPressed()) {
				ActionController.instance.undo();
				return true;
			}
		});
		this.event.onKeyDown("Y", () => {
			if (InputController.isCtrlPressed()) {
				ActionController.instance.redo();
				return true;
			}
		});
	}

	async executeOperation<TInfo, TResult extends Response>(
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

	appendOperation(operation: Operation) {
		this.history.push(operation);
	}

	redo() {
		const operation = this.redoHistory.pop();
		if (!operation) return false;

		this.history.push(operation);
		operation.redo?.();
		LogControl.instance.addLine(`Redone "${operation.description}"`);
		return true;
	}

	undo() {
		const operation = this.history.pop();
		if (!operation) return false;

		this.redoHistory.push(operation);
		operation.undo();
		LogControl.instance.addLine(`Undone "${operation.description}"`);
		return true;
	}
}
