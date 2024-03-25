import { Workspace } from "@rbxts/services";
import TutorialControl from "client/gui/static/TutorialControl";
import TutorialCar from "client/tutorial/TutorialCar";
import { blockRegistry } from "shared/Registry";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import EventHandler from "shared/event/EventHandler";
import PartUtils from "shared/utils/PartUtils";

type TutorialType = "Car";

type TutorialPlaceBlockHighlight = {
	id: string;
	cframe: CFrame;
};

export default class Tutorial {
	static Control = new TutorialControl();

	static Cancellable = true;
	static BlocksToPlace: (TutorialPlaceBlockHighlight & { instance: Instance })[] = [];

	static ClearBlocksToPlace() {
		this.BlocksToPlace.forEach((block) => {
			block.instance.Destroy();
		});

		this.BlocksToPlace.clear();
	}

	static async AddBlockToPlace(block: TutorialPlaceBlockHighlight) {
		const model = blockRegistry.get(block.id)!.model.Clone();
		const plot = SharedPlots.getOwnPlot();
		const relativePosition = plot.instance.BuildingArea.CFrame.ToWorldSpace(block.cframe);

		PartUtils.ghostModel(model, Color3.fromRGB(255, 255, 255));
		model.PivotTo(relativePosition);
		model.Parent = Workspace;

		this.BlocksToPlace.push({ ...block, instance: model });
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
				this.Control.finish();
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
				this.Control.finish();
				resolve(false);
			});
		});
	}

	static Begin(tutorial: TutorialType) {
		switch (tutorial) {
			case "Car":
				TutorialCar(this);
				break;

			default:
				break;
		}
	}
}
