import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { EditTool } from "client/tools/EditTool";
import { Tutorial } from "client/tutorial/Tutorial";
import { EventHandler } from "shared/event/EventHandler";
import { successResponse } from "shared/types/network/Responses";

export class TutorialEditTool {
	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.editTool;
	}

	cleanup() {
		this.get().enabledModes.set(EditTool.allModes);
	}

	async waitForMoveToolWork(distance: Vector3): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.register(
				ClientBuilding.moveOperation.addMiddleware((plot, blocks, diff, edit) => {
					if (distance !== diff) {
						return { success: false, message: "Wrong move tutorial offset!" };
					}

					if (blocks.size() !== plot.getBlocks().size()) {
						return { success: false, message: "Select the full plot before moving!" };
					}

					return successResponse;
				}),
			);

			eventHandler.subscribe(ClientBuilding.moveOperation.executed, () => {
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
