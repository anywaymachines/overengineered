import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import InputController from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import Gui from "client/gui/Gui";
import { InputTooltips, TooltipsHolder } from "client/gui/static/TooltipsControl";
import { SharedPlot } from "shared/building/SharedPlot";
import NumberObservableValue from "shared/event/NumberObservableValue";
import { AABB } from "shared/fixes/AABB";

abstract class RotaterBase extends ClientComponent {
	protected readonly tooltipHolder = this.parent(TooltipsHolder.createComponent("Rotating"));
	protected readonly plot: SharedPlot;
	protected readonly blocks: readonly BlockModel[];
	protected readonly pivots: readonly (readonly [BlockModel, CFrame])[];
	protected readonly plotBounds: AABB;
	protected difference: CFrame = CFrame.identity;
	readonly step = new NumberObservableValue<number>(0, 90, 180, 1);

	constructor(plot: SharedPlot, blocks: readonly BlockModel[]) {
		super();

		this.plot = plot;
		this.blocks = blocks;
		this.plotBounds = plot.bounds;
		this.pivots = blocks.map((p) => [p, p.GetPivot()] as const);

		const moveHandles = this.initializeHandles();
		this.onDisable(async () => moveHandles.Destroy());
		this.onPrepare(() => this.tooltipHolder.set(this.getTooltips()));
	}

	getDifference() {
		return this.difference;
	}

	protected pivotBlocksTo(rotatedCenter: CFrame, fullStartPos: CFrame) {
		for (const [block, startpos] of this.pivots) {
			block.PivotTo(rotatedCenter.ToWorldSpace(fullStartPos.ToObjectSpace(startpos)));
		}
	}

	cancel() {
		this.difference = CFrame.identity;
		this.pivotBlocksTo(CFrame.identity, CFrame.identity);
	}

	protected abstract initializeHandles(): Instance;
	protected abstract getTooltips(): InputTooltips;
}
class DesktopRotater extends RotaterBase {
	protected initializeHandles() {
		const roundByStep = (number: number) => {
			const step = this.step.get();
			return number - (((number + step / 2) % step) - step / 2);
		};

		const initHandles = (instance: ArcHandles) => {
			let startpos = Vector3.zero;
			let startDifference: CFrame = CFrame.identity;

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
				moveHandles.Center.PivotTo(moveHandles.GetPivot());
			});

			this.event.subscribe(instance.MouseDrag, (axis, relativeAngle) => {
				const centerframe = fullStartPos.mul(
					startDifference.mul(CFrame.fromAxisAngle(Vector3.FromAxis(axis), relativeAngle)),
				);
				relativeAngle = math.rad(roundByStep(math.deg(relativeAngle)));

				this.difference = startDifference.mul(CFrame.fromAxisAngle(Vector3.FromAxis(axis), relativeAngle));
				if (!this.plotBounds.contains(aabb.withCenter(fullStartPos.mul(this.difference)))) {
					(moveHandles.WaitForChild("SelectionBox") as SelectionBox).Color3 = Colors.red;
				} else {
					(moveHandles.WaitForChild("SelectionBox") as SelectionBox).Color3 = Colors.green;
				}

				const rotatedCenter = fullStartPos.mul(this.difference);
				moveHandles.PivotTo(rotatedCenter);
				moveHandles.Center.PivotTo(centerframe);

				this.pivotBlocksTo(rotatedCenter, fullStartPos);
			});
		};

		const aabb = AABB.fromModels(this.blocks);

		const moveHandles = ReplicatedStorage.Assets.RotateHandles.Clone();
		moveHandles.Size = aabb.getSize().add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
		moveHandles.Center.Size = moveHandles.Size;
		moveHandles.PivotTo(new CFrame(aabb.getCenter()));
		moveHandles.Parent = Gui.getPlayerGui();

		const fullStartPos = moveHandles.GetPivot();
		initHandles(moveHandles.ArcHandles);

		return moveHandles;
	}

	protected getTooltips(): InputTooltips {
		return { Desktop: [{ keys: ["F"], text: "Stop moving" }] };
	}
}
class TouchRotater extends DesktopRotater {}
class GamepadRotater extends RotaterBase {
	protected initializeHandles() {
		const direction: "+x" | "-x" | "+z" | "-z" = "+x";

		const initHandles = (instance: RotateHandles) => {
			/*const tryAddDiff = (diff: Vector3) => {
				if (!this.plotBounds.contains(aabb.withCenter(fullStartPos.add(diff).add(this.difference)))) {
					return;
				}

				this.difference = this.difference.add(diff);
				moveHandles.PivotTo(new CFrame(fullStartPos.add(this.difference)));
				this.moveBlocksTo(rotatedCenter, fullStartPos);
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
					//instance.XHandles.Visible = false;
					//instance.ZHandles.Visible = true;
				} else {
					direction = lookvector.Z > 0 ? "-x" : "+x";
					//instance.XHandles.Visible = true;
					//instance.ZHandles.Visible = false;
				}
			};
			this.event.subscribe(Signals.CAMERA.MOVED, updateCamera);
			this.onEnable(updateCamera);*/
		};

		const aabb = AABB.fromModels(this.blocks);

		const moveHandles = ReplicatedStorage.Assets.RotateHandles.Clone();
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

export const BlockRotater = {
	create: (plot: SharedPlot, blocks: readonly BlockModel[]) => {
		return ClientComponentChild.createOnceBasedOnInputType<RotaterBase>({
			Desktop: () => new DesktopRotater(plot, blocks),
			Touch: () => new TouchRotater(plot, blocks),
			Gamepad: () => new GamepadRotater(plot, blocks),
		});
	},
} as const;
