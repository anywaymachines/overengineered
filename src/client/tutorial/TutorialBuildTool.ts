import { Workspace } from "@rbxts/services";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { Tutorial } from "client/tutorial/Tutorial";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { EventHandler } from "shared/event/EventHandler";
import { PartUtils } from "shared/utils/PartUtils";

export class TutorialBuildTool {
	constructor(private readonly tutorial: typeof Tutorial) {}

	get() {
		return BuildingMode.instance.toolController.buildTool;
	}

	cleanup() {
		this.get().tutorialBlocksToPlace.forEach((block) => {
			block.instance.Destroy();
		});

		this.get().tutorialBlocksToPlace = [];
	}

	addBlockToPlace(data: TutorialPlaceBlockHighlight) {
		const model = BlocksInitializer.blocks.map.get(data.id)!.model.Clone();
		const plot = SharedPlots.getOwnPlot();
		const relativePosition = plot.instance.BuildingArea.CFrame.ToWorldSpace(data.cframe);

		PartUtils.ghostModel(model, Color3.fromRGB(255, 255, 255));
		model.PivotTo(relativePosition);
		model.Parent = Workspace;

		this.get().tutorialBlocksToPlace.push({ ...data, instance: model });
	}

	async waitForBlocksToPlace(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(plot.instance.Blocks.ChildAdded, () => {
				for (const blockToPlace of this.get().tutorialBlocksToPlace ?? []) {
					if (
						!BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.ToWorldSpace(blockToPlace.cframe).Position,
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
