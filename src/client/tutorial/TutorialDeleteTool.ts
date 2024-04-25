import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { Tutorial } from "client/tutorial/Tutorial";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { EventHandler } from "shared/event/EventHandler";
import { successResponse } from "shared/types/network/Responses";

export type TutorialDeleteBlockHighlight = {
	position: Vector3;
};

export class TutorialDeleteTool {
	private readonly tutorialBlocksToRemove: (TutorialDeleteBlockHighlight & { readonly instance: Instance })[] = [];

	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.deleteTool;
	}

	cleanup() {
		this.tutorialBlocksToRemove.forEach((block) => {
			block.instance.Destroy();
		});

		this.tutorialBlocksToRemove.clear();
	}

	addBlockToDelete(data: TutorialDeleteBlockHighlight) {
		const plot = SharedPlots.getOwnPlot();
		const worldPosition = plot.instance.BuildingArea.CFrame.PointToWorldSpace(data.position);
		const block = BuildingManager.getBlockByPosition(worldPosition)!;

		const selectionBox = new Instance("SelectionBox");
		selectionBox.Adornee = block;
		selectionBox.Color3 = Color3.fromRGB(255);
		selectionBox.SurfaceTransparency = 1;
		selectionBox.Transparency = 0;
		selectionBox.LineThickness = 0.05;
		selectionBox.Parent = block;

		this.tutorialBlocksToRemove.push({ ...data, instance: selectionBox });
	}

	async waitForBlocksToDelete(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.register(
				ClientBuilding.deleteOperation.addMiddleware((plot, blocks) => {
					if (blocks === "all") {
						return { success: false, message: "Do not delete everything" };
					}

					if (
						blocks.any(
							(value) =>
								!this.tutorialBlocksToRemove!.find(
									(value2) =>
										plot.instance.BuildingArea.CFrame.PointToObjectSpace(
											value.GetPivot().Position,
										) === value2.position,
								),
						)
					) {
						return { success: false, message: "Wrong block" };
					}

					return successResponse;
				}),
			);

			eventHandler.subscribe(ClientBuilding.deleteOperation.executed, (plot, blocks) => {
				for (const blockToPlace of this.tutorialBlocksToRemove ?? []) {
					if (
						BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.PointToWorldSpace(blockToPlace.position),
						)
					) {
						return;
					}
				}

				this.cleanup();
				eventHandler.unsubscribeAll();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.tutorial.Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.cleanup();
				this.tutorial.Finish();
				resolve(false);
			});
		});
	}
}
