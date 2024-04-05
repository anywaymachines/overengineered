import { Workspace } from "@rbxts/services";
import { TutorialControl } from "client/gui/static/TutorialControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { EventHandler } from "shared/event/EventHandler";
import { PartUtils } from "shared/utils/PartUtils";

type TutorialType = "Basics";

declare global {
	type TutorialPlaceBlockHighlight = {
		id: string;
		cframe: CFrame;
	};

	type TutorialDeleteBlockHighlight = {
		position: Vector3;
	};
}

export namespace Tutorial {
	export const Control = new TutorialControl();
	export const Cancellable = true;

	function getBuildTool() {
		return BuildingMode.instance.toolController.buildTool;
	}

	function getDeleteTool() {
		return BuildingMode.instance.toolController.deleteTool;
	}

	function ClearBlocksToRemove() {
		getDeleteTool().tutorialBlocksToRemove.forEach((block) => {
			block.instance.Destroy();
		});

		getDeleteTool().tutorialBlocksToRemove = [];
	}

	function ClearBlocksToPlace() {
		getBuildTool().tutorialBlocksToPlace.forEach((block) => {
			block.instance.Destroy();
		});

		getBuildTool().tutorialBlocksToPlace = [];
	}

	export function AddBlockToRemove(data: TutorialDeleteBlockHighlight) {
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

		getDeleteTool().tutorialBlocksToRemove.push({ ...data, instance: selectionBox });
	}

	export function AddBlockToPlace(data: TutorialPlaceBlockHighlight) {
		const model = BlocksInitializer.blocks.map.get(data.id)!.model.Clone();
		const plot = SharedPlots.getOwnPlot();
		const relativePosition = plot.instance.BuildingArea.CFrame.ToWorldSpace(data.cframe);

		PartUtils.ghostModel(model, Color3.fromRGB(255, 255, 255));
		model.PivotTo(relativePosition);
		model.Parent = Workspace;

		getBuildTool().tutorialBlocksToPlace.push({ ...data, instance: model });
	}

	export async function WaitForNextButtonPress(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribeOnce(Control.instance.Header.Next.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				resolve(true);
			});

			eventHandler.subscribeOnce(Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				Finish();
				resolve(false);
			});
		});
	}

	export async function WaitForBlocksToPlace(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(plot.instance.Blocks.ChildAdded, () => {
				for (const blockToPlace of getBuildTool().tutorialBlocksToPlace ?? []) {
					if (
						!BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.ToWorldSpace(blockToPlace.cframe).Position,
						)
					) {
						return;
					}
				}

				ClearBlocksToPlace();
				resolve(true);
			});

			eventHandler.subscribeOnce(Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				Finish();
				resolve(false);
			});
		});
	}

	export async function WaitForBlocksToRemove(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(plot.instance.Blocks.ChildRemoved, () => {
				for (const blockToPlace of getDeleteTool().tutorialBlocksToRemove ?? []) {
					if (
						BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.PointToWorldSpace(blockToPlace.position),
						)
					) {
						return;
					}
				}

				ClearBlocksToRemove();
				resolve(true);
			});

			eventHandler.subscribeOnce(Control.instance.Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				Finish();
				resolve(false);
			});
		});
	}

	/** Starts the tutorial scenery */
	export function Begin(tutorial: TutorialType) {
		switch (tutorial) {
			case "Basics":
				TutorialBasics(Tutorial);
				break;

			default:
				break;
		}
	}

	/** Ends the tutorial */
	export function Finish() {
		ClearBlocksToRemove();
		ClearBlocksToPlace();

		BuildingMode.instance.toolController.disabledTools.set([]);

		Control.finish();
	}
}
