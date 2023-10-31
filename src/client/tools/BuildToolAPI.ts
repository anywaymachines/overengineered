import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractToolAPI from "../gui/abstract/AbstractToolAPI";
import AbstractBlock from "shared/registry/AbstractBlock";
import { Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import PartUtils from "shared/utils/PartUtils";
import GameControls from "client/GameControls";
import PlayerUtils from "shared/utils/PlayerUtils";
import Remotes from "shared/NetworkDefinitions";
import Logger from "shared/Logger";
import BuildingManager from "shared/building/BuildingManager";
import VectorUtils from "shared/utils/VectorUtils";
import GuiUtils from "client/utils/GuiUtils";

export default class BuildToolAPI extends AbstractToolAPI {
	// Mouse
	private lastMouseHit: CFrame | undefined;
	private lastMouseTarget: BasePart | undefined;
	private lastMouseSurface: Enum.NormalId | undefined;

	// Block
	private equippedBlock: AbstractBlock;
	private previewBlock: Model | undefined;
	private previewBlockRotation: CFrame = new CFrame();

	// Const
	private readonly allowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor: Color3 = Color3.fromRGB(255, 189, 189);
	private readonly defaultBlock = BlockRegistry.TEST_BLOCK;

	constructor(gameUI: MyGui) {
		super(gameUI);

		this.equippedBlock = BlockRegistry.TEST_BLOCK;
	}

	private addHighlight() {
		const blockHighlight = new Instance("Highlight");
		blockHighlight.Name = "BlockHighlight";
		blockHighlight.Parent = this.previewBlock;
		blockHighlight.FillTransparency = 0.4;
		blockHighlight.OutlineTransparency = 0.5;
		blockHighlight.Adornee = this.previewBlock;
	}

	private addAxes() {
		assert(this.previewBlock);

		const axes = ReplicatedStorage.Assets.Axes.Clone();
		axes.PivotTo(this.previewBlock.GetPivot());
		axes.Parent = this.previewBlock;
	}

	public rotate(forward: boolean, axis: "r" | "t" | "y") {
		let rotation: Vector3;
		if (axis === "r") {
			rotation = new Vector3(0, forward ? math.pi / 2 : math.pi / -2, 0);
		} else if (axis === "t") {
			rotation = new Vector3(forward ? math.pi / 2 : math.pi / -2, 0, 0);
		} else if (axis === "y") {
			rotation = new Vector3(0, 0, forward ? math.pi / 2 : math.pi / -2);
		} else {
			return;
		}

		this.previewBlockRotation = CFrame.fromEulerAnglesXYZ(rotation.X, rotation.Y, rotation.Z).mul(
			this.previewBlockRotation,
		);

		this.gameUI.Sounds.Building.BlockRotate.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
		this.gameUI.Sounds.Building.BlockRotate.Play();

		this.updatePosition(true);
	}

	// TODO: Use it in block selection menu
	public selectBlock(block: AbstractBlock): void {
		this.unequip();
		this.equippedBlock = block;
		this.equip();
	}

	public async placeBlock() {
		assert(this.equippedBlock);
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.equippedBlock.id,
			location: this.previewBlock.PrimaryPart.CFrame,
		});

		if (response.success === true) {
			task.wait();
			this.updatePosition(true);

			// Play sound
			this.gameUI.Sounds.Building.BlockPlace.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
			this.gameUI.Sounds.Building.BlockPlace.Play();
		} else {
			Logger.info("[BUILDING] Block placement failed: " + response.message);
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	public equip(): void {
		super.equip();

		// Selecting a block
		if (this.equippedBlock === undefined) {
			this.equippedBlock = this.defaultBlock;
		}

		// Spawning a new block
		this.previewBlock = this.equippedBlock.getModel().Clone();
		this.previewBlock.Parent = Workspace;

		this.addAxes();
		this.addHighlight();
		PartUtils.ghostModel(this.previewBlock);
	}

	public unequip(): void {
		super.unequip();

		this.previewBlock?.Destroy();
	}

	public onUserInput(input: InputObject): void {
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			// Keyboard rotation
			if (input.KeyCode === Enum.KeyCode.R) {
				this.rotate(GameControls.isShiftPressed(), "r");
			} else if (input.KeyCode === Enum.KeyCode.T) {
				this.rotate(GameControls.isShiftPressed(), "t");
			} else if (input.KeyCode === Enum.KeyCode.Y) {
				this.rotate(GameControls.isShiftPressed(), "y");
			}
		} else if (input.UserInputType === Enum.UserInputType.Gamepad1) {
			if (input.KeyCode === Enum.KeyCode.ButtonX) {
				this.placeBlock();
			}
			// TODO: Gamepad rotation
		} else if (input.UserInputType === Enum.UserInputType.Touch) {
			this.updatePosition();
		}
	}

	public onPlatformChanged(): void {
		super.onPlatformChanged();

		this.setupEvents();
	}

	public setupEvents() {
		Logger.info("[BuildToolAPI] Setting up events");
		switch (GameControls.getPlatform()) {
			case "Desktop":
				this.eventHandler.registerEvent(this.mouse.Move, () => this.updatePosition());
				this.eventHandler.registerEvent(this.mouse.Button1Down, async () => await this.placeBlock());
				break;
			case "Console":
				this.eventHandler.registerEvent(
					(Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"),
					() => this.updatePosition(),
				);
				break;
			case "Mobile":
				// Touchscreen controls
				this.eventHandler.registerEvent(this.gameUI.BuildToolMobile.PlaceButton.MouseButton1Click, () =>
					this.placeBlock(),
				);
				this.eventHandler.registerEvent(this.gameUI.BuildToolMobile.RotateRButton.MouseButton1Click, () =>
					this.rotate(true, "r"),
				);
				this.eventHandler.registerEvent(this.gameUI.BuildToolMobile.RotateTButton.MouseButton1Click, () =>
					this.rotate(true, "t"),
				);
				this.eventHandler.registerEvent(this.gameUI.BuildToolMobile.RotateYButton.MouseButton1Click, () =>
					this.rotate(true, "y"),
				);
				this.eventHandler.registerEvent(UserInputService.TouchStarted, (_) => this.updatePosition());
				break;
			default:
				break;
		}
	}

	public updatePosition(savePosition: boolean = false) {
		assert(this.previewBlock);
		assert(this.previewBlock.PrimaryPart);

		// If ESC menu is open - freeze movement
		if (GameControls.isPaused()) {
			return;
		}

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// Fix buttons positions
		if (GuiUtils.isCursorOnVisibleGui() && !savePosition) {
			return;
		}

		const mouseTarget: BasePart | undefined =
			savePosition && this.lastMouseTarget !== undefined ? this.lastMouseTarget : this.mouse.Target;

		// If the this.mouse isn't over anything, stop rendering
		if (mouseTarget === undefined) {
			return;
		}

		const mouseHit = savePosition && this.lastMouseHit !== undefined ? this.lastMouseHit : this.mouse.Hit;
		const mouseSurface =
			savePosition && this.lastMouseSurface !== undefined ? this.lastMouseSurface : this.mouse.TargetSurface;
		const highlight = this.previewBlock.FindFirstChildOfClass("Highlight") as Highlight;

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

		// Colorizing
		if (BuildingManager.vectorAbleToPlayer(this.previewBlock.PrimaryPart.Position, Players.LocalPlayer)) {
			highlight.FillColor = this.allowedColor;
		} else {
			highlight.FillColor = this.forbiddenColor;
		}

		// Saving a new values
		if (!savePosition) {
			this.lastMouseTarget = mouseTarget;
			this.lastMouseHit = mouseHit;
			this.lastMouseSurface = mouseSurface;
		}
	}
}
