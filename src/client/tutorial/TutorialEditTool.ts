import { BuildingMode } from "client/modes/build/BuildingMode";
import { EditTool } from "client/tools/EditTool";
import { Tutorial } from "client/tutorial/Tutorial";
import { EventHandler } from "shared/event/EventHandler";

export class TutorialEditTool {
	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.editTool;
	}

	setPlotMoveOffset(data: Vector3) {
		EditTool.plotMoveOffset = data;
	}

	cleanup() {
		this.get().enabledModes.set(EditTool.allModes);

		EditTool.plotMoveOffset = Vector3.zero;
	}

	async waitForMoveToolWork(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(EditTool.moveDoneSignal, () => {
				eventHandler.unsubscribeAll();
				this.cleanup();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.tutorial.Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.tutorial.Finish();
				resolve(false);
			});
		});
	}
}
