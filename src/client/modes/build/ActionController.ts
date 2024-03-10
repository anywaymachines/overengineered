import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import LogControl from "client/gui/static/LogControl";
import Signal from "shared/event/Signal";

type Operation = {
	readonly description: string;
	readonly undo: () => Promise<void>;
	readonly redo?: () => Promise<void>;
};

export default class ActionController extends ClientComponent {
	static readonly instance = new ActionController();

	readonly onUndo = new Signal<(operation: Operation) => void>();
	private readonly history: Operation[] = [];
	private readonly redoHistory: Operation[] = [];

	constructor() {
		super();

		this.event.onKeyDown("Z", () => {
			if (!InputController.isCtrlPressed()) return;
			this.undo();
		});
		this.event.onKeyDown("Y", () => {
			if (!InputController.isCtrlPressed()) return;
			this.redo();
		});
	}

	async executeOperation<TInfo, TResult extends Response>(
		description: string,
		undo: (info: TInfo) => Promise<void>,
		info: TInfo,
		func: (info: TInfo) => Promise<TResult>,
	) {
		const result = await func(info);

		if (result.success)
			this.appendOperation({
				description,
				undo: () => undo(info),
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
