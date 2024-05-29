import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { LoadingController } from "client/controller/LoadingController";
import { LogControl } from "client/gui/static/LogControl";
import { ObservableCollectionArr } from "shared/event/ObservableCollection";
import { Signal } from "shared/event/Signal";

type Operation = {
	readonly description: string;
	readonly undo: () => void | Response;
	readonly redo: () => void | Response;
};

export class ActionController extends ClientComponent {
	static readonly instance = new ActionController();

	readonly onUndo = new Signal<(operation: Operation) => void>();
	readonly onRedo = new Signal<(operation: Operation) => void>();
	private readonly _history = new ObservableCollectionArr<Operation>();
	private readonly _redoHistory = new ObservableCollectionArr<Operation>();
	readonly history = this._history.asReadonly();
	readonly redoHistory = this._redoHistory.asReadonly();

	constructor() {
		super();

		this.event.onKeyDown("Z", () => {
			if (!InputController.isCtrlPressed()) return;
			if (LoadingController.isLoading.get()) return;
			this.undo();
		});
		this.event.onKeyDown("Y", () => {
			if (!InputController.isCtrlPressed()) return;
			if (LoadingController.isLoading.get()) return;
			this.redo();
		});
	}

	execute<TResult extends Response>(description: string, undo: () => Response, func: () => TResult) {
		const result = func();
		if (result.success)
			this.appendOperation({
				description,
				undo,
				redo: func,
			});

		return result;
	}

	appendRedo(operation: Operation) {
		this._redoHistory.push(operation);
	}
	appendOperation(operation: Operation) {
		this._history.push(operation);
		this._redoHistory.clear();
	}

	redo() {
		const operation = this._redoHistory.pop();
		if (!operation) return false;

		this._history.push(operation);
		const response = operation.redo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error redoing "${operation.description}": ${response.message}`);
			return true;
		}

		this.onRedo.Fire(operation);
		LogControl.instance.addLine(`Redone "${operation.description}"`);
		return true;
	}

	undo() {
		const operation = this._history.pop();
		if (!operation) return false;

		this._redoHistory.push(operation);
		const response = operation.undo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error undoing "${operation.description}": ${response.message}`);
			return true;
		}

		this.onUndo.Fire(operation);
		LogControl.instance.addLine(`Undone "${operation.description}"`);
		return true;
	}
}
