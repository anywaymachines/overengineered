import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import { InputController } from "client/controller/InputController";
import { Signals } from "client/event/Signals";
import { Gui } from "client/gui/Gui";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import { BlockEditorBase } from "client/tools/additional/BlockEditorBase";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { AABB } from "shared/fixes/AABB";
import { BB } from "shared/fixes/BB";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { SharedPlot } from "shared/building/SharedPlot";

abstract class MoveBase extends BlockEditorBase {
	protected readonly tooltipHolder = this.parent(TooltipsHolder.createComponent("Moving"));

	protected difference: Vector3 = Vector3.zero;
	readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

	constructor(
		protected readonly mode: BuildingMode,
		plot: SharedPlot,
		blocks: readonly BlockModel[],
	) {
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
			region: BB,
			regionPos: Vector3,
			direction: Vector3,
			distance: number,
			bounds: BB,
		): number => {
			if (true as boolean) return distance;

			function calculateDistanceToBounds(
				movingAABBCenter: Vector3,
				movingAABBSize: Vector3,
				boundsCenter: Vector3,
				boundsSize: Vector3,
				direction: Vector3,
			): number {
				// Calculate half-extents of both AABBs
				const movingAABBHalfExtents = movingAABBSize.div(2);
				const boundsHalfExtents = boundsSize.div(2);

				// Project both AABBs onto the direction vector
				const movingAABBMin = direction.Dot(movingAABBCenter.sub(movingAABBHalfExtents));
				const movingAABBMax = direction.Dot(movingAABBCenter.add(movingAABBHalfExtents));
				const boundsMin = direction.Dot(boundsCenter.sub(boundsHalfExtents));
				const boundsMax = direction.Dot(boundsCenter.add(boundsHalfExtents));

				print({
					movingAABBMin,
					movingAABBMax,
					boundsMin,
					boundsMax,
				});

				// Calculate the distance between the two projected intervals
				return math.max(boundsMin - movingAABBMax, movingAABBMin - boundsMax, 0);
			}

			const localToBoundsDirection = bounds.center.VectorToObjectSpace(
				region.center.VectorToWorldSpace(direction),
			);
			const localToBoundsRegion = region.withCenter((c) => bounds.center.ToObjectSpace(c));

			const targetSize = direction.apply(math.sign).mul(bounds.originalSize);
			const diff = bounds.center.Position.sub(targetSize).apply(math.abs);
			print({ targetSize, diff });

			const localToBoundsSizeHalf = localToBoundsRegion.getRotatedSize().div(2);
			const xyz = region.center.add(
				new Vector3(
					math.sign(localToBoundsDirection.X) * localToBoundsSizeHalf.X,
					math.sign(localToBoundsDirection.Y) * localToBoundsSizeHalf.Y,
					math.sign(localToBoundsDirection.Z) * localToBoundsSizeHalf.Z,
				),
			);

			return math.min(
				distance,
				calculateDistanceToBounds(
					localToBoundsRegion.center.Position,
					localToBoundsRegion.getRotatedSize(),
					bounds.center.Position,
					bounds.originalSize,
					localToBoundsDirection,
				),
			);
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
				const globalDirection = boundingBox.center.Rotation.mul(Vector3.FromNormalId(face));

				distance = limitMovement(boundingBox, startpos, globalDirection, distance, this.plotBoundsb);
				if (this.mode.gridEnabled.get()) {
					distance = roundByStep(distance);
				}

				this.difference = startDifference.add(globalDirection.mul(distance));
				moveHandles.PivotTo(boundingBox.center.Rotation.add(fullStartPos.add(this.difference)));
				this.moveBlocksTo(this.difference);
			});
		};

		const boundingBox = BB.fromModels(this.blocks);

		const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
		moveHandles.PivotTo(boundingBox.center);
		moveHandles.Size = boundingBox.originalSize.add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
		moveHandles.Parent = Gui.getPlayerGui();

		const fullStartPos: Vector3 = moveHandles.GetPivot().Position;
		initHandles(moveHandles.XHandles);
		initHandles(moveHandles.YHandles);
		initHandles(moveHandles.ZHandles);

		return moveHandles;
	}

	protected getTooltips(): InputTooltips {
		return {
			Desktop: [
				{ keys: ["F"], text: "Stop moving" },
				{ keys: ["LeftControl"], text: "Disable grid" },
			],
		};
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
	export function create(mode: BuildingMode, plot: SharedPlot, blocks: readonly BlockModel[]) {
		return ClientComponentChild.createOnceBasedOnInputType<MoveBase>({
			Desktop: () => new DesktopMove(mode, plot, blocks),
			Touch: () => new TouchMove(mode, plot, blocks),
			Gamepad: () => new GamepadMove(mode, plot, blocks),
		});
	}
}
