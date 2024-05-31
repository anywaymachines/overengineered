import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { EventHandler } from "shared/event/EventHandler";
import { successResponse } from "shared/types/network/Responses";
import type { Tutorial } from "client/tutorial/Tutorial";

@injectable
export class TutorialEditTool {
	constructor(@inject private readonly tutorial: Tutorial) {}

	get() {
		return this.tutorial.buildingMode.toolController.allTools.editTool;
	}

	cleanup() {}

	async waitForMoveToolWork(distance: Vector3): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.register(
				ClientBuilding.moveOperation.addMiddleware((plot, blocks, diff, edit) => {
					if (blocks.size() !== plot.getBlocks().size()) {
						return { success: false, message: "Select the full plot before moving!" };
					}

					if (distance !== diff) {
						return { success: false, message: "Wrong move tutorial offset!" };
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
