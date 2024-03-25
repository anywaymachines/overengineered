import { GuiService, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import InputController from "client/controller/InputController";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import Gui from "client/gui/Gui";
import LogControl from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import ToolBase from "client/tools/ToolBase";
import Tutorial from "client/tutorial/Tutorial";
import { blockRegistry } from "shared/Registry";
import BlockManager from "shared/building/BlockManager";
import BuildingManager from "shared/building/BuildingManager";
import ObservableValue from "shared/event/ObservableValue";
import Signal from "shared/event/Signal";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";
import VectorUtils from "shared/utils/VectorUtils";

/** A tool for building in the world with blocks */
export default class BuildTool extends ToolBase {
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);

	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));

	// Const
	private readonly allowedColor: Color3 = Colors.blue;
	private readonly forbiddenColor: Color3 = Colors.red;

	// Block
	private previewBlock?: Model;
	private previewBlockRotation: CFrame = new CFrame();

	// Mouse
	private lastMouseHit?: CFrame;
	private lastMouseTarget?: BasePart;
	private lastMouseSurface?: Enum.NormalId;

	// Signals
	pickSignal = new Signal<(block: RegistryBlock) => void>();

	constructor(mode: BuildingMode) {
		super(mode);
		this.subscribeToCurrentPlot(() => this.updatePosition());
	}

	getDisplayName(): string {
		return "Build";
	}

	getImageID(): string {
		return "rbxassetid://12539295858";
	}

	setSelectedBlock(block: RegistryBlock | undefined) {
		this.selectedBlock.set(block);
		this.previewBlockRotation = CFrame.identity;
		this.prepareVisual();
	}

	setSelectedMaterial(material: Enum.Material) {
		this.selectedMaterial.set(material);
		this.prepareVisual();
	}

	setSelectedColor(color: Color3) {
		this.selectedColor.set(color);
		this.prepareVisual();
	}

	private prepareVisual() {
		// Remove old block preview
		this.previewBlock?.Destroy();
		const selected = this.selectedBlock.get();
		if (!selected) return;

		// Spawning a new block
		this.previewBlock = selected.model.Clone();
		this.previewBlock.Parent = Workspace;

		// Customizing
		this.addAxisModel();
		PartUtils.switchDescendantsMaterial(this.previewBlock, this.selectedMaterial.get());
		PartUtils.switchDescendantsColor(this.previewBlock, this.selectedColor.get());

		// First update
		this.updatePosition();
	}

	private addAxisModel() {
		assert(this.previewBlock);
		assert(this.selectedBlock.get());

		const axis = ReplicatedStorage.Assets.Axis.Clone();
		axis.PivotTo(this.previewBlock.GetPivot());
		axis.Parent = this.previewBlock;
	}

	private updatePosition(savePosition: boolean = false) {
		if (!this.selectedBlock.get() || !this.previewBlock) {
			return;
		}

		if (this.shouldReturnEarly(savePosition)) {
			return;
		}

		const { mouseTarget, mouseHit, mouseSurface } = this.getMouseProperties(savePosition);

		this.performPositioning(mouseTarget, mouseSurface, mouseHit);
		this.colorizePreviewBlock();

		if (!savePosition) {
			this.lastMouseTarget = mouseTarget;
			this.lastMouseHit = mouseHit;
			this.lastMouseSurface = mouseSurface;
		}
	}

	private shouldReturnEarly(savePosition: boolean): boolean {
		return (
			!this.previewBlock ||
			!this.previewBlock.PrimaryPart ||
			GuiService.MenuIsOpen ||
			!PlayerUtils.isAlive(Players.LocalPlayer) ||
			(Gui.isCursorOnVisibleGui() && !savePosition)
		);
	}

	private getMouseProperties(savePosition: boolean) {
		return {
			mouseTarget: savePosition && this.lastMouseTarget !== undefined ? this.lastMouseTarget : this.mouse.Target,
			mouseHit: savePosition && this.lastMouseHit !== undefined ? this.lastMouseHit : this.mouse.Hit,
			mouseSurface:
				savePosition && this.lastMouseSurface !== undefined ? this.lastMouseSurface : this.mouse.TargetSurface,
		};
	}

	private performPositioning(mouseTarget: BasePart | undefined, mouseSurface: Enum.NormalId, mouseHit: CFrame) {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// No target block
		if (!mouseTarget) {
			return;
		}

		// Positioning Stage 1
		const rotationRelative = mouseTarget.CFrame.sub(mouseTarget.Position).Inverse();
		const normalPositioning = VectorUtils.normalIdToNormalVector(mouseSurface, mouseTarget);
		const positioning = mouseTarget.CFrame.mul(
			new CFrame(normalPositioning.vector.mul(normalPositioning.size / 2)),
		);
		this.previewBlock.PivotTo(positioning.mul(rotationRelative).mul(this.previewBlockRotation));

		// Positioning Stage 2
		const convertedPosition = mouseTarget.CFrame.sub(mouseTarget.Position).PointToWorldSpace(
			normalPositioning.vector,
		);

		const RightVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.RightVector.Dot(convertedPosition));
		const UpVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.UpVector.Dot(convertedPosition));
		const LookVectorValue = math.abs(this.previewBlock.PrimaryPart.CFrame.LookVector.Dot(convertedPosition));

		this.previewBlock.PivotTo(positioning.mul(rotationRelative.Inverse()).mul(this.previewBlockRotation.Inverse()));

		// Positioning Stage 3
		const MouseHitObjectSpace = mouseTarget.CFrame.PointToObjectSpace(mouseHit.Position);

		const blockSize = this.selectedBlock.get()!.model.GetExtentsSize();
		const moveRangeStuds = math.clamp(math.min(blockSize?.X, blockSize.Y, blockSize.Z) / 2, 0.5, 1); // TODO: Make this configurable (probably)

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

		this.previewBlock.PivotTo(
			positioning
				.mul(
					new CFrame(
						normalPositioning.vector.mul(
							RightVectorValue * (this.previewBlock.PrimaryPart.Size.X / 2) +
								UpVectorValue * (this.previewBlock.PrimaryPart.Size.Y / 2) +
								LookVectorValue * (this.previewBlock.PrimaryPart.Size.Z / 2),
						),
					),
				)
				.mul(new CFrame(offset))
				.mul(rotationRelative)
				.mul(this.previewBlockRotation),
		);

		// Rounding vectors
		this.previewBlock.PivotTo(
			new CFrame(VectorUtils.roundVectorToBase(this.previewBlock.GetPivot().Position, moveRangeStuds)).mul(
				this.previewBlock.GetPivot().Rotation,
			),
		);
	}

	async placeBlock() {
		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) return;

		// ERROR: Block is not selected
		if (this.selectedBlock.get() === undefined) {
			LogControl.instance.addLine("Block is not selected!");

			return;
		}

		// ERROR: Nothing to place
		if (!this.previewBlock || !this.previewBlock.PrimaryPart) return;

		if (
			!BuildingManager.blockCanBePlacedAt(
				this.targetPlot.get(),
				this.selectedBlock.get()!,
				this.previewBlock.GetPivot(),
			)
		) {
			LogControl.instance.addLine("Can't be placed here!");

			// Play sound
			SoundController.getSounds().Build.BlockPlaceError.Play();

			return;
		}

		// Tutorial
		const relativeCoordinates = this.targetPlot
			.get()
			.instance.BuildingArea.CFrame.ToObjectSpace(this.previewBlock!.GetPivot());

		if (Tutorial.BlocksToPlace.size() > 0) {
			const block = Tutorial.BlocksToPlace.find(
				(value) =>
					value.id === this.selectedBlock.get()!.id && value.cframe.Position === relativeCoordinates.Position,
			);
			if (!block) {
				SoundController.getSounds().Build.BlockPlaceError.Play();
				return;
			}

			this.previewBlock.PivotTo(this.targetPlot.get().instance.BuildingArea.CFrame.ToWorldSpace(block.cframe));
		}

		const response = await ClientBuilding.placeBlocks(this.targetPlot.get(), [
			{
				id: this.selectedBlock.get()!.id,
				color: this.selectedColor.get(),
				material: this.selectedMaterial.get(),
				location: this.previewBlock.PrimaryPart.CFrame,
			},
		]);

		if (response.success) {
			// Play sound
			SoundController.getSounds().Build.BlockPlace.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Build.BlockPlace.Play();
		} else {
			SoundController.getSounds().Build.BlockPlaceError.Play();
		}
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

		this.pickSignal.Fire(blockRegistry.get(id)!);

		this.setSelectedMaterial(BlockManager.manager.material.get(model));
		this.setSelectedColor(BlockManager.manager.color.get(model));

		// Same rotation
		this.rotateFineTune(model.GetPivot().Rotation);
	}

	rotate(axis: "x" | "y" | "z", isInverted: boolean = InputController.isShiftPressed()) {
		if (this.selectedBlock.get() === undefined) {
			return;
		}

		if (axis === "x") {
			this.rotateFineTune(new Vector3(isInverted ? math.pi / 2 : math.pi / -2, 0, 0));
		} else if (axis === "y") {
			this.rotateFineTune(new Vector3(0, isInverted ? math.pi / 2 : math.pi / -2, 0));
		} else if (axis === "z") {
			this.rotateFineTune(new Vector3(0, 0, isInverted ? math.pi / 2 : math.pi / -2));
		} else {
			return;
		}
	}

	private rotateFineTune(rotationVector: Vector3): void;
	private rotateFineTune(cframe: CFrame): void;
	private rotateFineTune(rotation: CFrame | Vector3): void {
		if (typeIs(rotation, "Vector3")) {
			rotation = CFrame.fromEulerAnglesXYZ(rotation.X, rotation.Y, rotation.Z);
		}

		this.previewBlockRotation = rotation.mul(this.previewBlockRotation);
		this.updatePosition(true);

		SoundController.getSounds().Build.BlockRotate.PlaybackSpeed = SoundController.randomSoundSpeed();
		SoundController.getSounds().Build.BlockRotate.Play();
	}

	private colorizePreviewBlock() {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		const isBlockInsidePlot = BuildingManager.blockCanBePlacedAt(
			this.targetPlot.get(),
			this.selectedBlock.get()!,
			this.previewBlock.GetPivot(),
		);
		if (isBlockInsidePlot) {
			PartUtils.ghostModel(this.previewBlock, this.allowedColor);
		} else {
			PartUtils.ghostModel(this.previewBlock, this.forbiddenColor);
		}
	}

	protected prepareDesktop(): void {
		// Keyboard controls
		this.inputHandler.onKeyDown("T", () => this.rotate("x"));
		this.inputHandler.onKeyDown("R", () => this.rotate("y"));
		this.inputHandler.onKeyDown("Y", () => {
			if (InputController.isCtrlPressed()) return;
			this.rotate("z");
		});

		this.eventHandler.subscribe(this.mouse.Move, () => this.updatePosition());
		this.inputHandler.onMouse1Down(async () => {
			if (Gui.isCursorOnVisibleGui()) return;
			await this.placeBlock();
		}, false);
		this.inputHandler.onInputBegan(async (input) => {
			if (Gui.isCursorOnVisibleGui()) return;
			if (input.UserInputType !== Enum.UserInputType.MouseButton3) return;
			this.pickBlock();
		});

		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
	}

	protected prepareTouch(): void {
		// Touch controls
		this.inputHandler.onTouchTap(() => this.updatePosition());
	}

	protected prepareGamepad(): void {
		// Gamepad button controls
		this.inputHandler.onKeyDown("ButtonX", () => this.placeBlock());

		// Gamepad DPAD controls
		this.inputHandler.onKeyDown("DPadLeft", () => this.rotate("x", false));
		this.inputHandler.onKeyDown("DPadUp", () => this.rotate("y", false));
		this.inputHandler.onKeyDown("DPadDown", () => this.rotate("y", false));
		this.inputHandler.onKeyDown("DPadRight", () => this.rotate("z", false));

		// Block movement
		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
	}

	enable() {
		super.enable();
		this.prepareVisual();
	}

	disable() {
		super.disable();
		this.previewBlock?.Destroy();
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
