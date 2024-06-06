import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import { InputController } from "client/controller/InputController";
import { Signals } from "client/event/Signals";
import { Gui } from "client/gui/Gui";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import { BlockEditorBase } from "client/tools/additional/BlockEditorBase";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { AABB } from "shared/fixes/AABB";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { SharedPlot } from "shared/building/SharedPlot";

abstract class MoveBase extends BlockEditorBase {
	protected readonly tooltipHolder = this.parent(TooltipsHolder.createComponent("Moving"));

	protected difference: Vector3 = Vector3.zero;
	readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

	constructor(plot: SharedPlot, blocks: readonly BlockModel[]) {
		super(plot, blocks);
		this.onPrepare(() => this.tooltipHolder.set(this.getTooltips()));
	}

	protected moveBlocksTo(difference: Vector3) {
		for (const { instance, origPosition } of this.original) {
			instance.PivotTo(origPosition.add(difference));
		}
	}
}
class DesktopMove extends MoveBase {
	protected initializeHandles() {
		const roundByStep = (number: number) => {
			const step = this.step.get();
			return number - (((number + step / 2) % step) - step / 2);
		};
		const limitMovement = (
			regionSize: Vector3,
			regionPos: Vector3,
			direction: Vector3,
			distance: number,
			bounds: AABB,
		): number => {
			const axes = direction.X !== 0 ? "X" : direction.Y !== 0 ? "Y" : "Z";
			const sign = math.sign(direction[axes]);

			const blockOffsetMin = regionPos[axes] - regionSize[axes] / 2;
			const blockOffsetMax = regionPos[axes] + regionSize[axes] / 2;
			let boundsmin = (bounds.getMin()[axes] - blockOffsetMin) * sign;
			let boundsmax = (bounds.getMax()[axes] - blockOffsetMax) * sign;
			[boundsmin, boundsmax] = [math.min(boundsmin, boundsmax), math.max(boundsmin, boundsmax)];

			return math.clamp(distance, boundsmin, boundsmax);
		};

		const initHandles = (instance: Handles) => {
			let startpos = Vector3.zero;
			let startDifference: Vector3 = Vector3.zero;

			const defaultCameraType = Workspace.CurrentCamera!.CameraType;
			this.event.subscribe(instance.MouseButton1Down, () => {
				startpos = moveHandles.GetPivot().Position;
				startDifference = this.difference;

				if (InputController.inputType.get() === "Touch") {
					Workspace.CurrentCamera!.CameraType = Enum.CameraType.Scriptable;
				}
			});
			this.event.subscribe(instance.MouseButton1Up, async () => {
				Workspace.CurrentCamera!.CameraType = defaultCameraType;
			});

			this.event.subscribe(instance.MouseDrag, (face, distance) => {
				distance = limitMovement(
					aabb.getSize(),
					startpos,
					Vector3.FromNormalId(face),
					distance,
					this.plotBounds,
				);
				distance = roundByStep(distance);

				this.difference = startDifference.add(Vector3.FromNormalId(face).mul(distance));
				if (!this.plotBounds.contains(aabb.withCenter(fullStartPos.add(this.difference)))) {
					return;
				}

				moveHandles.PivotTo(new CFrame(fullStartPos.add(this.difference)));
				this.moveBlocksTo(this.difference);
			});
		};

		const aabb = AABB.fromModels(this.blocks);

		const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
		moveHandles.Size = aabb.getSize().add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
		moveHandles.PivotTo(new CFrame(aabb.getCenter()));
		moveHandles.Parent = Gui.getPlayerGui();

		const fullStartPos: Vector3 = moveHandles.GetPivot().Position;
		initHandles(moveHandles.XHandles);
		initHandles(moveHandles.YHandles);
		initHandles(moveHandles.ZHandles);

		return moveHandles;
	}

	protected getTooltips(): InputTooltips {
		return { Desktop: [{ keys: ["F"], text: "Stop moving" }] };
	}
}
class TouchMove extends DesktopMove {}
class GamepadMove extends MoveBase {
	protected initializeHandles() {
		let direction: "+x" | "-x" | "+z" | "-z" = "+x";

		const initHandles = (instance: MoveHandles) => {
			const tryAddDiff = (diff: Vector3) => {
				if (!this.plotBounds.contains(aabb.withCenter(fullStartPos.add(diff).add(this.difference)))) {
					return;
				}

				this.difference = this.difference.add(diff);
				moveHandles.PivotTo(new CFrame(fullStartPos.add(this.difference)));
				this.moveBlocksTo(this.difference);
			};

			this.event.subInput((ih) => {
				ih.onKeyDown("DPadUp", () => tryAddDiff(new Vector3(0, this.step.get(), 0)));
				ih.onKeyDown("DPadDown", () => tryAddDiff(new Vector3(0, -this.step.get(), 0)));
				ih.onKeyDown("DPadRight", () => tryAddDiff(getMoveDirection(true).mul(this.step.get())));
				ih.onKeyDown("DPadLeft", () => tryAddDiff(getMoveDirection(false).mul(this.step.get())));
			});

			const getMoveDirection = (positive: boolean) => {
				if (direction === "+x") {
					return positive ? Vector3.xAxis : Vector3.xAxis.mul(-1);
				} else if (direction === "-z") {
					return positive ? Vector3.zAxis.mul(-1) : Vector3.zAxis;
				} else if (direction === "+z") {
					return positive ? Vector3.zAxis : Vector3.zAxis.mul(-1);
				} else {
					return positive ? Vector3.xAxis.mul(-1) : Vector3.xAxis;
				}
			};
			const updateCamera = () => {
				const lookvector = Workspace.CurrentCamera!.CFrame.LookVector;
				if (math.abs(lookvector.X) > math.abs(lookvector.Z)) {
					direction = lookvector.X > 0 ? "+z" : "-z";
					instance.XHandles.Visible = false;
					instance.ZHandles.Visible = true;
				} else {
					direction = lookvector.Z > 0 ? "-x" : "+x";
					instance.XHandles.Visible = true;
					instance.ZHandles.Visible = false;
				}
			};
			this.event.subscribe(Signals.CAMERA.MOVED, updateCamera);
			this.onEnable(updateCamera);
		};

		const aabb = AABB.fromModels(this.blocks);

		const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
		moveHandles.Size = aabb.getSize().add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
		moveHandles.PivotTo(new CFrame(aabb.getCenter()));
		moveHandles.Parent = Gui.getPlayerGui();

		const fullStartPos: Vector3 = moveHandles.GetPivot().Position;
		initHandles(moveHandles);

		return moveHandles;
	}

	protected getTooltips(): InputTooltips {
		return {
			Gamepad: [
				{ keys: ["ButtonX"], text: "Stop moving" },

				{ keys: ["DPadUp"], text: "Move up" },
				{ keys: ["DPadDown"], text: "Move down" },
				{ keys: ["DPadLeft"], text: "Move left (based on camera)" },
				{ keys: ["DPadRight"], text: "Move right (based on camera)" },
			],
		};
	}
}

export namespace BlockMover {
	export function create(plot: SharedPlot, blocks: readonly BlockModel[]) {
		return ClientComponentChild.createOnceBasedOnInputType<MoveBase>({
			Desktop: () => new DesktopMove(plot, blocks),
			Touch: () => new TouchMove(plot, blocks),
			Gamepad: () => new GamepadMove(plot, blocks),
		});
	}
}

