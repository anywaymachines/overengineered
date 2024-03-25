import { Workspace } from "@rbxts/services";
import TutorialControl from "client/gui/static/TutorialControl";
import TutorialBasics from "client/tutorial/TutorialBasics";
import { blockRegistry } from "shared/Registry";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import EventHandler from "shared/event/EventHandler";
import PartUtils from "shared/utils/PartUtils";

type TutorialType = "Basics";

type TutorialPlaceBlockHighlight = {
	id: string;
	cframe: CFrame;
};

type TutorialDeleteBlockHighlight = {
	position: Vector3;
};

export default class Tutorial {
	static Control = new TutorialControl();
	static Cancellable = true;

	static BlocksToPlace: (TutorialPlaceBlockHighlight & { instance: Instance })[] = [];
	static BlocksToRemove: (TutorialDeleteBlockHighlight & { instance: Instance })[] = [];

	static ClearBlocksToRemove() {
		this.BlocksToRemove.forEach((block) => {
			block.instance.Destroy();
		});

		this.BlocksToRemove.clear();
	}

	static ClearBlocksToPlace() {
		this.BlocksToPlace.forEach((block) => {
			block.instance.Destroy();
		});

		this.BlocksToPlace.clear();
	}

	static AddBlockToRemove(data: TutorialDeleteBlockHighlight) {
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

		this.BlocksToRemove.push({ ...data, instance: selectionBox });
	}

	static AddBlockToPlace(data: TutorialPlaceBlockHighlight) {
		const model = blockRegistry.get(data.id)!.model.Clone();
		const plot = SharedPlots.getOwnPlot();
		const relativePosition = plot.instance.BuildingArea.CFrame.ToWorldSpace(data.cframe);

		PartUtils.ghostModel(model, Color3.fromRGB(255, 255, 255));
		model.PivotTo(relativePosition);
		model.Parent = Workspace;

		this.BlocksToPlace.push({ ...data, instance: model });
	}

	static async WaitForNextButtonPress(): Promise<boolean> {
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribeOnce(this.Control.getGui().Header.Next.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				resolve(true);
			});

			eventHandler.subscribeOnce(this.Control.getGui().Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.Finish();
				resolve(false);
			});
		});
	}

	static async WaitForBlocksToPlace(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(plot.instance.Blocks.ChildAdded, () => {
				for (const blockToPlace of this.BlocksToPlace) {
					if (
						!BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.ToWorldSpace(blockToPlace.cframe).Position,
						)
					) {
						return;
					}
				}

				resolve(true);
			});

			eventHandler.subscribeOnce(this.Control.getGui().Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.Finish();
				resolve(false);
			});
		});
	}

	static async WaitForBlocksToRemove(): Promise<boolean> {
		const plot = SharedPlots.getOwnPlot();
		return new Promise((resolve) => {
			const eventHandler = new EventHandler();

			eventHandler.subscribe(plot.instance.Blocks.ChildRemoved, () => {
				for (const blockToPlace of this.BlocksToRemove) {
					if (
						BuildingManager.getBlockByPosition(
							plot.instance.BuildingArea.CFrame.PointToWorldSpace(blockToPlace.position),
						)
					) {
						return;
					}
				}

				resolve(true);
			});

			eventHandler.subscribeOnce(this.Control.getGui().Header.Cancel.MouseButton1Click, () => {
				eventHandler.unsubscribeAll();
				this.Finish();
				resolve(false);
			});
		});
	}

	/** Starts the tutorial scenery */
	static Begin(tutorial: TutorialType) {
		switch (tutorial) {
			case "Basics":
				TutorialBasics(this);
				break;

			default:
				break;
		}
	}

	/** Ends the tutorial */
	static Finish() {
		this.ClearBlocksToRemove();
		this.ClearBlocksToPlace();

		this.Control.finish();
	}
}
