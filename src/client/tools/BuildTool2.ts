import { Players, UserInputService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { SoundController } from "client/controller/SoundController";
import { Signals } from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { BlockMirrorer } from "client/tools/additional/BlockMirrorer";
import { Logger } from "shared/Logger";
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

const constrainPositionToGrid = (pos: Vector3) => {
	const constrain = math.round;
	return new Vector3(constrain(pos.X), constrain(pos.Y), constrain(pos.Z));
};
const addBlockSize = (selectedBlock: RegistryBlock, normal: Vector3, pos: Vector3) => {
	return pos.add(selectedBlock.model.GetBoundingBox()[1].mul(normal).div(2));
};

const createBlockGhost = (block: RegistryBlock): Model => {
	const model = block.model.Clone();
	BlockGhoster.ghostModel(model);

	return model;
};

// eslint-disable-next-line prettier/prettier
const g = Gui.getGameUI<{ BuildingMode: { Tools: { Build2: { Debug: { Label1: TextLabel; Label2: TextLabel; Label3: TextLabel; Label4: TextLabel; Label5: TextLabel; }; }; }; }; }>().BuildingMode.Tools.Build2.Debug;

const getMouseTargetBlockPosition = (block: RegistryBlock): Vector3 | undefined => {
	const mouseTarget = mouse.Target;
	if (!mouseTarget) return undefined;

	const mouseHit = mouse.Hit;
	const mouseSurface = mouse.TargetSurface;

	const globalMouseHitPos = mouseHit.PointToWorldSpace(Vector3.zero);
	const normal = Vector3.FromNormalId(mouseSurface);

	g.Label1.Text = `Target: ${mouseTarget}`;
	g.Label2.Text = `Hit: ${mouseHit}`;
	g.Label3.Text = `Normal: ${mouseSurface} ${normal}`;

	let targetPosition = globalMouseHitPos;
	targetPosition = addBlockSize(block, normal, targetPosition);
	targetPosition = constrainPositionToGrid(targetPosition);

	return targetPosition;
};

namespace SinglePlaceController {
	export class Desktop extends ClientComponent {
		private mainGhost?: Model;
		private readonly blockRotation;
		private readonly selectedBlock;
		private readonly selectedColor;
		private readonly selectedMaterial;
		private readonly mirrorMode;
		private readonly plot;

		private readonly blockMirrorer;

		constructor(state: BuildTool2) {
			super();
			this.selectedBlock = state.selectedBlock.asReadonly();
			this.selectedColor = state.selectedColor.asReadonly();
			this.selectedMaterial = state.selectedMaterial.asReadonly();
			this.mirrorMode = state.mirrorMode.asReadonly();
			this.plot = state.targetPlot;
			this.blockRotation = state.blockRotation;

			this.blockMirrorer = this.parent(new BlockMirrorer());

			this.onPrepare((input) => {
				if (input !== "Touch") return;

				this.inputHandler.onTouchTap(() => this.updateBlockPosition(), false);
			});
			this.event.onPrepare(() => this.updateBlockPosition());

			state.subscribeSomethingToCurrentPlot(this, () => {
				if (InputController.inputType.get() === "Touch") {
					return;
				}

				this.updateBlockPosition();
			});
			this.event.onPrepare((inputType, eh, ih) => {
				if (inputType === "Touch") return;

				eh.subscribe(Signals.CAMERA.MOVED, () => this.updateBlockPosition());
				eh.subscribe(mouse.Move, () => this.updateBlockPosition());
				ih.onMouse1Up(() => this.placeBlock(), false);
			});

			this.event.subscribeObservable(this.selectedBlock, () => this.destroyGhosts());

			this.onPrepare(() => {
				this.inputHandler.onKeyDown("T", () => this.rotateBlock("x"));
				this.inputHandler.onKeyDown("R", () => this.rotateBlock("y"));
				this.inputHandler.onKeyDown("Y", () => {
					if (InputController.isCtrlPressed()) return;
					this.rotateBlock("z");
				});
			});

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

		private updateBlockPosition() {
			if (Gui.isCursorOnVisibleGui()) {
				return;
			}

			const selectedBlock = this.selectedBlock.get();
			if (!selectedBlock) return;

			const mainPosition = getMouseTargetBlockPosition(selectedBlock);
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

		rotateBlock(axis: "x" | "y" | "z", inverted = true): void {
			if (axis === "x") {
				this.rotateFineTune(new Vector3(inverted ? math.pi / 2 : math.pi / -2, 0, 0));
			} else if (axis === "y") {
				this.rotateFineTune(new Vector3(0, inverted ? math.pi / 2 : math.pi / -2, 0));
			} else if (axis === "z") {
				this.rotateFineTune(new Vector3(0, 0, inverted ? math.pi / 2 : math.pi / -2));
			}
		}
		private rotateFineTune(rotationVector: Vector3): void;
		private rotateFineTune(cframe: CFrame): void;
		private rotateFineTune(rotation: CFrame | Vector3): void {
			if (typeIs(rotation, "Vector3")) {
				rotation = CFrame.fromEulerAnglesXYZ(rotation.X, rotation.Y, rotation.Z);
			}

			SoundController.getSounds().Build.BlockRotate.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Build.BlockRotate.Play();

			this.blockRotation.set(this.blockRotation.get().mul(rotation));
			if (this.mainGhost) {
				this.updateMirrorGhostBlocksPosition();
			}
		}

		async placeBlock() {
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
			print(g.Label5.Text);

			const response = await ClientBuilding.placeBlocks(
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
}

namespace MultiPlaceController {
	export class Desktop extends ClientComponent {
		static subscribe(state: BuildTool2, parent: ComponentChild<IComponent>) {
			const buttonPress = () => {
				const selectedBlock = state.selectedBlock.get();
				if (!selectedBlock) return;

				const pressPosition = getMouseTargetBlockPosition(selectedBlock);
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
					const result = await this.placeBlocks();
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

		private async placeBlocks() {
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

			const response = await ClientBuilding.placeBlocks(
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
	readonly currentMode = new ComponentChild<IComponent>(this, true);
	readonly blockRotation = new ObservableValue<CFrame>(CFrame.identity);

	constructor(mode: BuildingMode) {
		super(mode);

		this.currentMode.childSet.Connect((mode) => {
			if (!this.isEnabled()) return;
			if (mode) return;
			this.currentMode.set(new SinglePlaceController.Desktop(this));
		});
		this.onEnable(() => this.currentMode.set(new SinglePlaceController.Desktop(this)));

		MultiPlaceController.Desktop.subscribe(this, this.currentMode);
	}

	supportsMirror() {
		return true;
	}

	placeBlock() {
		const mode = this.currentMode.get();
		if (!(mode instanceof SinglePlaceController.Desktop)) {
			return;
		}

		return mode.placeBlock();
	}
	rotateBlock(axis: "x" | "y" | "z", inverted = true): void {
		const mode = this.currentMode.get();
		if (!(mode instanceof SinglePlaceController.Desktop)) {
			return;
		}

		return mode.rotateBlock(axis, inverted);
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
