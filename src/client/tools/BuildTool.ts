import { Players, ReplicatedStorage, RunService, UserInputService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import { InputController } from "client/controller/InputController";
import { SoundController } from "client/controller/SoundController";
import { Signals } from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { DebugLog } from "client/gui/DebugLog";
import { Gui } from "client/gui/Gui";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { BlockPreviewControl } from "client/gui/buildmode/BlockPreviewControl";
import { BlockSelectionControl, BlockSelectionControlDefinition } from "client/gui/buildmode/BlockSelection";
import {
	MaterialColorEditControl,
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import { MirrorEditorControl, MirrorEditorControlDefinition } from "client/gui/buildmode/MirrorEditorControl";
import { ButtonControl } from "client/gui/controls/Button";
import { LogControl } from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { BlockMirrorer } from "client/tools/additional/BlockMirrorer";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Element } from "shared/Element";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { TransformService } from "shared/component/TransformService";
import { ObservableValue } from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import { VectorUtils } from "shared/utils/VectorUtils";

const allowedColor = Colors.blue;
const forbiddenColor = Colors.red;
const mouse = Players.LocalPlayer.GetMouse();

const createBlockGhost = (block: RegistryBlock): Model => {
	const model = block.model.Clone();
	BlockGhoster.ghostModel(model);

	// build tool 1 part coloring via transparency instead of highlighter
	// PartUtils.switchDescendantsMaterial(this.previewBlock, this.selectedMaterial.get());
	// PartUtils.switchDescendantsColor(this.previewBlock, this.selectedColor.get());

	return model;
};

const getMouseTargetBlockPositionV2 = (
	block: RegistryBlock,
	rotation: CFrame,
	info?: [target: BasePart, hit: CFrame, surface: Enum.NormalId],
): Vector3 | undefined => {
	const constrainPositionToGrid = (selectedBlock: RegistryBlock, normal: Vector3, pos: Vector3) => {
		const from = (coord: number, size: number) => {
			const offset = (size % 2) / 2;

			coord -= offset;
			const pos = math.round(coord);
			return pos + offset;
		};

		const size = AABB.fromModel(selectedBlock.model, rotation).getSize();

		return new Vector3(
			normal.X === 0 ? from(pos.X, size.X) : pos.X,
			normal.Y === 0 ? from(pos.Y, size.Y) : pos.Y,
			normal.Z === 0 ? from(pos.Z, size.Z) : pos.Z,
		);
	};
	const addTargetSize = (target: BasePart, normal: Vector3, pos: Vector3) => {
		let position: Vector3;
		let size: Vector3;

		const block = BlockManager.tryGetBlockModelByPart(target);
		if (block) {
			position = block.GetPivot().Position;
			size = AABB.fromModel(block).getSize();
		} else {
			position = target.Position;
			size = AABB.fromPart(target).getSize();
		}

		return pos.sub(pos.sub(position).mul(VectorUtils.apply(normal, math.abs))).add(size.div(2).mul(normal));
	};
	const offsetBlockPivotToCenter = (selectedBlock: RegistryBlock, pos: Vector3) => {
		const pivot = selectedBlock.model.GetPivot().Position;
		const center = AABB.fromModel(selectedBlock.model).getCenter();
		const offset = rotation.mul(center.sub(pivot));

		return pos.sub(offset);
	};
	const addBlockSize = (selectedBlock: RegistryBlock, normal: Vector3, pos: Vector3) => {
		return pos.add(AABB.fromModel(selectedBlock.model, rotation).getSize().mul(normal).div(2));
	};

	const target = info?.[0] ?? mouse.Target;
	if (!target) return;

	const mouseHit = info?.[1] ?? mouse.Hit;
	const mouseSurface = info?.[2] ?? mouse.TargetSurface;

	const globalMouseHitPos = mouseHit.PointToWorldSpace(Vector3.zero);
	const normal = target.CFrame.Rotation.VectorToWorldSpace(Vector3.FromNormalId(mouseSurface));

	DebugLog.category("BuildTool");
	DebugLog.named("Target", target);
	DebugLog.named("Hit", mouseHit);
	DebugLog.named("Normal", `${mouseSurface} ${normal}`);
	DebugLog.endCategory();

	let targetPosition = globalMouseHitPos;
	targetPosition = addTargetSize(target, normal, targetPosition);
	targetPosition = offsetBlockPivotToCenter(block, targetPosition);
	targetPosition = addBlockSize(block, normal, targetPosition);
	targetPosition = constrainPositionToGrid(block, normal, targetPosition);

	return targetPosition;
};
const getMouseTargetBlockPosition = getMouseTargetBlockPositionV2;

const processPlaceResponse = (response: Response) => {
	if (response?.success) {
		SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
		SoundController.getSounds().Build.BlockPlace.Play();

		task.wait();
	} else {
		if (response) {
			LogControl.instance.addLine(response.message, Colors.red);
		}

		SoundController.getSounds().Build.BlockPlaceError.Play();
	}
};

namespace Scene {
	export type BuildToolSceneDefinition = GuiObject & {
		readonly ActionBar: GuiObject & {
			readonly Buttons: GuiObject & {
				readonly Mirror: GuiButton;
			};
		};
		readonly Mirror: GuiObject & {
			readonly Content: MirrorEditorControlDefinition;
		};
		readonly Bottom: MaterialColorEditControlDefinition;
		readonly Info: Frame & {
			readonly ViewportFrame: ViewportFrame;
			readonly DescriptionLabel: TextLabel;
			readonly NameLabel: TextLabel;
		};
		readonly Inventory: BlockSelectionControlDefinition;
		readonly Touch: Frame & {
			readonly PlaceButton: GuiButton;
			readonly MultiPlaceButton: GuiButton;
			readonly RotateRButton: GuiButton;
			readonly RotateTButton: GuiButton;
			readonly RotateYButton: GuiButton;
		};
	};

	export class BuildToolScene extends Control<BuildToolSceneDefinition> {
		readonly tool;
		readonly blockSelector;
		private readonly blockInfoPreviewControl: BlockPreviewControl;

		constructor(gui: BuildToolSceneDefinition, tool: BuildTool) {
			super(gui);
			this.tool = tool;

			this.blockSelector = new BlockSelectionControl(gui.Inventory);
			this.blockSelector.show();
			this.add(this.blockSelector);

			const mirrorEditor = this.add(new MirrorEditorControl(this.gui.Mirror.Content));
			this.event.subscribeObservable(tool.mirrorMode, (val) => mirrorEditor.value.set(val), true);
			this.event.subscribe(mirrorEditor.submitted, (val) => tool.mirrorMode.set(val));

			this.onEnable(() => (this.gui.Mirror.Visible = false));
			this.add(
				new ButtonControl(
					this.gui.ActionBar.Buttons.Mirror,
					() => (this.gui.Mirror.Visible = !this.gui.Mirror.Visible),
				),
			);

			this.blockInfoPreviewControl = this.add(new BlockPreviewControl(this.gui.Info.ViewportFrame));
			this.event.subscribeObservable(
				this.blockSelector.selectedBlock,
				(block) => {
					this.gui.Info.Visible = block !== undefined;
					this.blockInfoPreviewControl.set(block?.model);
					this.tool.selectedBlock.set(block);

					if (block) {
						this.gui.Info.NameLabel.Text = block.displayName;
						this.gui.Info.DescriptionLabel.Text = block.info;

						GuiAnimator.transition(this.gui.Info, 0.2, "right");
					} else {
						this.gui.Info.NameLabel.Text = "";
						this.gui.Info.DescriptionLabel.Text = "";
					}
				},
				true,
			);

			{
				const enable = () => {
					// to not place a block
					task.wait();

					this.tool.enable();
				};
				const disable = () => {
					this.tool.disable();
				};
				const materialColorEditor = this.add(
					new MaterialColorEditControl(this.gui.Bottom, tool.selectedMaterial, tool.selectedColor),
				);
				materialColorEditor.materialPipette.onStart.Connect(disable);
				materialColorEditor.materialPipette.onEnd.Connect(enable);
				materialColorEditor.colorPipette.onStart.Connect(disable);
				materialColorEditor.colorPipette.onEnd.Connect(enable);
				this.blockSelector.pipette.onStart.Connect(disable);
				this.blockSelector.pipette.onEnd.Connect(enable);
			}

			const updateTouchControls = () => {
				const visible =
					InputController.inputType.get() === "Touch" && this.blockSelector.selectedBlock.get() !== undefined;
				this.gui.Touch.Visible = visible;

				if (visible) {
					GuiAnimator.transition(this.gui.Touch, 0.2, "left");
				}
			};
			const updateSelectedBlock = () => {
				const block = tool.selectedBlock.get();
				if (!block) {
					this.blockSelector.selectedBlock.set(undefined);
					return;
				}

				const targetCategory = BlocksInitializer.categories.getCategoryPath(block.category) ?? [];

				if (
					this.blockSelector.selectedCategory.get()[this.blockSelector.selectedCategory.get().size() - 1] !==
					targetCategory[targetCategory.size() - 1]
				) {
					this.blockSelector.selectedCategory.set(targetCategory);
				}

				this.blockSelector.selectedBlock.set(block);
			};

			this.event.onPrepare(updateTouchControls);
			this.event.subscribeObservable(tool.selectedBlock, updateTouchControls);
			this.event.subscribeObservable(tool.selectedBlock, updateSelectedBlock);
			updateTouchControls();
		}

		protected prepareTouch(): void {
			// Touchscreen controls
			this.eventHandler.subscribe(this.gui.Touch.PlaceButton.MouseButton1Click, () => this.tool.placeBlock());
			this.eventHandler.subscribe(this.gui.Touch.MultiPlaceButton.MouseButton1Click, () =>
				this.tool.multiPlaceBlock(),
			);
			this.eventHandler.subscribe(this.gui.Touch.RotateRButton.MouseButton1Click, () =>
				this.tool.rotateBlock("x", true),
			);
			this.eventHandler.subscribe(this.gui.Touch.RotateTButton.MouseButton1Click, () =>
				this.tool.rotateBlock("y", true),
			);
			this.eventHandler.subscribe(this.gui.Touch.RotateYButton.MouseButton1Click, () =>
				this.tool.rotateBlock("z", true),
			);
		}

		private readonly visibilityStateMachine = TransformService.multi(
			TransformService.boolStateMachine(
				this.gui.Inventory,
				TransformService.commonProps.quadOut02,
				{ AnchorPoint: this.gui.Inventory.AnchorPoint },
				{ AnchorPoint: new Vector2(1.2, this.gui.Inventory.AnchorPoint.Y) },
			),
			TransformService.boolStateMachine(
				this.gui.Bottom,
				TransformService.commonProps.quadOut02,
				{ Position: this.gui.Bottom.Position },
				{ Position: this.gui.Bottom.Position.add(new UDim2(0, 0, 0, 40)) },
				(tr, enabled) => (enabled ? tr.func(() => super.setInstanceVisibilityFunction(true)) : 0),
				(tr, enabled) => (enabled ? 0 : tr.func(() => super.setInstanceVisibilityFunction(false))),
			),
			TransformService.boolStateMachine(
				this.gui.ActionBar,
				TransformService.commonProps.quadOut02,
				{ AnchorPoint: this.gui.ActionBar.AnchorPoint },
				{ AnchorPoint: new Vector2(0.5, 1) },
				(tr, enabled) => (enabled ? tr.func(() => super.setInstanceVisibilityFunction(true)) : 0),
				(tr, enabled) => (enabled ? 0 : tr.func(() => super.setInstanceVisibilityFunction(false))),
			),
		);
		protected setInstanceVisibilityFunction(visible: boolean): void {
			this.visibilityStateMachine(visible);
		}
	}
}

interface IController extends IComponent {
	rotate(axis: "x" | "y" | "z", inverted?: boolean): void;
	place(): Promise<unknown>;
}
namespace SinglePlaceController {
	abstract class Controller extends ClientComponent implements IController {
		protected readonly state: BuildTool;

		private mainGhost?: Model;
		protected readonly blockRotation;
		protected readonly selectedBlock;
		protected readonly selectedColor;
		protected readonly selectedMaterial;
		protected readonly mirrorMode;
		protected readonly plot;
		protected readonly blockMirrorer;

		constructor(state: BuildTool) {
			super();

			this.state = state;
			this.selectedBlock = state.selectedBlock.asReadonly();
			this.selectedColor = state.selectedColor.asReadonly();
			this.selectedMaterial = state.selectedMaterial.asReadonly();
			this.mirrorMode = state.mirrorMode.asReadonly();
			this.plot = state.targetPlot;
			this.blockRotation = state.blockRotation;

			this.blockMirrorer = this.parent(new BlockMirrorer());

			this.onPrepare(() => this.updateBlockPosition());
			this.event.subscribeObservable(this.mirrorMode, () => this.updateBlockPosition());
			this.event.subscribe(Signals.CAMERA.MOVED, () => this.updateBlockPosition());
			this.event.subscribeObservable(this.selectedBlock, () => this.destroyGhosts());
			this.onDisable(() => this.destroyGhosts());

			const axis = ReplicatedStorage.Assets.Axis.Clone();
			axis.Parent = Workspace;
			this.onDestroy(() => axis.Destroy());

			this.event.subscribe(RunService.PreRender, () => {
				if (this.mainGhost) {
					axis.PivotTo(this.mainGhost.GetPivot());
				} else {
					axis.PivotTo(new CFrame(0, -987654312, 0));
				}
			});
		}

		private destroyGhosts(destroyMain = true) {
			if (destroyMain) {
				this.blockMirrorer.blocks.set([]);
				this.mainGhost?.Destroy();
				this.mainGhost = undefined;
			}

			this.blockMirrorer.destroyMirrors();
		}
		private updateMirrorGhostBlocksPosition() {
			const selected = this.selectedBlock.get();
			if (!selected) return;

			const mainPosition = this.mainGhost?.GetPivot().Position;
			if (!mainPosition) return;

			this.mainGhost?.PivotTo(this.blockRotation.get().add(mainPosition));
			this.blockMirrorer.updatePositions(this.plot.get().instance, this.mirrorMode.get());
		}

		/** @param mainPosition If specified, overrides the mouse target position */
		protected updateBlockPosition(mainPosition?: Vector3) {
			if (!this.isEnabled()) {
				return;
			}

			const selectedBlock = this.selectedBlock.get();
			if (!selectedBlock) return;

			if (!mainPosition) {
				if (Gui.isCursorOnVisibleGui()) {
					return;
				}

				mainPosition = getMouseTargetBlockPosition(selectedBlock, this.blockRotation.get());
			}
			if (!mainPosition) return;

			this.mainGhost ??= createBlockGhost(selectedBlock);
			this.blockMirrorer.blocks.set([{ id: selectedBlock.id, model: this.mainGhost }]);
			this.mainGhost.PivotTo(this.blockRotation.get().add(mainPosition));

			const prettyCFrame = (cframe: CFrame) => {
				const round = (vec: Vector3) => new Vector3(math.round(vec.X), math.round(vec.Y), math.round(vec.Z));
				const [, , , XX, XY, XZ, YX, YY, YZ, ZX, ZY, ZZ] = cframe.GetComponents();
				return (
					[XX, XY, XZ, YX, YY, YZ, ZX, ZY, ZZ]
						.map(math.round)
						.map(tostring)
						.map((n) => (n.size() === 2 ? n : `+${n}`))
						.join() +
					" | " +
					round(cframe.RightVector) +
					" / " +
					round(cframe.UpVector) +
					" / " +
					round(cframe.LookVector.mul(-1))
				);
			};

			const plot = this.plot.get();
			const getAreAllGhostsInsidePlot = () =>
				asMap(this.blockMirrorer.getMirroredModels()).all((k, ghosts) =>
					ghosts.all((ghost) => plot.isModelInside(ghost)),
				);
			const areAllBlocksInsidePlot = plot.isModelInside(this.mainGhost) && getAreAllGhostsInsidePlot();

			if (areAllBlocksInsidePlot) {
				this.updateMirrorGhostBlocksPosition();
			} else {
				this.destroyGhosts(false);
			}

			const canBePlaced =
				areAllBlocksInsidePlot &&
				BuildingManager.blockCanBePlacedAt(plot, selectedBlock, this.mainGhost.GetPivot()) &&
				asMap(this.blockMirrorer.getMirroredModels()).all((k, ghosts) =>
					ghosts.all((ghost) => BuildingManager.blockCanBePlacedAt(plot, selectedBlock, ghost.GetPivot())),
				);

			BlockGhoster.setColor(canBePlaced ? allowedColor : forbiddenColor);
		}

		rotate(axis: "x" | "y" | "z", inverted = true): void {
			if (axis === "x") {
				this.rotateFineTune(new Vector3(inverted ? math.pi / 2 : math.pi / -2, 0, 0));
			} else if (axis === "y") {
				this.rotateFineTune(new Vector3(0, inverted ? math.pi / 2 : math.pi / -2, 0));
			} else if (axis === "z") {
				this.rotateFineTune(new Vector3(0, 0, inverted ? math.pi / 2 : math.pi / -2));
			}
		}

		protected rotateFineTune(rotation: CFrame | Vector3): void {
			if (typeIs(rotation, "Vector3")) {
				rotation = CFrame.fromEulerAnglesXYZ(rotation.X, rotation.Y, rotation.Z);
			}

			SoundController.getSounds().Build.BlockRotate.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Build.BlockRotate.Play();

			this.blockRotation.set(this.blockRotation.get().mul(rotation));
			this.updateBlockPosition();
		}

		async place() {
			const selected = this.selectedBlock.get();
			if (!selected) {
				return;
			}

			const mainGhost = this.mainGhost;
			if (!mainGhost?.PrimaryPart) {
				return;
			}

			let blocks = [
				{ id: selected.id, pos: mainGhost.PrimaryPart!.CFrame },
				...asMap(this.blockMirrorer.getMirroredModels()).flatmap((k, v) =>
					v.map((v) => ({ id: k, pos: v.PrimaryPart!.CFrame })),
				),
			].map(
				(g): PlaceBlockRequest => ({
					id: g.id,
					color: this.selectedColor.get(),
					material: this.selectedMaterial.get(),
					location: g.pos,
				}),
			);

			// filter out the blocks on the same location
			blocks = new Map(
				blocks.map((b) => [VectorUtils.roundVectorToNearestHalf(b.location.Position), b] as const),
			).map((_, b) => b);

			const response = await ClientBuilding.placeOperation.execute(this.plot.get(), blocks);
			processPlaceResponse(response);
			if (response.success) {
				this.updateBlockPosition();
			}
		}
	}
	class Desktop extends Controller {
		constructor(state: BuildTool) {
			super(state);

			state.subscribeSomethingToCurrentPlot(this, () => this.updateBlockPosition());
			this.event.subscribe(mouse.Move, () => this.updateBlockPosition());
			this.event.subInput((ih) => {
				ih.onMouse1Up(() => this.place(), false);
				ih.onMouse3Down(() => {
					state.pickBlock();
					this.updateBlockPosition();
				}, false);

				ih.onKeyDown("T", () => this.rotate("x"));
				ih.onKeyDown("R", () => this.rotate("y"));
				ih.onKeyDown("Y", () => {
					if (InputController.isCtrlPressed()) return;
					this.rotate("z");
				});
			});
		}
	}
	class Touch extends Controller {
		private prevTarget: [target: BasePart, hit: CFrame, surface: Enum.NormalId] | undefined;

		constructor(state: BuildTool) {
			super(state);

			this.event.subInput((ih) => {
				ih.onTouchTap(() => {
					if (!Gui.isCursorOnVisibleGui()) {
						const target = mouse.Target;
						if (target) {
							this.prevTarget = [target, mouse.Hit, mouse.TargetSurface];
						}
					}

					this.updateBlockPosition();
				}, false);
			});
		}

		protected updateBlockPosition(): void {
			const selectedBlock = this.selectedBlock.get();
			if (!selectedBlock) return;

			const mainPosition = getMouseTargetBlockPosition(selectedBlock, this.blockRotation.get(), this.prevTarget);
			super.updateBlockPosition(mainPosition);
		}
	}
	class Gamepad extends Desktop {
		constructor(state: BuildTool) {
			super(state);

			this.event.subInput((ih) => {
				ih.onMouse3Down(() => {
					state.pickBlock();
					this.updateBlockPosition();
				}, false);

				ih.onKeyDown("ButtonX", () => this.place());
				ih.onKeyDown("DPadLeft", () => this.rotate("x"));
				ih.onKeyDown("DPadUp", () => this.rotate("y"));
				ih.onKeyDown("DPadRight", () => this.rotate("z"));
			});
		}
	}

	export function create(tool: BuildTool) {
		return ClientComponentChild.createOnceBasedOnInputType({
			Desktop: () => new Desktop(tool),
			Touch: () => new Touch(tool),
			Gamepad: () => new Gamepad(tool),
		});
	}
}

namespace MultiPlaceController {
	type FloatingTextDefinition = BasePart & {
		readonly billboard: BillboardGui & {
			readonly text: TextLabel;
		};
	};
	class FloatingText extends InstanceComponent<FloatingTextDefinition> {
		static create(adornee: Model) {
			const instance = Element.create(
				"Part",
				{
					Anchored: true,
					Transparency: 1,
					CanCollide: false,
					CanTouch: false,
					Size: new Vector3(1, 1, 1),
				},
				{
					billboard: Element.create(
						"BillboardGui",
						{ Size: new UDim2(0, 200, 0, 50), AlwaysOnTop: true },
						{
							text: Element.create("TextLabel", {
								Size: new UDim2(1, 0, 1, 0),
								AutoLocalize: false,
								BackgroundTransparency: 1,
								FontFace: Element.newFont(Enum.Font.Ubuntu, Enum.FontWeight.Bold),
								TextSize: 20,
								TextColor3: Colors.black,
								TextStrokeColor3: Colors.white,
								TextStrokeTransparency: 0,
							}),
						},
					),
				},
			);
			instance.billboard.Adornee = instance;
			instance.Parent = Workspace;

			return new FloatingText(instance, adornee);
		}

		readonly counts = new ObservableValue<Vector3int16>(new Vector3int16());

		constructor(instance: FloatingTextDefinition, adornee: Model) {
			super(instance);

			this.event.subscribe(RunService.Heartbeat, () => {
				const closest = (origin: Vector3, points: readonly Vector3[]) => {
					let result = new Vector3(math.huge, math.huge, math.huge);
					let magnitude = math.huge;

					for (const point of points) {
						const mg = origin.sub(point).Magnitude;
						if (mg < magnitude) {
							result = point;
							magnitude = mg;
						}
					}

					return result;
				};

				const [mcf, ms] = adornee.GetBoundingBox();
				const points: Vector3[] = [];
				const addIfVisible = (point: Vector3) => {
					const [, visible] = Workspace.CurrentCamera!.WorldToScreenPoint(point);
					if (visible) points.push(point);
				};

				if (true as boolean) {
					addIfVisible(mcf.Position);
				} else {
					addIfVisible(mcf.mul(new Vector3(ms.X / 2, ms.Y / 2, ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(-ms.X / 2, ms.Y / 2, ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(-ms.X / 2, -ms.Y / 2, ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(-ms.X / 2, ms.Y / 2, -ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(-ms.X / 2, -ms.Y / 2, -ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(ms.X / 2, -ms.Y / 2, ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(ms.X / 2, -ms.Y / 2, -ms.Z / 2)));
					addIfVisible(mcf.mul(new Vector3(ms.X / 2, ms.Y / 2, -ms.Z / 2)));
				}

				const origin = Workspace.CurrentCamera?.CFrame?.Position;
				if (!origin) return;

				const fx = closest(origin, points);
				instance.Position = fx;

				const counts = this.counts.get();
				instance.billboard.text.Text = `${counts.X}, ${counts.Y}, ${counts.Z}`;
			});
		}
	}

	export abstract class Base extends ClientComponent implements IController {
		private readonly possibleFillRotationAxis = [Vector3.xAxis, Vector3.yAxis, Vector3.zAxis] as const;
		private readonly fillLimit = 32;
		private readonly drawnGhostsMap = new Map<Vector3, Model>();
		private readonly blockMirrorer;
		private readonly floatingText;
		private oldPositions?: {
			readonly positions: Set<Vector3>;
			endPoint: Vector3;
			readonly rotation: CFrame;
		};
		private fillRotationMode = 1;

		constructor(
			protected readonly pressPosition: Vector3,
			private readonly selectedBlock: RegistryBlock,
			private readonly selectedColor: Color3,
			private readonly selectedMaterial: Enum.Material,
			private readonly mirrorModes: MirrorMode,
			private readonly plot: SharedPlot,
			private readonly blockRotation: CFrame,
		) {
			super();
			this.blockMirrorer = this.parent(new BlockMirrorer());
			this.floatingText = this.parent(FloatingText.create(BlockGhoster.parent));

			this.onDisable(() => {
				for (const [, ghost] of this.drawnGhostsMap) {
					ghost.Destroy();
				}

				this.drawnGhostsMap.clear();
			});

			this.onEnable(() => this.updateGhosts());
		}
		protected updateGhosts(pos?: Vector3) {
			if (!pos) {
				const cameraPostion = Workspace.CurrentCamera!.CFrame.Position;
				const hit = mouse.Hit.Position;
				const clickDirection = cameraPostion.sub(hit).Unit;
				pos = this.getPositionOnBuildingPlane(this.pressPosition, cameraPostion, clickDirection);
			}

			const plotRegion = SharedPlots.getPlotBuildingRegion(this.plot.instance);
			pos = plotRegion.clampVector(pos);
			const positionsData = this.calculateGhostBlockPositions(this.selectedBlock.model, this.pressPosition, pos);
			if (!positionsData) return;
			if (!plotRegion.contains(this.pressPosition)) return;
			if (this.oldPositions?.positions === positionsData.positions) return;

			const oldPositions = this.oldPositions?.positions ?? new Set();
			const newPositions = positionsData.positions;

			const toDelete = oldPositions.filter((p) => !newPositions.has(p));
			for (const pos of toDelete) {
				this.drawnGhostsMap.get(pos)?.Destroy();
				this.drawnGhostsMap.delete(pos);
			}

			const newposs = newPositions.filter((p) => !oldPositions.has(p));
			const newModels = this.drawModels(newposs, positionsData.rotation);

			for (const model of newModels) {
				this.drawnGhostsMap.set(model.GetPivot().Position, model);
			}

			this.oldPositions = positionsData;

			this.blockMirrorer.blocks.set(this.drawnGhostsMap.map((_, m) => ({ id: this.selectedBlock.id, model: m })));
			this.blockMirrorer.updatePositions(this.plot.instance, this.mirrorModes);
		}

		rotate(axis: "x" | "y" | "z", inverted?: boolean | undefined): void {
			this.rotateFillAxis();
		}

		private drawModels(positions: readonly Vector3[], rotation: CFrame) {
			const allGhosts: Model[] = [];

			for (const pos of positions) {
				const ghostFrame = new CFrame(pos).mul(rotation);
				const ghost = createBlockGhost(this.selectedBlock);
				ghost.PivotTo(ghostFrame);
				allGhosts.push(ghost);
			}

			return allGhosts;
		}

		private calculateGhostBlockPositions(part: BlockModel, from: Vector3, to: Vector3): typeof this.oldPositions {
			if (this.oldPositions?.endPoint === to) {
				return this.oldPositions;
			}

			const aabb = AABB.fromModel(part);
			const blockSize = aabb.withCenter(this.blockRotation.Rotation.add(aabb.getCenter())).getSize();
			const diff = to.sub(from);
			const toX = math.min(math.abs(diff.X), this.fillLimit);
			const toY = math.min(math.abs(diff.Y), this.fillLimit);
			const toZ = math.min(math.abs(diff.Z), this.fillLimit);
			const result: Vector3[] = [];

			const xs = math.floor(toX / blockSize.X) + 1;
			const ys = math.floor(toY / blockSize.Y) + 1;
			const zs = math.floor(toZ / blockSize.Z) + 1;
			this.floatingText.counts.set(new Vector3int16(xs, ys, zs));

			for (let x = 0; x <= toX; x += blockSize.X) {
				for (let y = 0; y <= toY; y += blockSize.Y) {
					for (let z = 0; z <= toZ; z += blockSize.Z) {
						const posX = math.sign(diff.X) * x + from.X;
						const posY = math.sign(diff.Y) * y + from.Y;
						const posZ = math.sign(diff.Z) * z + from.Z;
						result.push(new Vector3(posX, posY, posZ));
					}
				}
			}

			return {
				positions: new Set(result),
				endPoint: to ?? from,
				rotation: this.blockRotation,
			};
		}
		protected getPositionOnBuildingPlane(blockPosition: Vector3, cameraPostion: Vector3, lookVector: Vector3) {
			const rotation = this.getCurrentFillRotation();
			const plane = blockPosition.mul(VectorUtils.apply(rotation, (v) => math.abs(v)));
			const diff = cameraPostion.sub(plane);
			let distance = 0;

			switch (1) {
				case rotation.X: //I really liked the "!!rotation.X" solution but compiler didn't :(
					distance = diff.X / lookVector.X;
					break;
				case rotation.Y:
					distance = diff.Y / lookVector.Y;
					break;
				case rotation.Z:
					distance = diff.Z / lookVector.Z;
					break;
			}

			return lookVector.mul(-distance).add(cameraPostion);
		}

		protected rotateFillAxis() {
			this.fillRotationMode = (this.fillRotationMode + 1) % this.possibleFillRotationAxis.size();
		}
		private getCurrentFillRotation() {
			return this.possibleFillRotationAxis[this.fillRotationMode];
		}

		async place() {
			let locations = [
				...this.blockMirrorer.blocks.get().map(({ id, model }) => ({ id, pos: model.GetPivot() })),
				...asMap(this.blockMirrorer.getMirroredModels()).flatmap((id, models) =>
					models.map((model) => ({ id, pos: model.GetPivot() })),
				),
			];
			/*let locations = this.drawnGhostsMap.flatmap((_, m) => [
				{ id: this.selectedBlock.id, pos: m.GetPivot() },
				...BuildingManager.getMirroredBlocks(
					this.plot.instance,
					{ id: this.selectedBlock.id, pos: m.GetPivot() },
					this.mirrorModes,
				),
			]);*/
			// filter out the blocks on the same location
			locations = new Map(
				locations.map((b) => [VectorUtils.roundVectorToNearestHalf(b.pos.Position), b] as const),
			).map((_, b) => b);

			const response = await ClientBuilding.placeOperation.execute(
				this.plot,
				locations.map(
					(loc): PlaceBlockRequest => ({
						id: loc.id,
						color: this.selectedColor,
						material: this.selectedMaterial,
						location: loc.pos,
					}),
				),
			);
			processPlaceResponse(response);

			return response;
		}
	}
	class Desktop extends Base {
		constructor(
			pressPosition: Vector3,
			selectedBlock: RegistryBlock,
			selectedColor: Color3,
			selectedMaterial: Enum.Material,
			mirrorModes: MirrorMode,
			plot: SharedPlot,
			blockRotation: CFrame,
		) {
			super(pressPosition, selectedBlock, selectedColor, selectedMaterial, mirrorModes, plot, blockRotation);

			this.event.subInput((ih) => {
				const buttonUnpress = async () => {
					const result = await this.place();
					if (result && !result.success) {
						LogControl.instance.addLine(result.message, Colors.red);
					}

					this.destroy();
				};
				ih.onMouse1Up(buttonUnpress, true);
				ih.onKeyUp("ButtonR2", buttonUnpress);
				this.eventHandler.subscribe(UserInputService.TouchEnded, buttonUnpress);
			});

			this.event.subscribe(mouse.Move, () => this.updateGhosts());
			this.event.subscribe(Signals.CAMERA.MOVED, () => this.updateGhosts());
			this.event.subInput((ih) => ih.onKeyDown("R", () => this.rotateFillAxis()));
		}
	}
	class Touch extends Base {
		private prevTarget: [cameraPostion: Vector3, lookVector: Vector3] | undefined;

		constructor(
			pressPosition: Vector3,
			selectedBlock: RegistryBlock,
			selectedColor: Color3,
			selectedMaterial: Enum.Material,
			mirrorModes: MirrorMode,
			plot: SharedPlot,
			blockRotation: CFrame,
		) {
			super(pressPosition, selectedBlock, selectedColor, selectedMaterial, mirrorModes, plot, blockRotation);

			this.event.subInput((ih) => {
				ih.onTouchTap(() => {
					const cameraPostion = Workspace.CurrentCamera!.CFrame.Position;
					const hit = mouse.Hit.Position;
					const clickDirection = cameraPostion.sub(hit).Unit;
					this.prevTarget = [cameraPostion, clickDirection];

					this.updateGhosts();
				}, false);
			});
		}

		protected updateGhosts(): void {
			if (this.prevTarget) {
				const pos = this.getPositionOnBuildingPlane(this.pressPosition, this.prevTarget[0], this.prevTarget[1]);
				super.updateGhosts(pos);
			} else {
				super.updateGhosts(this.pressPosition);
			}
		}
	}

	abstract class Starter extends ClientComponent {
		constructor(state: BuildTool, parent: ComponentChild<IController>) {
			super();
		}
	}
	class DesktopStarter extends Starter {
		constructor(state: BuildTool, parent: ComponentChild<IController>) {
			super(state, parent);

			this.event.subInput((ih) => {
				ih.onMouse1Down(() => {
					if (InputController.isShiftPressed()) {
						init(state, parent);
					}
				}, false);
			});
		}
	}
	class TouchStarter extends Starter {
		constructor(state: BuildTool, parent: ComponentChild<IController>) {
			super(state, parent);
		}
	}
	class GamepadStarter extends Starter {
		constructor(state: BuildTool, parent: ComponentChild<IController>) {
			super(state, parent);

			this.event.subInput((ih) => {
				ih.onKeyDown("ButtonR2", () => {
					if (InputController.isShiftPressed()) {
						// TODO: shift with controller??
						init(state, parent);
					}
				});
			});
		}
	}

	export function subscribe(state: BuildTool, parent: ComponentChild<IController>) {
		ClientComponentChild.registerBasedOnInputType(state, {
			Desktop: () => new DesktopStarter(state, parent),
			Touch: () => new TouchStarter(state, parent),
			Gamepad: () => new GamepadStarter(state, parent),
		});
	}
	export function init(
		state: BuildTool,
		parent: ComponentChild<IController>,
		prevTarget?: [target: BasePart, hit: CFrame, surface: Enum.NormalId],
	) {
		const selectedBlock = state.selectedBlock.get();
		if (!selectedBlock) return;

		const pressPosition = getMouseTargetBlockPosition(selectedBlock, state.blockRotation.get(), prevTarget);
		if (!pressPosition) return;

		const plot = state.targetPlot.get();

		const ctor =
			(
				ctor: new (
					pressPosition: Vector3,
					selectedBlock: RegistryBlock,
					selectedColor: Color3,
					selectedMaterial: Enum.Material,
					mirrorModes: MirrorMode,
					plot: SharedPlot,
					blockRotation: CFrame,
				) => IController,
			) =>
			() =>
				new ctor(
					pressPosition,
					selectedBlock,
					state.selectedColor.get(),
					state.selectedMaterial.get(),
					state.mirrorMode.get(),
					plot,
					state.blockRotation.get(),
				);

		parent.set(
			ClientComponentChild.createOnceBasedOnInputType({
				Desktop: ctor(Desktop),
				Touch: ctor(Touch),
				Gamepad: ctor(Desktop),
			}),
		);
	}
}

/** A tool for building in the world with blocks */
export class BuildTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);
	readonly currentMode = new ComponentChild<IController>(this, true);
	readonly blockRotation = new ObservableValue<CFrame>(CFrame.identity);

	constructor(mode: BuildingMode) {
		super(mode);

		this.parentGui(
			new Scene.BuildToolScene(ToolBase.getToolGui<"Build", Scene.BuildToolSceneDefinition>().Build, this),
		);

		this.currentMode.childSet.Connect((mode) => {
			if (!this.isEnabled()) return;
			if (mode) return;

			this.currentMode.set(SinglePlaceController.create(this));
		});
		this.onEnable(() => this.currentMode.set(SinglePlaceController.create(this)));

		MultiPlaceController.subscribe(this, this.currentMode);
	}

	supportsMirror() {
		return true;
	}

	placeBlock() {
		return this.currentMode.get()?.place();
	}
	multiPlaceBlock() {
		if (this.currentMode.get() instanceof MultiPlaceController.Base) {
			this.placeBlock();
			return;
		}

		const current = this.currentMode.get();

		MultiPlaceController.init(
			this,
			this.currentMode,
			current && "prevTarget" in current ? (current.prevTarget as never) : undefined,
		);
	}
	rotateBlock(axis: "x" | "y" | "z", inverted = true) {
		return this.currentMode.get()?.rotate(axis, inverted);
	}

	pickBlock() {
		const target = this.mouse.Target;
		if (!target) return;

		let model = target as BlockModel | BasePart;
		while (!model.IsA("Model")) {
			model = model.Parent as BlockModel | BasePart;
			if (!model) return;
		}

		const id = BlockManager.manager.id.get(model);
		if (id === undefined) return; // not a block

		const block = BlocksInitializer.blocks.map.get(id)!;

		this.selectedBlock.set(block);
		this.selectedMaterial.set(BlockManager.manager.material.get(model));
		this.selectedColor.set(BlockManager.manager.color.get(model));

		if (!target.IsDescendantOf(this.targetPlot.get().instance)) {
			this.blockRotation.set(CFrame.identity);
		} else {
			this.blockRotation.set(model.GetPivot().Rotation);
		}
	}

	getDisplayName(): string {
		return "Building";
	}
	getImageID(): string {
		return "rbxassetid://12539295858";
	}

	protected getTooltips(): InputTooltips {
		return {
			Desktop: [
				{ keys: ["R"], text: "Rotate by Y" },
				{ keys: ["T"], text: "Rotate by X" },
				{ keys: ["Y"], text: "Rotate by Z" },
			],
			Gamepad: [
				{ keys: ["ButtonX"], text: "Place" },
				{ keys: ["ButtonB"], text: "Unequip" },
				{ keys: ["ButtonSelect"], text: "Select block" },
				{ keys: ["DPadLeft"], text: "Rotate by X" },
				{ keys: ["DPadUp"], text: "Rotate by Y" },
				{ keys: ["DPadRight"], text: "Rotate by Z" },
			],
		};
	}
}
