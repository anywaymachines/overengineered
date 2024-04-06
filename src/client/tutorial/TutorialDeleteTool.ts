import { BuildingMode } from "client/modes/build/BuildingMode";
import { Tutorial } from "client/tutorial/Tutorial";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { EventHandler } from "shared/event/EventHandler";

export type TutorialDeleteBlockHighlight = {
	position: Vector3;
};

export class TutorialDeleteTool {
	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.deleteTool;
	}

	cleanup() {
		this.get().tutorialBlocksToRemove.forEach((block) => {
			block.instance.Destroy();
		});

		this.get().tutorialBlocksToRemove = [];
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

		this.get().tutorialBlocksToRemove.push({ ...data, instance: selectionBox });
	}

	async waitForBlocksToDelete(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(plot.instance.Blocks.ChildRemoved, () => {
				for (const blockToPlace of this.get().tutorialBlocksToRemove ?? []) {
					if (
						BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.PointToWorldSpace(blockToPlace.position),
						)
					) {
						return;
					}
				}

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
