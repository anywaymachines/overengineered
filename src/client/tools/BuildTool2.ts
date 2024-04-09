import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import { InputController } from "client/controller/InputController";
import { SoundController } from "client/controller/SoundController";
import { Signals } from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
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
import { Logger } from "shared/Logger";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import { EventHandler } from "shared/event/EventHandler";
import { ObservableValue } from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import { VectorUtils } from "shared/utils/VectorUtils";

const allowedColor = Colors.blue;
const forbiddenColor = Colors.red;
const mouse = Players.LocalPlayer.GetMouse();

const createBlockGhost = (block: RegistryBlock): Model => {
	const model = block.model.Clone();
	BlockGhoster.ghostModel(model);

	return model;
};

// eslint-disable-next-line prettier/prettier
const g = Gui.getGameUI<{ BuildingMode: { Tools: { Build2: { Debug: GuiObject & { Label1: TextLabel; Label2: TextLabel; Label3: TextLabel; Label4: TextLabel; Label5: TextLabel; }; }; }; }; }>().BuildingMode.Tools.Build2.Debug;
if (!RunService.IsStudio()) {
	g.Interactable = false;
	g.Visible = false;
}

// old block positioning from build tool 1
const getMouseTargetBlockPositionV1 = (
	block: RegistryBlock,
	rotation: CFrame,
	info?: [target: BasePart, hit: CFrame, surface: Enum.NormalId],
): Vector3 | undefined => {
	const mouseTarget = mouse.Target;
	if (!mouseTarget) return undefined;

	const mouseHit = info?.[1] ?? mouse.Hit;
	const mouseSurface = info?.[2] ?? mouse.TargetSurface;

	// Positioning Stage 1
	const rotationRelative = mouseTarget.CFrame.sub(mouseTarget.Position).Inverse();
	const normalPositioning = VectorUtils.normalIdToNormalVector(mouseSurface, mouseTarget);
	const positioning = mouseTarget.CFrame.mul(new CFrame(normalPositioning.vector.mul(normalPositioning.size / 2)));
	const p1 = positioning.mul(rotationRelative).mul(rotation);

	// Positioning Stage 2
	const convertedPosition = mouseTarget.CFrame.sub(mouseTarget.Position).PointToWorldSpace(normalPositioning.vector);

	const RightVectorValue = math.abs(p1.RightVector.Dot(convertedPosition));
	const UpVectorValue = math.abs(p1.UpVector.Dot(convertedPosition));
	const LookVectorValue = math.abs(p1.LookVector.Dot(convertedPosition));

	// Positioning Stage 3
	const MouseHitObjectSpace = mouseTarget.CFrame.PointToObjectSpace(mouseHit.Position);

	const blockSize = block.model.GetExtentsSize();
	const moveRangeStuds = math.clamp(math.min(blockSize?.X, blockSize.Y, blockSize.Z) / 2, 0.5, 1);

	const offset = VectorUtils.roundVectorToBase(
		MouseHitObjectSpace.sub(
			new Vector3(
				math.abs(normalPositioning.vector.X),
				math.abs(normalPositioning.vector.Y),
				math.abs(normalPositioning.vector.Z),
			).mul(MouseHitObjectSpace),
		),
		moveRangeStuds,
	);

	const p2 = positioning
		.mul(
			new CFrame(
				normalPositioning.vector.mul(
					RightVectorValue * (block.model.PrimaryPart!.Size.X / 2) +
						UpVectorValue * (block.model.PrimaryPart!.Size.Y / 2) +
						LookVectorValue * (block.model.PrimaryPart!.Size.Z / 2),
				),
			),
		)
		.mul(new CFrame(offset))
		.mul(rotationRelative)
		.mul(rotation);

	return VectorUtils.roundVectorToBase(p2.Position, moveRangeStuds);
};

// new block positioning by i3ym
const getMouseTargetBlockPositionV2 = (
	block: RegistryBlock,
	rotation: CFrame,
	info?: [target: BasePart, hit: CFrame, surface: Enum.NormalId],
): Vector3 | undefined => {
	const constrainPositionToGrid = (normal: Vector3, pos: Vector3) => {
		const roundByStep = (number: number) => {
			const step = 1;
			return number - (((number + step / 2) % step) - step / 2);
		};
		const constrain = math.round;

		return new Vector3(
			normal.X === 0 ? constrain(pos.X) : pos.X,
			normal.Y === 0 ? constrain(pos.Y) : pos.Y,
			normal.Z === 0 ? constrain(pos.Z) : pos.Z,
		);
	};
	const addTargetSize = (target: BasePart, normal: Vector3, pos: Vector3) => {
		return pos
			.sub(pos.sub(target.Position).mul(VectorUtils.apply(normal, math.abs)))
			.add(AABB.fromPart(target).getSize().div(2).mul(normal));
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

	g.Label1.Text = `Target: ${target}`;
	g.Label2.Text = `Hit: ${mouseHit}`;
	g.Label3.Text = `Normal: ${mouseSurface} ${normal}`;

	let targetPosition = globalMouseHitPos;
	targetPosition = addTargetSize(target, normal, targetPosition);
	targetPosition = addBlockSize(block, normal, targetPosition);
	targetPosition = constrainPositionToGrid(normal, targetPosition);

	return targetPosition;
};
const getMouseTargetBlockPosition = getMouseTargetBlockPositionV2;

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
			readonly RotateRButton: GuiButton;
			readonly RotateTButton: GuiButton;
			readonly RotateYButton: GuiButton;
		};
	};

	export class BuildToolScene extends Control<BuildToolSceneDefinition> {
		readonly tool;
		readonly blockSelector;
		private readonly blockInfoPreviewControl: BlockPreviewControl;

		constructor(gui: BuildToolSceneDefinition, tool: BuildTool2) {
			super(gui);
			this.tool = tool;

			this.blockSelector = new BlockSelectionControl(gui.Inventory);
			this.blockSelector.show();
			this.add(this.blockSelector);

			const mirrorEditor = this.add(new MirrorEditorControl(this.gui.Mirror.Content));
			mirrorEditor.value.set(tool.mirrorMode.get());
			this.event.subscribeObservable(mirrorEditor.value, (val) => tool.mirrorMode.set(val), true);
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

			this.add(new MaterialColorEditControl(this.gui.Bottom, tool.selectedMaterial, tool.selectedColor));

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

		show() {
			super.show();
			GuiAnimator.transition(this.gui.Inventory, 0.2, "right");
		}
	}
}

interface IController extends IComponent {
	rotate(axis: "x" | "y" | "z", inverted?: boolean): void;
	place(): Promise<unknown>;
}
namespace SinglePlaceController {
	abstract class Controller extends ClientComponent implements IController {
		protected readonly state: BuildTool2;

		private mainGhost?: Model;
		protected readonly blockRotation;
		protected readonly selectedBlock;
		protected readonly selectedColor;
		protected readonly selectedMaterial;
		protected readonly mirrorMode;
		protected readonly plot;
		protected readonly blockMirrorer;

		constructor(state: BuildTool2) {
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
			this.event.subscribeObservable(this.selectedBlock, () => this.destroyGhosts());
			this.onDisable(() => this.destroyGhosts());
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
			g.Label4.Text = `Rotation: ${prettyCFrame(this.mainGhost?.GetPivot() ?? this.blockRotation)}`;

			const plot = this.plot.get();
			const areAllBlocksInsidePlot =
				plot.isModelInside(this.mainGhost) &&
				this.blockMirrorer
					.getMirroredModels()
					.all((_, ghosts) => ghosts.all((ghost) => plot.isModelInside(ghost)));

			if (areAllBlocksInsidePlot) {
				this.updateMirrorGhostBlocksPosition();
			} else {
				this.destroyGhosts(false);
			}

			const canBePlaced =
				areAllBlocksInsidePlot &&
				this.blockMirrorer
					.getMirroredModels()
					.all((_, ghosts) =>
						ghosts.all((ghost) =>
							BuildingManager.blockCanBePlacedAt(plot, selectedBlock, ghost.GetPivot()),
						),
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

			// Non-alive players bypass
			if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
				return;
			}

			// ERROR: Block is not selected
			if (!selected) {
				LogControl.instance.addLine("Block is not selected!");

				return;
			}

			const mainGhost = this.mainGhost;
			if (!mainGhost || !mainGhost.PrimaryPart) {
				return;
			}

			const plot = this.plot.get();
			if (
				![
					mainGhost,
					...this.blockMirrorer
						.getMirroredModels()
						.values()
						.flatmap((m) => m),
				].all((ghost) => BuildingManager.blockCanBePlacedAt(plot, selected, ghost.GetPivot()))
			) {
				LogControl.instance.addLine("Out of bounds!", Colors.red);

				// Play sound
				SoundController.getSounds().Build.BlockPlaceError.Play();
				return;
			}
			const pos = plot.instance.BuildingArea.CFrame.ToObjectSpace(mainGhost!.PrimaryPart!.CFrame);
			g.Label5.Text = `new CFrame(${[...pos.GetComponents()].join()})`;

			const response = await ClientBuilding.placeOperation.execute(
				plot,
				[
					mainGhost,
					...this.blockMirrorer
						.getMirroredModels()
						.values()
						.flatmap((m) => m),
				].map(
					(g): PlaceBlockRequest => ({
						id: selected.id,
						color: this.selectedColor.get(),
						material: this.selectedMaterial.get(),
						location: g.PrimaryPart!.CFrame,
					}),
				),
			);

			if (response.success) {
				// Play sound
				SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
				SoundController.getSounds().Build.BlockPlace.Play();

				task.wait();
				this.updateBlockPosition();
			} else {
				Logger.err(response.message);
				SoundController.getSounds().Build.BlockPlaceError.Play();
			}
		}
	}
	class Desktop extends Controller {
		constructor(state: BuildTool2) {
			super(state);

			state.subscribeSomethingToCurrentPlot(this, () => this.updateBlockPosition());
			this.onPrepare((inputType, eh, ih) => {
				eh.subscribe(Signals.CAMERA.MOVED, () => this.updateBlockPosition());
				eh.subscribe(mouse.Move, () => this.updateBlockPosition());
				ih.onMouse1Up(() => this.place(), false);
			});

			this.event.subInput((ih) => {
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
		private prevTarget?: [target: BasePart, hit: CFrame, surface: Enum.NormalId];

		constructor(state: BuildTool2) {
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
		constructor(state: BuildTool2) {
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

	export function create(tool: BuildTool2) {
		return ClientComponentChild.createOnceBasedOnInputType({
			Desktop: () => new Desktop(tool),
			Touch: () => new Touch(tool),
			Gamepad: () => new Gamepad(tool),
		});
	}
}

namespace MultiPlaceController {
	export class Desktop extends ClientComponent implements IController {
		static subscribe(state: BuildTool2, parent: ComponentChild<IController>) {
			const buttonPress = () => {
				const selectedBlock = state.selectedBlock.get();
				if (!selectedBlock) return;

				const pressPosition = getMouseTargetBlockPosition(selectedBlock, state.blockRotation.get());
				if (!pressPosition) return;

				const plot = state.targetPlot.get();
				parent.set(
					new Desktop(
						pressPosition,
						selectedBlock,
						state.selectedColor.get(),
						state.selectedMaterial.get(),
						state.mirrorMode.get(),
						plot,
						state.blockRotation.get(),
					),
				);
			};

			state.event.subInput((ih) => {
				ih.onKeyDown("ButtonR2", () => {
					if (InputController.isShiftPressed()) {
						//shift with controller??
						buttonPress();
					}
				});
				ih.onMouse1Down(() => {
					if (InputController.isShiftPressed()) {
						buttonPress();
					}
				}, false);

				const eh = new EventHandler();
				const stateeh = state as unknown as { readonly eventHandler: EventHandler };
				stateeh.eventHandler.subscribe(UserInputService.TouchStarted, (input, gameProcessedEvent) => {
					if (gameProcessedEvent) return;
					const thread = task.delay(0.4, () => {
						eh.unsubscribeAll();
						Workspace.CurrentCamera!.CameraType = Enum.CameraType.Scriptable;
						buttonPress();
					});

					const cancel = () => {
						task.cancel(thread);
						eh.unsubscribeAll();
					};
					eh.subscribe(Signals.CAMERA.MOVED, cancel);
					eh.subscribe(UserInputService.TouchEnded, cancel);
				});
			});
		}

		private readonly possibleFillRotationAxis = [Vector3.xAxis, Vector3.yAxis, Vector3.zAxis] as const;
		private readonly fillLimit = 32;
		private readonly drawnGhostsMap = new Map<Vector3, Model>();
		private static defaultCameraType = Workspace.CurrentCamera!.CameraType; //Enum.CameraType.Custom
		private readonly blockMirrorer;
		private oldPositions?: {
			readonly positions: Set<Vector3>;
			endPoint: Vector3;
			readonly rotation: CFrame;
		};
		private fillRotationMode = 1;

		constructor(
			private readonly pressPosition: Vector3,
			private readonly selectedBlock: RegistryBlock,
			private readonly selectedColor: Color3,
			private readonly selectedMaterial: Enum.Material,
			private readonly mirrorModes: MirrorMode,
			private readonly plot: SharedPlot,
			private readonly blockRotation: CFrame,
		) {
			super();
			this.blockMirrorer = this.parent(new BlockMirrorer());

			const updateGhosts = () => {
				const cameraPostion = Workspace.CurrentCamera!.CFrame.Position;
				const hit = mouse.Hit.Position;
				const clickDirection = cameraPostion.sub(hit).Unit;
				let pos = this.getPositionOnBuildingPlane(this.pressPosition, cameraPostion, clickDirection);
				const plotRegion = SharedPlots.getPlotBuildingRegion(plot.instance);
				pos = plotRegion.clampVector(pos);
				const positionsData = this.calculateGhostBlockPositions(
					this.selectedBlock.model,
					this.pressPosition,
					pos,
				);
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

				this.blockMirrorer.blocks.set(this.drawnGhostsMap.map((_, m) => ({ id: selectedBlock.id, model: m })));
				this.blockMirrorer.updatePositions(plot.instance, mirrorModes);
			};

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
				this.eventHandler.subscribe(UserInputService.TouchEnded, () => {
					Workspace.CurrentCamera!.CameraType = Desktop.defaultCameraType;
					buttonUnpress();
				});
			});

			this.event.subscribe(mouse.Move, updateGhosts);
			this.event.subscribe(Signals.CAMERA.MOVED, updateGhosts);
			this.event.subInput((ih) => ih.onKeyDown("R", () => this.rotateFillAxis()));
			this.onDisable(() => {
				for (const [, ghost] of this.drawnGhostsMap) {
					ghost.Destroy();
				}

				this.drawnGhostsMap.clear();
			});

			this.onEnable(updateGhosts);
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
		private getPositionOnBuildingPlane(blockPosition: Vector3, cameraPostion: Vector3, lookVector: Vector3) {
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

		private rotateFillAxis() {
			this.fillRotationMode = (this.fillRotationMode + 1) % this.possibleFillRotationAxis.size();
		}
		private getCurrentFillRotation() {
			return this.possibleFillRotationAxis[this.fillRotationMode];
		}

		async place() {
			// Non-alive players bypass
			if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
				return;
			}

			const locations = this.drawnGhostsMap.flatmap((_, m) => [
				m.GetPivot(),
				...BuildingManager.getMirroredBlocksCFrames(
					this.plot.instance,
					this.selectedBlock.id,
					m.GetPivot(),
					this.mirrorModes,
				),
			]);
			if (!locations.all((loc) => BuildingManager.blockCanBePlacedAt(this.plot, this.selectedBlock, loc))) {
				LogControl.instance.addLine("Out of bounds!", Colors.red);
				SoundController.getSounds().Build.BlockPlaceError.Play();
				return;
			}

			const response = await ClientBuilding.placeOperation.execute(
				this.plot,
				locations.map(
					(loc): PlaceBlockRequest => ({
						id: this.selectedBlock.id,
						color: this.selectedColor,
						material: this.selectedMaterial,
						location: loc,
					}),
				),
			);

			if (response.success) {
				// Play sound
				SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
				SoundController.getSounds().Build.BlockPlace.Play();

				task.wait();
			} else {
				Logger.err(response.message);
				SoundController.getSounds().Build.BlockPlaceError.Play();
			}

			return response;
		}
	}
}

/** A tool for building in the world with blocks */
export class BuildTool2 extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);
	readonly currentMode = new ComponentChild<IController>(this, true);
	readonly blockRotation = new ObservableValue<CFrame>(CFrame.identity);

	constructor(mode: BuildingMode) {
		super(mode);

		this.parentGui(
			new Scene.BuildToolScene(ToolBase.getToolGui<"Build2", Scene.BuildToolSceneDefinition>().Build2, this),
		);

		this.currentMode.childSet.Connect((mode) => {
			if (!this.isEnabled()) return;
			if (mode) return;
			this.currentMode.set(SinglePlaceController.create(this));
		});
		this.onEnable(() => this.currentMode.set(SinglePlaceController.create(this)));

		MultiPlaceController.Desktop.subscribe(this, this.currentMode);
	}

	supportsMirror() {
		return true;
	}

	placeBlock() {
		return this.currentMode.get()?.place();
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
		this.blockRotation.set(model.GetPivot().Rotation);
	}

	getDisplayName(): string {
		return "Building (TEST)";
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
