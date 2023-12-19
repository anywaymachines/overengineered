import { Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import BuildingMode from "client/controller/modes/BuildingMode";
import Signals from "client/event/Signals";
import MaterialChooserControl from "client/gui/tools/MaterialChooser";
import Objects from "shared/_fixes_/objects";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";

type MirroredGhosts = {
	X?: Model;
	Y?: Model;
	Z?: Model;

	XZ?: Model;
	XY?: Model;
	YZ?: Model;

	XYZ?: Model;
};

/** A tool for building in the world with blocks */
export default class BuildTool2 extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly selectedBlock = new ObservableValue<Block | undefined>(undefined);

	private mainGhost: Model | undefined;
	private readonly mirroredGhosts: MirroredGhosts = {};
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
	}

	public disable(): void {
		this.destroyGhosts();
		super.disable();
	}

	private destroyGhosts() {
		this.mainGhost?.Destroy();
		this.mainGhost = undefined;

		this.blockRotation = CFrame.identity;

		for (const [key, ghost] of Objects.entries(this.mirroredGhosts)) {
			ghost?.Destroy();
			delete this.mirroredGhosts[key];
		}
	}

	private createBlockGhost(block: Block) {
		const model = block.model.Clone();
		model.Parent = Workspace;

		// this.addAxisModel(model);
		// this.addHighlight(model);
		PartUtils.switchDescendantsMaterial(model, this.selectedMaterial.get());
		PartUtils.switchDescendantsColor(model, this.selectedColor.get());
		PartUtils.ghostModel(model);

		return model;
	}

	private updateBlockPosition() {
		const selected = this.selectedBlock.get();
		if (!selected) return;

		const getMouseTargetBlockPosition = () => {
			const mouseTarget = this.mouse.Target;
			if (!mouseTarget) return undefined;

			const mouseHit = this.mouse.Hit;
			const mouseSurface = this.mouse.TargetSurface;

			const globalMouseHitPos = mouseHit.PointToWorldSpace(Vector3.zero);
			const normal = Vector3.FromNormalId(mouseSurface);

			const targetPosition = globalMouseHitPos.add(normal);
			return targetPosition;
		};
		const constrainPositionToGrid = (pos: Vector3) => {
			const constrain = (num: number) => math.round(num);
			return new Vector3(constrain(pos.X), constrain(pos.Y), constrain(pos.Z));
		};
		const createMirrorBlocksIfNeeded = () => {
			const mirror = this.mirrorMode.get();

			const x = mirror.X !== undefined;
			const y = mirror.Y !== undefined;
			const z = mirror.Z !== undefined;

			if (x) this.mirroredGhosts.X ??= this.createBlockGhost(selected);
			if (y) this.mirroredGhosts.Y ??= this.createBlockGhost(selected);
			if (z) this.mirroredGhosts.Z ??= this.createBlockGhost(selected);
			if (x && y) this.mirroredGhosts.XY ??= this.createBlockGhost(selected);
			if (y && z) this.mirroredGhosts.YZ ??= this.createBlockGhost(selected);
			if (x && z) this.mirroredGhosts.XZ ??= this.createBlockGhost(selected);
			if (x && y && z) this.mirroredGhosts.XYZ ??= this.createBlockGhost(selected);
		};
		const updateMirrorBlocksPosition = (mainPosition: Vector3) => {
			const mirror = this.mirrorMode.get();

			const plot = SharedPlots.getPlotByPosition(mainPosition);
			if (!plot) return;

			const center = plot.GetPivot().Position.add(new Vector3(mirror.X ?? 0, mirror.Y ?? 0, mirror.Z ?? 0));
			const offsetx2 = mainPosition.sub(center).mul(-2);

			this.mirroredGhosts.X?.PivotTo(new CFrame(mainPosition.add(new Vector3(offsetx2.X, 0, 0))));
			this.mirroredGhosts.Y?.PivotTo(new CFrame(mainPosition.add(new Vector3(0, offsetx2.Y, 0))));
			this.mirroredGhosts.Z?.PivotTo(new CFrame(mainPosition.add(new Vector3(0, 0, offsetx2.Z))));

			this.mirroredGhosts.XY?.PivotTo(new CFrame(mainPosition.add(new Vector3(offsetx2.X, offsetx2.Y, 0))));
			this.mirroredGhosts.YZ?.PivotTo(new CFrame(mainPosition.add(new Vector3(0, offsetx2.Y, offsetx2.Z))));
			this.mirroredGhosts.XZ?.PivotTo(new CFrame(mainPosition.add(new Vector3(offsetx2.X, 0, offsetx2.Z))));

			this.mirroredGhosts.XYZ?.PivotTo(new CFrame(mainPosition.add(offsetx2)));
		};

		let mainPosition = getMouseTargetBlockPosition();
		if (!mainPosition) return;

		mainPosition = constrainPositionToGrid(mainPosition);

		this.mainGhost ??= this.createBlockGhost(selected);
		this.mainGhost!.PivotTo(new CFrame(mainPosition));

		createMirrorBlocksIfNeeded();
		updateMirrorBlocksPosition(mainPosition);
	}

	rotateBlock(axis: "x" | "y" | "z", inverted: boolean): void {
		//
	}

	placeBlock(): void {
		//
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
