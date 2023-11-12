import { GuiService, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import BuildingWelder from "client/BuildingWelder";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import BuildToolWidget from "client/gui/widget/tools/BuildToolWidget";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import BuildingManager from "shared/building/BuildingManager";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";
import SoundUtils from "shared/utils/SoundUtils";
import VectorUtils from "shared/utils/VectorUtils";

/** A tool for building in the world with blocks */
export default class BuildTool extends ToolBase {
	// Const
	private readonly allowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor: Color3 = Color3.fromRGB(255, 189, 189);

	// Block
	private previewBlock?: Model;
	private previewBlockRotation: CFrame = new CFrame();

	// Mouse
	private lastMouseHit?: CFrame;
	private lastMouseTarget?: BasePart;
	private lastMouseSurface?: Enum.NormalId;

	// GUI
	private readonly widget: BuildToolWidget = new BuildToolWidget(this);

	getDisplayName(): string {
		return "Building Mode";
	}

	getImageID(): string {
		return "rbxassetid://12539295858";
	}

	getShortDescription(): string {
		return "Put blocks in the world";
	}

	public prepareVisual() {
		// Remove old block preview
		this.previewBlock?.Destroy();

		if (this.widget.selectedBlock === undefined) {
			return;
		}

		// Spawning a new block
		this.previewBlock = this.widget.selectedBlock.getModel().Clone();
		this.previewBlock.Parent = Workspace;

		// Customizing
		this.addAxisModel();
		this.addHighlight();
		PartUtils.switchDescendantsMaterial(this.previewBlock, this.widget.selectedMaterial);
		PartUtils.ghostModel(this.previewBlock);

		// First update
		this.updatePosition();
	}

	private addHighlight() {
		const blockHighlight = new Instance("Highlight");
		blockHighlight.Name = "BlockHighlight";
		blockHighlight.Parent = this.previewBlock;
		blockHighlight.FillTransparency = 0.4;
		blockHighlight.OutlineTransparency = 0.5;
		blockHighlight.Adornee = this.previewBlock;
	}

	private addAxisModel() {
		assert(this.previewBlock);
		assert(this.widget.selectedBlock);

		const axis = ReplicatedStorage.Assets.Axis.Clone();
		axis.PivotTo(this.previewBlock.GetPivot());
		axis.Parent = this.previewBlock;

		if (this.widget.selectedBlock.getAvailableRotationAxis().x === false) {
			axis.X.Destroy();
		}

		if (this.widget.selectedBlock.getAvailableRotationAxis().y === false) {
			axis.Y.Destroy();
		}

		if (this.widget.selectedBlock.getAvailableRotationAxis().y === false) {
			axis.Z.Destroy();
		}
	}

	public updatePosition(savePosition: boolean = false) {
		if (!this.widget.selectedBlock || !this.previewBlock) {
			return;
		}

		if (this.shouldReturnEarly(savePosition)) {
			return;
		}

		const { mouseTarget, mouseHit, mouseSurface } = this.getMouseProperties(savePosition);
		const highlight = this.previewBlock.FindFirstChildOfClass("Highlight") as Highlight;

		this.performPositioning(mouseTarget, mouseSurface, mouseHit);
		this.colorizePreviewBlock(highlight);

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
			(GuiController.isCursorOnVisibleGui() && !savePosition)
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
		const moveRangeStuds = 1; // TODO: Make this configurable (probably)
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
			new CFrame(VectorUtils.roundVectorToNearestHalf(this.previewBlock.GetPivot().Position)).mul(
				this.previewBlock.GetPivot().Rotation,
			),
		);
	}

	public async placeBlock() {
		// ERROR: Nothing to place
		if (!this.previewBlock || !this.previewBlock.PrimaryPart) {
			return;
		}

		// ERROR: Block is not selected
		if (this.widget.selectedBlock === undefined) {
			return;
		}

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.widget.selectedBlock.id,
			material: this.widget.selectedMaterial,
			location: this.previewBlock.PrimaryPart.CFrame,
		});

		if (response.success === true) {
			task.wait();
			this.updatePosition(true);

			// Create welds
			BuildingWelder.makeJoints(response.model as Model);

			// Play sound
			this.gameUI.Sounds.Building.BlockPlace.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlace.Play();
		} else {
			Logger.info("[BUILDING] Block placement failed: " + response.message);
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	public rotate(axis: "x" | "y" | "z", isInverted: boolean = InputController.isShiftPressed()) {
		if (this.widget.selectedBlock === undefined) {
			return;
		}

		const { x, y, z } = this.widget.selectedBlock.getAvailableRotationAxis();

		if (axis === "x" && x) {
			this.rotateFineTune(new Vector3(isInverted ? math.pi / 2 : math.pi / -2, 0, 0));
		} else if (axis === "y" && y) {
			this.rotateFineTune(new Vector3(0, isInverted ? math.pi / 2 : math.pi / -2, 0));
		} else if (axis === "z" && z) {
			this.rotateFineTune(new Vector3(0, 0, isInverted ? math.pi / 2 : math.pi / -2));
		} else {
			return;
		}
	}

	private rotateFineTune(rotationVector: Vector3) {
		this.previewBlockRotation = CFrame.fromEulerAnglesXYZ(rotationVector.X, rotationVector.Y, rotationVector.Z).mul(
			this.previewBlockRotation,
		);
		this.updatePosition(true);

		this.gameUI.Sounds.Building.BlockRotate.PlaybackSpeed = SoundUtils.randomSoundSpeed();
		this.gameUI.Sounds.Building.BlockRotate.Play();
	}

	private colorizePreviewBlock(highlight: Highlight) {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// Colorizing
		if (BuildingManager.vectorAbleToPlayer(this.previewBlock.PrimaryPart.Position, Players.LocalPlayer)) {
			highlight.FillColor = this.allowedColor;
		} else {
			highlight.FillColor = this.forbiddenColor;
		}
	}

	protected prepareDesktop(): void {
		// Keyboard controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.R, () => this.rotate("x"));
		this.inputHandler.onKeyPressed(Enum.KeyCode.T, () => this.rotate("y"));
		this.inputHandler.onKeyPressed(Enum.KeyCode.Y, () => this.rotate("z"));

		this.eventHandler.subscribe(this.mouse.Move, () => this.updatePosition());
		this.eventHandler.subscribe(this.mouse.Button1Down, async () => await this.placeBlock());

		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
	}
	protected prepareTouch(): void {
		// Touch controls
		this.inputHandler.onTouchTap(() => this.updatePosition());
	}
	protected prepareGamepad(): void {
		// Gamepad button controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonX, () => this.placeBlock());

		// Gamepad DPAD controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadLeft, () => this.rotate("x", false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadUp, () => this.rotate("y", false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadDown, () => this.rotate("y", false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadRight, () => this.rotate("z", false));

		// Block movement
		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
	}

	activate(): void {
		super.activate();

		this.widget.showWidget(true);
	}

	deactivate(): void {
		super.deactivate();

		this.widget.hideWidget(true);

		this.previewBlock?.Destroy();
	}
}
