import { Players, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import SoundController from "client/controller/SoundController";
import BuildingMode from "client/controller/modes/BuildingMode";
import Signals from "client/event/Signals";
import LogControl from "client/gui/static/LogControl";
import MaterialChooserControl from "client/gui/tools/MaterialChooser";
import Logger from "shared/Logger";
import Objects from "shared/_fixes_/objects";
import BuildingManager, { MirrorBlocksCFrames } from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

type BlockGhost = { readonly model: Model; readonly highlight: Highlight };
type BlockGhosts = {
	Main?: BlockGhost;

	X?: BlockGhost;
	Y?: BlockGhost;
	Z?: BlockGhost;

	XZ?: BlockGhost;
	XY?: BlockGhost;
	YZ?: BlockGhost;

	XYZ?: BlockGhost;
};

/** A tool for building in the world with blocks */
export default class BuildTool2 extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<Block | undefined>(undefined);

	private readonly allowedColor = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor = Color3.fromRGB(255, 189, 189);

	private readonly ghosts: BlockGhosts = {};
	private blockRotation = CFrame.identity;

	constructor(mode: BuildingMode) {
		super(mode);

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
	}

	public disable(): void {
		this.destroyGhosts();
		super.disable();
	}

	private destroyGhosts() {
		this.blockRotation = CFrame.identity;

		for (const [key, ghost] of Objects.entries(this.ghosts)) {
			ghost.model?.Destroy();
			delete this.ghosts[key];
		}
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
		PartUtils.ghostModel(model);
		// this.addAxisModel(model);

		const highlight = this.createBlockHighlight(model);

		return { model, highlight };
	}

	private updateBlockPosition() {
		const selected = this.selectedBlock.get();
		if (!selected) return;

		const getMouseTargetBlockPosition = () => {
			const constrainPositionToGrid = (pos: Vector3) => {
				const constrain = (num: number) => math.round(num);
				return new Vector3(constrain(pos.X), constrain(pos.Y), constrain(pos.Z));
			};

			const mouseTarget = this.mouse.Target;
			if (!mouseTarget) return undefined;

			const mouseHit = this.mouse.Hit;
			const mouseSurface = this.mouse.TargetSurface;

			const globalMouseHitPos = mouseHit.PointToWorldSpace(Vector3.zero);
			const normal = Vector3.FromNormalId(mouseSurface);

			let targetPosition = globalMouseHitPos.add(normal);
			targetPosition = constrainPositionToGrid(targetPosition);
			return targetPosition;
		};
		const deleteMirrorGhosts = () => {
			for (const [key, ghost] of Objects.entries(this.ghosts)) {
				if (key === "Main") continue;

				ghost?.model.Destroy();
				delete this.ghosts[key];
			}
		};
		const updateMirrorGhostBlocksPosition = (plot: Model, mainPosition: Vector3) => {
			const mirrorCFrames = BuildingManager.getBlocksCFramesWithMirrored(
				plot,
				mainPosition,
				this.mirrorMode.get(),
			);

			const set = (key: keyof MirrorBlocksCFrames & keyof BlockGhosts) => {
				const pos = mirrorCFrames[key];
				if (!pos) return;

				(this.ghosts[key] ??= this.createBlockGhost(selected)).model.PivotTo(pos);
			};

			set("X");
			set("Y");
			set("Z");

			set("XY");
			set("YZ");
			set("XZ");

			set("XYZ");
		};

		const mainPosition = getMouseTargetBlockPosition();
		if (!mainPosition) return;

		const plot = SharedPlots.getPlotByPosition(mainPosition);

		this.ghosts.Main ??= this.createBlockGhost(selected);
		this.ghosts.Main.model!.PivotTo(new CFrame(mainPosition));

		if (plot) {
			updateMirrorGhostBlocksPosition(plot, mainPosition);
		} else {
			deleteMirrorGhosts();
		}

		const canBePlaced =
			Objects.values(this.ghosts).find(
				(ghost) => !BuildingManager.blockCanBePlacedAt(ghost.model.GetPivot().Position, Players.LocalPlayer),
			) === undefined;

		for (const ghost of Objects.values(this.ghosts)) {
			ghost.highlight.FillColor = canBePlaced ? this.allowedColor : this.forbiddenColor;
		}
	}

	rotateBlock(axis: "x" | "y" | "z", inverted: boolean): void {
		//
	}

	async placeBlock() {
		const selected = this.selectedBlock.get();

		// ERROR: Block is not selected
		if (!selected) {
			LogControl.instance.addLine("Block is not selected!");
			return;
		}

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		const preview = this.ghosts.Main;
		if (!preview || !preview.model.PrimaryPart) {
			return;
		}

		const pos = preview.model.PrimaryPart.CFrame.Position;
		const mirrors = this.mirrorMode.get();
		const response = await ActionController.instance.executeOperation(
			"Block placement",
			async () => {
				const cframes = BuildingManager.getBlocksCFramesWithMirrored(
					SharedPlots.getPlotByPosition(pos)!,
					pos,
					mirrors,
				);

				const blocks: Model[] = [];
				for (const cframe of Objects.values(cframes)) {
					const block = BuildingManager.getBlockByPosition(cframe.Position);
					if (block) blocks.push(block);
				}

				if (blocks.size() !== 0) await BuildingController.deleteBlock(blocks!);
			},
			Objects.values(this.ghosts).map((g) => ({
				block: selected.id,
				color: this.selectedColor.get(),
				material: this.selectedMaterial.get(),
				location: g.model.PrimaryPart!.CFrame,
			})),
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
		return "Build tool 2 (test)";
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
