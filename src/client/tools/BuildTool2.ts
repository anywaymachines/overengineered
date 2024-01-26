import { Players, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import InputController from "client/controller/InputController";
import SoundController from "client/controller/SoundController";
import BuildingMode from "client/controller/modes/BuildingMode";
import Signals from "client/event/Signals";
import MaterialChooserControl from "client/gui/buildmode/MaterialChooser";
import LogControl from "client/gui/static/LogControl";
import Logger from "shared/Logger";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

type BlockGhost = { readonly model: BlockModel; readonly highlight: Highlight };

/** A tool for building in the world with blocks */
export default class BuildTool2 extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<Block | undefined>(undefined);

	private readonly allowedColor = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor = Color3.fromRGB(255, 189, 189);

	private mainGhost?: BlockGhost;
	private readonly mirroredGhosts: BlockGhost[] = [];
	private blockRotation = CFrame.identity;

	private readonly targetPlot = new ObservableValue<PlotModel | undefined>(undefined);

	constructor(mode: BuildingMode) {
		super(mode);

		this.targetPlot.subscribe((plot) => mode.mirrorVisualizer.plot.set(plot));

		this.selectedMaterial.bindTo(MaterialChooserControl.instance.selectedMaterial);
		this.selectedColor.bindTo(MaterialChooserControl.instance.selectedColor);

		this.event.onPrepare((input) => {
			if (input !== "Touch") return;

			this.inputHandler.onTouchTap(() => this.updateBlockPosition());
		});
		this.event.onPrepare(() => this.updateBlockPosition());

		this.event.subscribe(Signals.CAMERA.MOVED, () => this.updateBlockPosition());
		this.event.subscribe(this.mouse.Move, () => this.updateBlockPosition());
		this.event.subscribe(Signals.BLOCKS.BLOCK_ADDED, () => this.updateBlockPosition());
		this.event.subscribe(Signals.BLOCKS.BLOCK_REMOVED, () => this.updateBlockPosition());

		this.event.subscribe(this.mouse.Button1Down, () => this.placeBlock());

		this.event.onPrepare(() => {
			this.inputHandler.onKeyDown(Enum.KeyCode.T, () => this.rotateBlock("x"));
			this.inputHandler.onKeyDown(Enum.KeyCode.R, () => this.rotateBlock("y"));
			this.inputHandler.onKeyDown(Enum.KeyCode.Y, () => {
				if (InputController.isCtrlPressed()) return;
				this.rotateBlock("z");
			});
		});

		this.event.subscribeObservable(this.selectedBlock, () => this.destroyGhosts());
	}

	public disable(): void {
		this.destroyGhosts();
		this.targetPlot.set(undefined);
		super.disable();
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

	private createBlockHighlight(block: Model) {
		const highlight = new Instance("Highlight");
		highlight.Name = "BlockHighlight";
		highlight.Parent = block;
		highlight.Adornee = block;
		highlight.FillTransparency = 0.4;
		highlight.OutlineTransparency = 0.5;
		highlight.DepthMode = Enum.HighlightDepthMode.Occluded;

		return highlight;
	}

	private createBlockGhost(block: Block): BlockGhost {
		const model = block.model.Clone();
		model.Parent = Workspace;

		PartUtils.switchDescendantsMaterial(model, this.selectedMaterial.get());
		PartUtils.switchDescendantsColor(model, this.selectedColor.get());
		// this.addAxisModel(model);

		const highlight = this.createBlockHighlight(model);

		return { model, highlight };
	}

	private updateBlockPosition() {
		const selected = this.selectedBlock.get();
		if (!selected) return;

		const getMouseTargetBlockPosition = () => {
			const g = (
				this.gameUI as ScreenGui & {
					BuildingMode: {
						Tools: {
							BuildTool2Gui: {
								Debug: {
									Label1: TextLabel;
									Label2: TextLabel;
									Label3: TextLabel;
									Label4: TextLabel;
								};
							};
						};
					};
				}
			).BuildingMode.Tools.BuildTool2Gui.Debug;

			const constrainPositionToGrid = (pos: Vector3) => {
				const constrain = math.round;
				return new Vector3(constrain(pos.X), constrain(pos.Y), constrain(pos.Z));
			};
			const addBlockSize = (pos: Vector3) => {
				return pos.add(selected.model.GetBoundingBox()[1].mul(normal).div(2));
			};

			const mouseTarget = this.mouse.Target;
			if (!mouseTarget) return undefined;

			const mouseHit = this.mouse.Hit;
			const mouseSurface = this.mouse.TargetSurface;

			const globalMouseHitPos = mouseHit.PointToWorldSpace(Vector3.zero);
			const normal = Vector3.FromNormalId(mouseSurface);

			g.Label1.Text = `Target: ${mouseTarget}`;
			g.Label2.Text = `Hit: ${mouseHit}`;
			g.Label3.Text = `Normal: ${mouseSurface} ${normal}`;
			g.Label4.Text = `Block size mnd: ${selected.model.GetBoundingBox()[1].mul(normal).div(2)}`;

			let targetPosition = globalMouseHitPos;
			targetPosition = addBlockSize(targetPosition);
			targetPosition = constrainPositionToGrid(targetPosition);
			return targetPosition;
		};
		const updateMirrorGhostBlocksPosition = (plot: Model, mainPosition: Vector3) => {
			const mirrorCFrames = BuildingManager.getMirroredBlocksCFrames(
				plot,
				new CFrame(mainPosition).mul(this.blockRotation),
				this.mirrorMode.get(),
			);

			for (let i = 0; i < mirrorCFrames.size(); i++) {
				const ghost = (this.mirroredGhosts[i] ??= this.createBlockGhost(selected));
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

		this.mainGhost ??= this.createBlockGhost(selected);
		this.mainGhost.model!.PivotTo(this.blockRotation.add(mainPosition));

		if (plot) {
			updateMirrorGhostBlocksPosition(plot, mainPosition);
		} else {
			this.destroyGhosts(false);
		}

		const canBePlaced =
			plot &&
			[...this.mirroredGhosts, this.mainGhost].find(
				(ghost) =>
					!BuildingManager.blockCanBePlacedAt(plot, ghost.model, ghost.model.GetPivot(), Players.LocalPlayer),
			) === undefined;

		PartUtils.ghostModel(this.mainGhost.model, canBePlaced ? this.allowedColor : this.forbiddenColor);
		for (const ghost of this.mirroredGhosts) {
			PartUtils.ghostModel(ghost.model, canBePlaced ? this.allowedColor : this.forbiddenColor);
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

		SoundController.getSounds().BuildingMode.BlockRotate.PlaybackSpeed = SoundController.randomSoundSpeed();
		SoundController.getSounds().BuildingMode.BlockRotate.Play();

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
			LogControl.instance.addLine("Out of bounds!", Color3.fromRGB(255, 100, 100));

			// Play sound
			SoundController.getSounds().BuildingMode.BlockPlaceError.Play();

			return;
		}

		const mainGhost = this.mainGhost;
		if (!mainGhost || !mainGhost.model.PrimaryPart) {
			return;
		}

		const pos = mainGhost.model.PrimaryPart.CFrame;
		const mirrors = this.mirrorMode.get();
		const response = await ActionController.instance.executeOperation(
			"Block placement",
			async () => {
				let cframes = BuildingManager.getMirroredBlocksCFrames(
					SharedPlots.getPlotByPosition(pos.Position)!,
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
			[mainGhost, ...this.mirroredGhosts].map(
				(g): PlaceBlockRequest => ({
					id: selected.id,
					color: this.selectedColor.get(),
					material: this.selectedMaterial.get(),
					location: g.model.PrimaryPart!.CFrame,
					plot: this.targetPlot.get()!,
				}),
			),
			async (infos) => {
				for (const info of infos) {
					const result = await BuildingController.placeBlock(info);
					if (!result.success) return result;
				}

				return { success: true };
			},
		);

		if (response.success) {
			// Play sound
			SoundController.getSounds().BuildingMode.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().BuildingMode.BlockPlace.Play();

			task.wait();
			this.updateBlockPosition();
		} else {
			Logger.error(response.message);
			SoundController.getSounds().BuildingMode.BlockPlaceError.Play();
		}
	}

	getDisplayName(): string {
		return "Build tool 2 (test, use on your own risk lmao)";
	}
	getImageID(): string {
		return "rbxassetid://12539295858";
	}
	getShortDescription(): string {
		return "Place blocks in the world";
	}

	public getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		const keys: { key: Enum.KeyCode; text: string }[] = [];

		keys.push({ key: Enum.KeyCode.ButtonX, text: "Place" });
		keys.push({ key: Enum.KeyCode.ButtonB, text: "Unequip" });
		keys.push({ key: Enum.KeyCode.ButtonSelect, text: "Select block" });
		keys.push({ key: Enum.KeyCode.DPadLeft, text: "Rotate by X" });
		keys.push({ key: Enum.KeyCode.DPadUp, text: "Rotate by Y" });
		keys.push({ key: Enum.KeyCode.DPadRight, text: "Rotate by Z" });

		return keys;
	}

	public getKeyboardTooltips() {
		const keys: { keys: string[]; text: string }[] = [];

		keys.push({ keys: ["R"], text: "Rotate by Y" });
		keys.push({ keys: ["T"], text: "Rotate by X" });
		keys.push({ keys: ["Y"], text: "Rotate by Z" });

		return keys;
	}
}
