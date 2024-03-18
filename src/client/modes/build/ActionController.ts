import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import LogControl from "client/gui/static/LogControl";
import Signal from "shared/event/Signal";

type Operation = {
	readonly description: string;
	readonly undo: () => Promise<void | Response>;
	readonly redo: () => Promise<void | Response>;
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

	async execute<TResult extends Response>(
		description: string,
		undo: () => Promise<Response>,
		func: () => Promise<TResult>,
	) {
		const result = await func();
		if (result.success)
			this.appendOperation({
				description,
				undo,
				redo: func,
			});

		return result;
	}

	appendOperation(operation: Operation) {
		this.history.push(operation);
		this.redoHistory.clear();
	}

	async redo() {
		const operation = this.redoHistory.pop();
		if (!operation) return false;

		this.history.push(operation);
		const response = await operation.redo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error redoing "${operation.description}": ${response.message}`);
			return true;
		}

		LogControl.instance.addLine(`Redone "${operation.description}"`);
		return true;
	}

	async undo() {
		const operation = this.history.pop();
		if (!operation) return false;

		this.redoHistory.push(operation);
		const response = await operation.undo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error undoing "${operation.description}": ${response.message}`);
			return true;
		}

		LogControl.instance.addLine(`Undone "${operation.description}"`);
		return true;
	}
}
