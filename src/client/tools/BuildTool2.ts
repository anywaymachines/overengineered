import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import Gui from "client/gui/Gui";
import LogControl from "client/gui/static/LogControl";
import ActionController from "client/modes/build/ActionController";
import BuildingController from "client/modes/build/BuildingController";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import { Element } from "shared/Element";
import Logger from "shared/Logger";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import ObservableValue from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";
import VectorUtils from "shared/utils/VectorUtils";

const allowedColor = Colors.blue;
const forbiddenColor = Colors.red;
const mouse = Players.LocalPlayer.GetMouse();

const ghostParent = Element.create(
	"Model",
	{ Parent: Workspace },
	{
		highlight: Element.create("Highlight", {
			FillColor: Colors.blue,
			FillTransparency: 0.4,
			OutlineTransparency: 0.5,
			DepthMode: Enum.HighlightDepthMode.Occluded,
		}),
	},
);

const constrainPositionToGrid = (pos: Vector3) => {
	const constrain = math.round;
	return new Vector3(constrain(pos.X), constrain(pos.Y), constrain(pos.Z));
};
const addBlockSize = (selectedBlock: RegistryBlock, normal: Vector3, pos: Vector3) => {
	return pos.add(selectedBlock.model.GetBoundingBox()[1].mul(normal).div(2));
};

const createBlockGhost = (block: RegistryBlock): BlockGhost => {
	const model = block.model.Clone();
	PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => (part.CanCollide = false));
	model.Parent = ghostParent;

	if (false as boolean) {
		const axis = ReplicatedStorage.Assets.Axis.Clone();
		axis.PivotTo(model.GetPivot());
		axis.Parent = model;
	}

	// trigger the highlight update
	ghostParent.highlight.Adornee = undefined;
	ghostParent.highlight.Adornee = ghostParent;

	return { model };
};

type BlockGhost = { readonly model: BlockModel };

namespace SinglePlaceController {
	export class Desktop extends ClientComponent {
		private mainGhost?: BlockGhost;
		private readonly mirroredGhosts: BlockGhost[] = [];
		private blockRotation = CFrame.identity;
		private readonly selectedBlock;
		private readonly selectedColor;
		private readonly selectedMaterial;
		private readonly mirrorMode;
		private readonly targetPlot;

		constructor(state: BuildTool2) {
			super();
			this.selectedBlock = state.selectedBlock.asReadonly();
			this.selectedColor = state.selectedColor.asReadonly();
			this.selectedMaterial = state.selectedMaterial.asReadonly();
			this.mirrorMode = state.mirrorMode.asReadonly();
			this.targetPlot = state.targetPlot;

			this.onPrepare((input) => {
				if (input !== "Touch") return;

				this.inputHandler.onTouchTap(() => this.updateBlockPosition());
			});
			this.event.onPrepare(() => this.updateBlockPosition());

			this.event.subscribe(Signals.CAMERA.MOVED, () => this.updateBlockPosition());
			this.event.subscribe(mouse.Move, () => this.updateBlockPosition());
			this.event.subscribe(Signals.BLOCKS.BLOCK_ADDED, () => this.updateBlockPosition());
			this.event.subscribe(Signals.BLOCKS.BLOCK_REMOVED, () => this.updateBlockPosition());

			this.event.subscribeObservable(this.selectedBlock, () => this.destroyGhosts());

			this.event.subscribe(mouse.Button1Up, () => this.placeBlock());
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
				this.mainGhost?.model.Destroy();
				this.mainGhost = undefined;
			}

			for (const ghost of this.mirroredGhosts) {
				ghost.model.Destroy();
			}
			this.mirroredGhosts.clear();
		}

		private updateBlockPosition() {
			const g = Gui.getGameUI<{
				BuildingMode: {
					Tools: {
						Build2: {
							Debug: { Label1: TextLabel; Label2: TextLabel; Label3: TextLabel; Label4: TextLabel };
						};
					};
				};
			}>().BuildingMode.Tools.Build2.Debug;

			const selected = this.selectedBlock.get();
			if (!selected) return;

			const getMouseTargetBlockPosition = () => {
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
				targetPosition = addBlockSize(selected, normal, targetPosition);
				targetPosition = constrainPositionToGrid(targetPosition);
				return targetPosition;
			};
			const updateMirrorGhostBlocksPosition = (plot: Model, mainPosition: Vector3) => {
				const mirrorCFrames = BuildingManager.getMirroredBlocksCFrames2(
					plot,
					this.selectedBlock.get()!.id,
					new CFrame(mainPosition).mul(this.blockRotation),
					this.mirrorMode.get(),
				);

				for (let i = 0; i < mirrorCFrames.size(); i++) {
					const ghost = (this.mirroredGhosts[i] ??= createBlockGhost(selected));
					ghost.model.PivotTo(mirrorCFrames[i]);
				}

				// destroy ghosts if too many
				for (let i = mirrorCFrames.size(); i < this.mirroredGhosts.size(); i++) {
					this.mirroredGhosts[i].model.Destroy();
					delete this.mirroredGhosts[i];
				}
			};

			const mainPosition = getMouseTargetBlockPosition();
			if (!mainPosition) return;

			const plot = SharedPlots.getPlotByPosition(mainPosition);
			this.targetPlot.set(plot);

			this.mainGhost ??= createBlockGhost(selected);
			this.mainGhost.model!.PivotTo(this.blockRotation.add(mainPosition));

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
			g.Label4.Text = `Rotation: ${prettyCFrame(this.mainGhost?.model.GetPivot() ?? this.blockRotation)}`;

			if (plot) {
				updateMirrorGhostBlocksPosition(plot, mainPosition);
			} else {
				this.destroyGhosts(false);
			}

			const canBePlaced =
				plot &&
				[...this.mirroredGhosts, this.mainGhost].find(
					(ghost) =>
						!BuildingManager.blockCanBePlacedAt(
							plot,
							ghost.model,
							ghost.model.GetPivot(),
							Players.LocalPlayer,
						),
				) === undefined;

			PartUtils.ghostModel(this.mainGhost.model, canBePlaced ? allowedColor : forbiddenColor);
			for (const ghost of this.mirroredGhosts) {
				PartUtils.ghostModel(ghost.model, canBePlaced ? allowedColor : forbiddenColor);
			}
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

			if (this.mainGhost) {
				this.mainGhost.model.PivotTo(this.mainGhost.model.GetPivot().mul(this.blockRotation));
			}

			this.blockRotation = rotation.mul(this.blockRotation);
			this.updateBlockPosition();
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

			if (!this.targetPlot.get()) {
				LogControl.instance.addLine("Out of bounds!", Colors.red);

				// Play sound
				SoundController.getSounds().Build.BlockPlaceError.Play();

				return;
			}

			const mainGhost = this.mainGhost;
			if (!mainGhost || !mainGhost.model.PrimaryPart) {
				return;
			}

			const pos = mainGhost.model.PrimaryPart.CFrame;
			const btype = this.selectedBlock.get();
			const mirrors = this.mirrorMode.get();
			const response = await ActionController.instance.executeOperation(
				"Block placement",
				async () => {
					let cframes = BuildingManager.getMirroredBlocksCFrames2(
						SharedPlots.getPlotByPosition(pos.Position)!,
						btype!.id,
						pos,
						mirrors,
					);
					cframes = [...cframes, mainGhost.model.GetPivot()];

					const blocks: BlockModel[] = [];
					for (const cframe of cframes) {
						const block = BuildingManager.getBlockByPosition(cframe.Position);
						if (block) blocks.push(block);
					}

					if (blocks.size() !== 0) await BuildingController.deleteBlock(blocks!);
				},
				[mainGhost, ...this.mirroredGhosts].map((g) => ({
					id: selected.id,
					color: this.selectedColor.get(),
					material: this.selectedMaterial.get(),
					location: g.model.PrimaryPart!.CFrame,
					plot: this.targetPlot.get()!,
				})),
				async (infos): Promise<Response> => {
					for (const info of infos) {
						const result = await BuildingController.placeBlock(info.plot, info);
						if (!result.success) return result;
					}

					return { success: true };
				},
			);

			if (response.success) {
				// Play sound
				SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
				SoundController.getSounds().Build.BlockPlace.Play();

				task.wait();
				this.updateBlockPosition();
			} else {
				Logger.error(response.message);
				SoundController.getSounds().Build.BlockPlaceError.Play();
			}
		}
	}
}

namespace MultiPlaceController {
	export class Desktop extends ClientComponent {
		private readonly possibleFillRotationAxis = [Vector3.xAxis, Vector3.yAxis, Vector3.zAxis] as const;
		private readonly fillLimit = 32;
		private readonly drawnGhostsMap = new Map<Vector3, BlockGhost>();
		private readonly selectedBlock;
		private readonly selectedColor;
		private readonly selectedMaterial;

		private readonly pressPosition: Vector3 = Vector3.zero;
		private oldPositions?: { readonly Positions: Set<Vector3>; readonly endPoint: Vector3 };
		private fillRotationMode = 1;

		static subscribe(state: BuildTool2, parent: ComponentChild<IComponent>) {
			const mouse = Players.LocalPlayer.GetMouse();

			state.event.subInput((ih) =>
				ih.onMouse1Down(() => {
					const selectedBlock = state.selectedBlock.get();
					if (!selectedBlock) return;

					const mouseSurface = mouse.TargetSurface;
					const normal = Vector3.FromNormalId(mouseSurface);

					let pressPosition = mouse.Hit.Position;
					pressPosition = constrainPositionToGrid(pressPosition);
					pressPosition = addBlockSize(selectedBlock, normal, pressPosition);

					parent.set(
						new Desktop(
							pressPosition,
							selectedBlock,
							state.selectedColor.get(),
							state.selectedMaterial.get(),
						),
					);
				}, false),
			);
		}
		constructor(
			pressPosition: Vector3,
			selectedBlock: RegistryBlock,
			selectedColor: Color3,
			selectedMaterial: Enum.Material,
		) {
			super();
			this.pressPosition = pressPosition;
			this.selectedBlock = selectedBlock;
			this.selectedColor = selectedColor;
			this.selectedMaterial = selectedMaterial;

			const updateGhosts = () => {
				const cameraPostion = Workspace.CurrentCamera!.CFrame.Position;
				const hit = mouse.Hit.Position;
				const clickDirection = cameraPostion.sub(hit).Unit;

				const pos = this.getPositionOnBuildingPlane(this.pressPosition, cameraPostion, clickDirection);
				const positionsData = this.calculateGhostBlockPositions(
					this.selectedBlock.model,
					this.pressPosition,
					pos,
				);
				if (!positionsData) return;
				if (this.oldPositions?.Positions === positionsData.Positions) return;

				const oldPositions = this.oldPositions?.Positions ?? new Set();
				const newPositions = positionsData.Positions;

				const toDelete = oldPositions.filter((p) => !newPositions.has(p));
				for (const pos of toDelete) {
					this.drawnGhostsMap.get(pos)?.model.Destroy();
					this.drawnGhostsMap.delete(pos);
				}

				const newposs = newPositions.filter((p) => !oldPositions.has(p));
				const models = this.drawModels(newposs);
				if (!models) return;
				for (const model of models) {
					this.drawnGhostsMap.set(model.model.GetPivot().Position, model);
				}

				this.oldPositions = positionsData;
			};

			this.event.subscribe(mouse.Button1Up, async () => {
				const result = await this.placeBlocks();
				if (result && !result.success) {
					LogControl.instance.addLine(result.message, Colors.red);
				}

				this.destroy();
			});

			this.event.subscribe(mouse.Move, updateGhosts);
			this.event.subInput((ih) => ih.onKeyDown("R", () => this.rotateFillAxis()));
			this.onDestroy(() => {
				for (const [, ghost] of this.drawnGhostsMap) {
					ghost.model.Destroy();
				}
			});

			this.onEnable(updateGhosts);
		}

		private drawModels(positions: readonly Vector3[]) {
			const allGhosts: BlockGhost[] = [];

			for (const pos of positions) {
				const ghostFrame = new CFrame(pos);
				const ghost = createBlockGhost(this.selectedBlock);
				ghost.model.PivotTo(ghostFrame);
				allGhosts.push(ghost);
			}

			return allGhosts;
		}

		private calculateGhostBlockPositions(part: BlockModel, from: Vector3, to: Vector3): typeof this.oldPositions {
			const blockSize = AABB.fromModel(part).getSize();
			const diff = to.sub(from);
			const toX = math.min(math.abs(diff.X), this.fillLimit);
			const toY = math.min(math.abs(diff.Y), this.fillLimit);
			const toZ = math.min(math.abs(diff.Z), this.fillLimit);
			const result: Vector3[] = [];
			if (this.oldPositions?.endPoint === to) return this.oldPositions;
			for (let x = 0; x <= toX; x += blockSize.X)
				for (let y = 0; y <= toY; y += blockSize.Y)
					for (let z = 0; z <= toZ; z += blockSize.Z) {
						const posX = math.sign(diff.X) * x + from.X;
						const posY = math.sign(diff.Y) * y + from.Y;
						const posZ = math.sign(diff.Z) * z + from.Z;
						result.push(new Vector3(posX, posY, posZ));
					}
			return {
				Positions: new Set(result),
				endPoint: to ?? from,
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
			const result = lookVector.mul(-distance).add(cameraPostion);
			return result;
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

			const blocks = this.drawnGhostsMap.map((_, m) => m.model);
			const plot = SharedPlots.getPlotByPosition(blocks[0].GetPivot().Position);
			if (!plot) {
				LogControl.instance.addLine("Out of bounds!", Colors.red);
				SoundController.getSounds().Build.BlockPlaceError.Play();
				return;
			}

			const plotRegion = SharedPlots.getPlotBuildingRegion(plot);
			const blocksRegion = AABB.fromModels(blocks);
			if (!plotRegion.contains(blocksRegion)) {
				LogControl.instance.addLine("Out of bounds!", Colors.red);
				SoundController.getSounds().Build.BlockPlaceError.Play();
				return;
			}

			if (!SharedPlots.isBuildingAllowed(plot, Players.LocalPlayer)) {
				LogControl.instance.addLine("Building not allowed!", Colors.red);
				SoundController.getSounds().Build.BlockPlaceError.Play();
				return;
			}

			const response = await ActionController.instance.executeOperation(
				"Block placement",
				async () => {
					const blocks: BlockModel[] = [];
					for (const block of blocks) {
						const b = BuildingManager.getBlockByPosition(block.GetPivot().Position);
						if (b) blocks.push(b);
					}

					if (blocks.size() !== 0) {
						await BuildingController.deleteBlock(blocks!);
					}
				},
				{
					plot,
					blocks: blocks.map((b) => ({
						id: this.selectedBlock.id,
						color: this.selectedColor,
						material: this.selectedMaterial,
						location: b.GetPivot(),
					})),
				},
				async (info) => await BuildingController.placeBlocks(info),
			);

			if (response.success) {
				// Play sound
				SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
				SoundController.getSounds().Build.BlockPlace.Play();

				task.wait();
			} else {
				Logger.error(response.message);
				SoundController.getSounds().Build.BlockPlaceError.Play();
			}

			return response;
		}
	}
}

/** A tool for building in the world with blocks */
export default class BuildTool2 extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);
	readonly targetPlot = new ObservableValue<PlotModel | undefined>(undefined);
	private readonly currentMode = new ComponentChild<IComponent>(this, true);

	constructor(mode: BuildingMode) {
		super(mode);
		this.targetPlot.subscribe((plot) => mode.mirrorVisualizer.plot.set(plot));

		this.currentMode.childSet.Connect((mode) => {
			if (!this.isEnabled()) return;
			if (mode) return;
			this.currentMode.set(new SinglePlaceController.Desktop(this));
		});
		this.onEnable(() => this.currentMode.set(new SinglePlaceController.Desktop(this)));

		MultiPlaceController.Desktop.subscribe(this, this.currentMode);
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

	disable(): void {
		this.targetPlot.set(undefined);
		super.disable();
	}

	getDisplayName(): string {
		return "Building (TEST)";
	}
	getImageID(): string {
		return "rbxassetid://12539295858";
	}

	getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		const keys: { key: Enum.KeyCode; text: string }[] = [];

		keys.push({ key: Enum.KeyCode.ButtonX, text: "Place" });
		keys.push({ key: Enum.KeyCode.ButtonB, text: "Unequip" });
		keys.push({ key: Enum.KeyCode.ButtonSelect, text: "Select block" });
		keys.push({ key: Enum.KeyCode.DPadLeft, text: "Rotate by X" });
		keys.push({ key: Enum.KeyCode.DPadUp, text: "Rotate by Y" });
		keys.push({ key: Enum.KeyCode.DPadRight, text: "Rotate by Z" });

		return keys;
	}

	getKeyboardTooltips() {
		const keys: { keys: string[]; text: string }[] = [];

		keys.push({ keys: ["R"], text: "Rotate by Y" });
		keys.push({ keys: ["T"], text: "Rotate by X" });
		keys.push({ keys: ["Y"], text: "Rotate by Z" });

		return keys;
	}
}
