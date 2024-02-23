import { Players, Workspace } from "@rbxts/services";
import InputController from "client/controller/InputController";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import LogControl from "client/gui/static/LogControl";
import ActionController from "client/modes/build/ActionController";
import BuildingController from "client/modes/build/BuildingController";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
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

	private readonly allowedColor = Colors.blue;
	private readonly forbiddenColor = Colors.red;

	private mainGhost?: BlockGhost;
	private readonly mirroredGhosts: BlockGhost[] = [];
	private blockRotation = CFrame.identity;

	//samlovebutter's code starts here
	private fillRotation = CFrame.identity;
	private nowFillingArea = false;
	//samlovebutter's code ends here

	private readonly targetPlot = new ObservableValue<PlotModel | undefined>(undefined);

	constructor(mode: BuildingMode) {
		super(mode);

		this.targetPlot.subscribe((plot) => mode.mirrorVisualizer.plot.set(plot));

		this.onPrepare((input) => {
			if (input !== "Touch") return;

			this.inputHandler.onTouchTap(() => this.updateBlockPosition());
		});
		this.event.onPrepare(() => this.updateBlockPosition());

		this.event.subscribe(Signals.CAMERA.MOVED, () => this.updateBlockPosition());
		this.event.subscribe(this.mouse.Move, () => this.updateBlockPosition());
		this.event.subscribe(Signals.BLOCKS.BLOCK_ADDED, () => this.updateBlockPosition());
		this.event.subscribe(Signals.BLOCKS.BLOCK_REMOVED, () => this.updateBlockPosition());

		//samlovebutter's code starts here
		let pressPosition: Vector3 = Vector3.zero;
		let drawnModelsPositions: Map<CFrame, BlockGhost> = new Map<CFrame, BlockGhost>();

		this.event.subscribe(this.mouse.Button1Down, () => {
			pressPosition = this.mouse.Hit.Position;
			this.nowFillingArea = true;
		});

		this.event.subscribe(this.mouse.Button1Up, async () => {
			this.nowFillingArea = false;
			for (const [position, ghost] of drawnModelsPositions) {
				const result = await BuildingController.placeBlock({
					id: this.selectedBlock.get()!.id,
					color: this.selectedColor.get(),
					material: this.selectedMaterial.get(),
					location: position,
					plot: this.targetPlot.get()!,
				});
				if (!result.success) {
					LogControl.instance.addLine(result.message, Colors.red);
				}

				ghost.model.Destroy();
			}
		});

		this.event.subscribe(this.mouse.Move, () => {
			const pos = this.mouse.Hit.Position; //replace with position on the filling plane <------------------------------------------ main problem
			const models = this.drawModels(this.selectedBlock.get()?.model, pressPosition, pos);
			if (models) drawnModelsPositions = models;
		});
		//samlovebutter's code ends here

		this.event.subscribe(this.mouse.Button1Up, () => this.placeBlock());
		this.event.onPrepare(() => {
			this.inputHandler.onKeyDown("T", () =>
				!this.nowFillingArea ? this.rotateBlock("x") : this.rotateFillAxis("x"),
			);
			this.inputHandler.onKeyDown("R", () =>
				!this.nowFillingArea ? this.rotateBlock("y") : this.rotateFillAxis("y"),
			);
			this.inputHandler.onKeyDown("Y", () => {
				if (this.nowFillingArea) {
					this.rotateFillAxis("z");
					return;
				}
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

	//samlovebutter's code starts here
	private drawModels(part: BlockModel | undefined, from: Vector3, to: Vector3) {
		if (!part) return;
		const selectedBlock = this.selectedBlock.get();
		if (!selectedBlock) return;
		const [frame, blockSize] = part.GetBoundingBox(); //get sizes
		const diff = to.sub(from);
		const allGhosts: Map<CFrame, BlockGhost> = new Map<CFrame, BlockGhost>();
		const rotation = this.fillRotation;
		//get cursor position on the plane

		for (let x = 0; x < diff.X; x += blockSize.X)
			for (let y = 0; y < diff.Y; y += blockSize.Y)
				for (let z = 0; z < diff.Z; z += blockSize.Z) {
					const ghostFrame = new CFrame(frame.Position.add(new Vector3(x, y, z))).mul(frame.Rotation);
					allGhosts.set(ghostFrame, this.createBlockGhost(selectedBlock));
				}

		return allGhosts;
	}

	private rotateFillAxis(axis: "x" | "y" | "z") {
		//todo finish
	}
	//samlovebutter's code ends here

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
							Build2: {
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
			).BuildingMode.Tools.Build2.Debug;

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
			SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Build.BlockPlace.Play();

			task.wait();
			this.updateBlockPosition();
		} else {
			Logger.error(response.message);
			SoundController.getSounds().Build.BlockPlaceError.Play();
		}
	}

	getDisplayName(): string {
		return "Building (TEST)";
	}
	getImageID(): string {
		return "rbxassetid://12539295858";
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
