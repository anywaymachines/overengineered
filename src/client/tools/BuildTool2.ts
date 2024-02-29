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
import { Arrays } from "shared/fixes/Arrays";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";
import VectorUtils from "shared/utils/VectorUtils";

type BlockGhost = { readonly model: BlockModel; readonly highlight: Highlight };

/** A tool for building in the world with blocks */
export default class BuildTool2 extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);

	private readonly allowedColor = Colors.blue;
	private readonly forbiddenColor = Colors.red;

	private mainGhost?: BlockGhost;
	private readonly mirroredGhosts: BlockGhost[] = [];
	private blockRotation = CFrame.identity;

	//samlovebutter's code starts here
	private possibleFillRotationAxis = [Vector3.yAxis, Vector3.xAxis, Vector3.zAxis];
	private fillRotationMode = 0;
	private nowFillingArea = false;
	//private debugPrefab = ReplicatedStorage.Assets.CenterOfMass.Clone();
	//samlovebutter's code ends here

	private readonly targetPlot = new ObservableValue<PlotModel | undefined>(undefined);

	constructor(mode: BuildingMode) {
		super(mode);

		//this.debugPrefab.Parent = Workspace;
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
		let drawnModelsPositions: Set<BlockGhost> = new Set<BlockGhost>();

		const updateGhosts = () => {
			if (!this.nowFillingArea) return;
			for (const ghost of drawnModelsPositions) ghost.model.Destroy(); //replace with optimisation later

			const cameraPostion = Workspace.CurrentCamera!.CFrame.Position;
			const hit = this.mouse.Hit.Position;
			const clickDirection = cameraPostion.sub(hit).Unit;

			const pos = this.getPositionOnBuildingPlane(pressPosition, cameraPostion, clickDirection);
			//detect pos change?
			//somehow detect which block is outa distance?
			//create new ghost otherwise
			const models = this.drawModels(this.selectedBlock.get()?.model, pressPosition, pos);
			if (!models) return;
			//if(!models.size) models.add(this.createBlockGhost(this.selectedBlock.get()));
			drawnModelsPositions = models;

			/*
			print(drawnModelsPositions.size(), models.size());
			print(drawnModelsPositions.size() > models.size() ? "more" : "less");

			const pos1 = new Set<Vector3>();
			const pos2 = new Set<Vector3>();

			drawnModelsPositions.forEach((v) => pos2.add(v.model.GetPivot().Position));
			models.forEach((v) => pos2.add(v.model.GetPivot().Position));

			if (drawnModelsPositions.size() > models.size()) {
				//find ghosts on same positions
				const samePos: Vector3[] = [];
				for (const block of pos1) {
					if (pos2.has(block)) samePos.push(block);
				}

				for (const block of drawnModelsPositions)
					if (samePos.includes(block.model.GetPivot().Position)) {
						block.model.Destroy();
					}
			}

			if (drawnModelsPositions.size() < models.size()) {
				//find ghost with positions that is not in
				const newPos: Vector3[] = [];
				for (const block of pos2) {
					if (!pos1.has(block)) newPos.push(block);
				}

				for (const block of models)
					if (newPos.includes(block.model.GetPivot().Position)) {
						print(block);
						drawnModelsPositions.add(block);
						break;
					}
			}
			*/
		};

		this.event.subscribe(this.mouse.Button1Down, () => {
			const block = this.selectedBlock.get();
			if (!block) return;
			pressPosition = this.constrainPositionToGrid(this.mouse.Hit.Position);
			const mouseSurface = this.mouse.TargetSurface;
			const normal = Vector3.FromNormalId(mouseSurface);
			pressPosition = this.addBlockSize(block, normal, pressPosition);
			this.nowFillingArea = true;
			updateGhosts();
		});

		this.onDisable(() => (this.nowFillingArea = false));
		this.event.subscribe(this.mouse.Button1Up, async () => {
			this.nowFillingArea = false;
			const result = await this.placeBlocks(Arrays.mapSet(drawnModelsPositions, (m) => m.model));
			if (result && !result.success) {
				LogControl.instance.addLine(result.message, Colors.red);
			}

			for (const ghost of drawnModelsPositions) {
				ghost.model.Destroy();
			}
		});

		this.event.subscribe(this.mouse.Move, updateGhosts);
		//samlovebutter's code ends here

		this.event.subscribe(this.mouse.Button1Up, () => (!this.nowFillingArea ? this.placeBlock() : undefined));
		this.event.onPrepare(() => {
			this.inputHandler.onKeyDown("T", () => this.rotateBlock("x"));
			this.inputHandler.onKeyDown("R", () =>
				this.nowFillingArea ? this.rotateFillAxis() : this.rotateBlock("y"),
			);
			this.inputHandler.onKeyDown("Y", () => {
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
		//this.debugPrefab.MoveTo(to); //remove later
		const blockSize = BuildingManager.getModelAABB(part).Size;
		const allGhosts: Set<BlockGhost> = new Set<BlockGhost>();

		const diff = to.sub(from);
		const toX = math.min(math.abs(diff.X), 32);
		const toY = math.min(math.abs(diff.Y), 32);
		const toZ = math.min(math.abs(diff.Z), 32);

		for (let x = 0; x <= toX; x += blockSize.X)
			for (let y = 0; y <= toY; y += blockSize.Y)
				for (let z = 0; z <= toZ; z += blockSize.Z) {
					const posX = math.sign(diff.X) * x + from.X;
					const posY = math.sign(diff.Y) * y + from.Y;
					const posZ = math.sign(diff.Z) * z + from.Z;
					const ghostFrame = new CFrame(new Vector3(posX, posY, posZ));
					const ghost = this.createBlockGhost(selectedBlock);
					ghost.model.PivotTo(ghostFrame);
					allGhosts.add(ghost);
				}
		return allGhosts;
	}

	private rotateFillAxis() {
		this.fillRotationMode = (this.fillRotationMode + 1) % this.possibleFillRotationAxis.size();
	}

	private getCurrentFillRotation() {
		return this.possibleFillRotationAxis[this.fillRotationMode];
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

	private createBlockGhost(block: RegistryBlock): BlockGhost {
		const model = block.model.Clone();
		model.Parent = Workspace;

		PartUtils.switchDescendantsMaterial(model, this.selectedMaterial.get());
		PartUtils.switchDescendantsColor(model, this.selectedColor.get());
		// this.addAxisModel(model);

		const highlight = this.createBlockHighlight(model);

		return { model, highlight };
	}

	private constrainPositionToGrid(pos: Vector3) {
		const constrain = math.round;
		return new Vector3(constrain(pos.X), constrain(pos.Y), constrain(pos.Z));
	}

	private addBlockSize(selectedBlock: RegistryBlock, normal: Vector3, pos: Vector3) {
		return pos.add(selectedBlock.model.GetBoundingBox()[1].mul(normal).div(2));
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
			targetPosition = this.addBlockSize(selected, normal, targetPosition);
			targetPosition = this.constrainPositionToGrid(targetPosition);
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

	async placeBlocks(blocks: readonly Model[]) {
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

		const plot = SharedPlots.getPlotByPosition(blocks[0].GetPivot().Position);
		if (!plot) {
			LogControl.instance.addLine("Out of bounds!", Colors.red);
			SoundController.getSounds().Build.BlockPlaceError.Play();
			return;
		}

		const plotRegion = SharedPlots.getPlotBuildingRegion(plot);
		const blocksRegion = BuildingManager.getBlocksAABB(blocks);
		if (!VectorUtils.isRegion3InRegion3(blocksRegion, plotRegion)) {
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
					id: selected.id,
					color: this.selectedColor.get(),
					material: this.selectedMaterial.get(),
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
			this.updateBlockPosition();
		} else {
			Logger.error(response.message);
			SoundController.getSounds().Build.BlockPlaceError.Play();
		}

		return response;
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
