import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import { InputController } from "client/controller/InputController";
import { Signals } from "client/event/Signals";
import { Gui } from "client/gui/Gui";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import { BlockEditorBase } from "client/tools/additional/BlockEditorBase";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { BB } from "shared/fixes/BB";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { SharedPlot } from "shared/building/SharedPlot";

abstract class MoveBase extends BlockEditorBase {
	protected readonly tooltipHolder = this.parent(TooltipsHolder.createComponent("Moving"));

	protected difference: Vector3 = Vector3.zero;
	readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

	constructor(mode: BuildingMode, plot: SharedPlot, blocks: readonly BlockModel[]) {
		super(mode, plot, blocks);
		this.onPrepare(() => this.tooltipHolder.set(this.getTooltips()));
	}

	protected moveBlocksTo(difference: Vector3) {
		for (const { instance, origPosition } of this.original) {
			instance.PivotTo(origPosition.add(difference));
		}
	}

	protected createMoveHandles() {
		const boundingBox = BB.fromModels(
			this.blocks,
			this.mode.editMode.get() === "global" ? CFrame.identity : undefined,
		);

		const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
		moveHandles.PivotTo(boundingBox.center);
		moveHandles.Size = boundingBox.originalSize.add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
		moveHandles.Parent = Gui.getPlayerGui();

		return $tuple(moveHandles, boundingBox);
	}
}
class DesktopMove extends MoveBase {
	protected initializeHandles() {
		const roundByStep = (number: number) => {
			const step = this.step.get();
			return number - (((number + step / 2) % step) - step / 2);
		};
		const limitMovement = (region: BB, direction: Vector3, distance: number, bounds: BB) => {
			const localToBoundsRegion = region.withCenter((c) => bounds.center.ToObjectSpace(c));

			const boundsMin = bounds.center.Position.sub(
				bounds.originalSize.sub(localToBoundsRegion.getRotatedSize()).div(2),
			);
			const boundsMax = bounds.center.Position.add(
				bounds.originalSize.sub(localToBoundsRegion.getRotatedSize()).div(2),
			);

			const minmax = (v1: number, v2: number) => $tuple(math.min(v1, v2), math.max(v1, v2));
			const closestToZero = (v1: number, v2: number) => (math.abs(v1) < math.abs(v2) ? v1 : v2);

			const [sizeMinX, sizeMaxX] = minmax(
				(boundsMin.X - region.center.X) / direction.X,
				(boundsMax.X - region.center.X) / direction.X,
			);
			const [sizeMinY, sizeMaxY] = minmax(
				(boundsMin.Y - region.center.Y) / direction.Y,
				(boundsMax.Y - region.center.Y) / direction.Y,
			);
			const [sizeMinZ, sizeMaxZ] = minmax(
				(boundsMin.Z - region.center.Z) / direction.Z,
				(boundsMax.Z - region.center.Z) / direction.Z,
			);

			const min = closestToZero(closestToZero(sizeMinX, sizeMinY), sizeMinZ);
			const max = closestToZero(closestToZero(sizeMaxX, sizeMaxY), sizeMaxZ);

			if (distance < min) return $tuple(min, true);
			if (distance > max) return $tuple(max, true);
			return $tuple(distance, false);
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

				let wasClamped: boolean;
				[distance, wasClamped] = limitMovement(
					boundingBox.withCenter((c) => c.Rotation.add(startpos)),
					globalDirection,
					distance,
					this.plotBounds,
				);
				if (this.mode.gridEnabled.get()) {
					const roundedDistance = roundByStep(distance);

					if (
						this.plotBounds.isBBInside(
							boundingBox.withCenter((c) =>
								c.Rotation.add(
									fullStartPos.add(startDifference.add(globalDirection.mul(roundedDistance))),
								),
							),
						)
					) {
						distance = roundedDistance;
					}
				}

				this.difference = startDifference.add(globalDirection.mul(distance));
				moveHandles.PivotTo(boundingBox.center.Rotation.add(fullStartPos.add(this.difference)));
				this.moveBlocksTo(this.difference);
			});
		};

		const [moveHandles, boundingBox] = this.createMoveHandles();
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
				if (
					!this.plotBounds.isBBInside(
						boundingBox.withCenter((c) => c.Rotation.add(fullStartPos.add(diff).add(this.difference))),
					)
				) {
					return;
				}

				this.difference = this.difference.add(diff);
				moveHandles.PivotTo(boundingBox.center.Rotation.add(fullStartPos.add(this.difference)));
				this.moveBlocksTo(this.difference);
			};

			this.event.subInput((ih) => {
				ih.onKeyDown("DPadUp", () =>
					tryAddDiff(boundingBox.center.VectorToWorldSpace(new Vector3(0, this.step.get(), 0))),
				);
				ih.onKeyDown("DPadDown", () =>
					tryAddDiff(boundingBox.center.VectorToWorldSpace(new Vector3(0, -this.step.get(), 0))),
				);
				ih.onKeyDown("DPadRight", () =>
					tryAddDiff(boundingBox.center.VectorToWorldSpace(getMoveDirection(true).mul(this.step.get()))),
				);
				ih.onKeyDown("DPadLeft", () =>
					tryAddDiff(boundingBox.center.VectorToWorldSpace(getMoveDirection(false).mul(this.step.get()))),
				);
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

		const [moveHandles, boundingBox] = this.createMoveHandles();
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
