import { Workspace } from "@rbxts/services";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { EventHandler } from "shared/event/EventHandler";
import { successResponse } from "shared/types/network/Responses";
import { PartUtils } from "shared/utils/PartUtils";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { Tutorial } from "client/tutorial/Tutorial";
import type { BlockRegistry } from "shared/block/BlockRegistry";

export type TutorialPlaceBlockHighlight = {
	id: BlockId;
	cframe: CFrame;
};

@injectable
export class TutorialBuildTool {
	private readonly tutorialBlocksToPlace: (TutorialPlaceBlockHighlight & { readonly instance: Instance })[] = [];

	constructor(
		@inject private readonly tutorial: Tutorial,
		@inject private readonly blockRegistry: BlockRegistry,
	) {}

	cleanup() {
		this.tutorialBlocksToPlace.forEach((block) => {
			block.instance.Destroy();
		});

		this.tutorialBlocksToPlace.clear();
	}

	addBlockToPlace(data: TutorialPlaceBlockHighlight) {
		const model = this.blockRegistry.blocks.get(data.id)!.model.Clone();
		const plot = SharedPlots.getOwnPlot();
		const relativePosition = plot.instance.BuildingArea.CFrame.ToWorldSpace(data.cframe);

		PartUtils.ghostModel(model, Color3.fromRGB(255, 255, 255));
		model.PivotTo(relativePosition);
		model.Parent = Workspace;

		this.tutorialBlocksToPlace.push({ ...data, instance: model });
	}

	async waitForBlocksToPlace(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.register(
				ClientBuilding.placeOperation.addMiddleware((plot, blocks, edit) => {
					const block = blocks
						.map((block) => {
							const btp = this.tutorialBlocksToPlace.find(
								(value) =>
									value.id === block.id &&
									VectorUtils.roundVector3(value.cframe.Position) ===
										VectorUtils.roundVector3(
											plot.instance.BuildingArea.CFrame.ToObjectSpace(block!.location).Position,
										),
							);

							if (!btp) return [] as const;
							return [block, btp] as const;
						})
						.find((b) => b.size() !== 0) as [(typeof blocks)[0], TutorialPlaceBlockHighlight] | undefined;

					if (!block) {
						return { success: false, message: "Invalid placement" };
					}

					edit[1] = [
						{
							...block[0],
							location: plot.instance.BuildingArea.CFrame.ToWorldSpace(block[1].cframe),
						},
					];
					return successResponse;
				}),
			);

			ClientBuilding.placeOperation.executed.Connect((plot, blocks) => {
				for (const blockToPlace of this.tutorialBlocksToPlace ?? []) {
					if (
						!BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.ToWorldSpace(blockToPlace.cframe).Position,
						)
					) {
						return;
					}
				}

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
