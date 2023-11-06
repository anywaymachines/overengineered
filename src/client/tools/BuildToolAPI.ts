import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractToolAPI from "../core/abstract/AbstractToolAPI";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import { Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import PartUtils from "shared/utils/PartUtils";
import InputController from "client/core/InputController";
import PlayerUtils from "shared/utils/PlayerUtils";
import Remotes from "shared/NetworkDefinitions";
import Logger from "shared/Logger";
import BuildingManager from "shared/building/BuildingManager";
import VectorUtils from "shared/utils/VectorUtils";
import GuiUtils from "client/utils/GuiUtils";
import GuiAnimations from "client/utils/GuiAnimations";
import SoundUtils from "shared/utils/SoundUtils";
import AbstractCategory from "shared/registry/abstract/AbstractCategory";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import ContraptionWelder from "client/core/contraption/ContraptionWelder";

export default class BuildToolAPI extends AbstractToolAPI {
	// Mouse
	private lastMouseHit?: CFrame;
	private lastMouseTarget?: BasePart;
	private lastMouseSurface?: Enum.NormalId;

	// Block
	private selectedBlock?: AbstractBlock;
	private previewBlock?: Model;
	private previewBlockRotation: CFrame = new CFrame();

	// Templates
	private guiCategoryTemplate: TextButton & { Frame: Frame & { ImageLabel: ImageLabel }; TextLabel: TextLabel };
	private guiBlockTemplate: TextButton & { Frame: Frame & { LimitLabel: TextLabel }; TextLabel: TextLabel };

	// Menu selection
	private selectionButtons: TextButton[] = [];
	private selectedCategory?: AbstractCategory;

	// Const
	private readonly allowedColor: Color3 = Color3.fromRGB(194, 217, 255);
	private readonly forbiddenColor: Color3 = Color3.fromRGB(255, 189, 189);

	constructor(gameUI: GameUI) {
		super(gameUI);

		// Prepare templates
		this.guiCategoryTemplate = this.gameUI.ToolsGui.BuildToolSelection.Buttons.CategoryTemplate.Clone();
		this.guiBlockTemplate = this.gameUI.ToolsGui.BuildToolSelection.Buttons.BlockTemplate.Clone();
		this.gameUI.ToolsGui.BuildToolSelection.Buttons.CategoryTemplate.Destroy();
		this.gameUI.ToolsGui.BuildToolSelection.Buttons.BlockTemplate.Destroy();
	}

	public displayGUI(noAnimations?: boolean): void {
		// Display GUI
		this.gameUI.ToolsGui.BuildToolSelection.Visible = true;

		// Show building mobile controls
		if (InputController.currentPlatform === "Touch") {
			this.gameUI.TouchControls.BuildTool.Visible = true;
			if (!noAnimations) {
				GuiAnimations.fade(this.gameUI.TouchControls.BuildTool, 0.1, "right");
			}
		} else {
			this.gameUI.TouchControls.BuildTool.Visible = false;
		}

		this.updateSelectionMenu(noAnimations);
	}

	public updateSelectionMenu(noAnimations?: boolean) {
		if (!noAnimations) {
			GuiAnimations.fade(this.gameUI.ToolsGui.BuildToolSelection, 0.1, "right");
		}

		// Remove old buttons
		this.selectionButtons.forEach((button) => {
			button.Destroy();
		});
		this.selectionButtons.clear();

		if (this.selectedCategory === undefined) {
			// Display categories
			CategoriesRegistry.categories.forEach((registeredCategory) => {
				const obj = this.guiCategoryTemplate.Clone();
				obj.TextLabel.Text = registeredCategory.getDisplayName();
				obj.Frame.ImageLabel.Image = `rbxassetid://${registeredCategory.getImageAssetID()}`;
				obj.Parent = this.gameUI.ToolsGui.BuildToolSelection.Buttons;
				this.eventHandler.registerOnce(obj.MouseButton1Click, () => {
					this.gameUI.Sounds.GuiClick.Play();
					this.selectedCategory = registeredCategory;
					this.updateSelectionMenu();
				});
				this.selectionButtons.push(obj);
			});
		} else {
			const blocks = BlockRegistry.getBlocksInCategory(this.selectedCategory);

			const backButton = this.guiCategoryTemplate.Clone();
			backButton.TextLabel.Text = "Back";
			backButton.Frame.ImageLabel.Image = "http://www.roblox.com/asset/?id=15252518021";
			backButton.Parent = this.gameUI.ToolsGui.BuildToolSelection.Buttons;
			this.eventHandler.registerOnce(backButton.MouseButton1Click, () => {
				this.gameUI.Sounds.GuiClick.Play();
				this.selectedCategory = undefined;
				this.selectBlock(undefined);
				this.updateSelectionMenu();
			});
			this.selectionButtons.push(backButton);

			blocks.forEach((block) => {
				const obj = this.guiBlockTemplate.Clone();
				obj.Name = block.getDisplayName();
				obj.TextLabel.Text = block.getDisplayName();
				if (this.selectedBlock === block) {
					obj.BackgroundColor3 = Color3.fromRGB(106, 106, 106);
				}
				obj.Frame.LimitLabel.Text = "inf";
				obj.Parent = this.gameUI.ToolsGui.BuildToolSelection.Buttons;
				this.eventHandler.registerEvent(obj.MouseButton1Click, () => {
					this.gameUI.Sounds.GuiClick.Play();
					this.selectBlock(block);
					this.updateSelectionMenu(true);
				});
				this.selectionButtons.push(obj);
			});
		}

		const scrollingframe = this.gameUI.ToolsGui.BuildToolSelection.Buttons;

		scrollingframe.CanvasSize = new UDim2(0, 0, 0, scrollingframe.UIListLayout.AbsoluteContentSize.Y);
	}

	public hideGUI(): void {
		// Hide mobile controls
		this.gameUI.TouchControls.BuildTool.Visible = false;

		// Hide block selection
		this.gameUI.ToolsGui.BuildToolSelection.Visible = false;
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
		assert(this.selectedBlock);

		const axis = ReplicatedStorage.Assets.Axis.Clone();
		axis.PivotTo(this.previewBlock.GetPivot());
		axis.Parent = this.previewBlock;

		if (this.selectedBlock.getAvailableRotationAxis().x === false) {
			axis.X.Destroy();
		}

		if (this.selectedBlock.getAvailableRotationAxis().y === false) {
			axis.Y.Destroy();
		}

		if (this.selectedBlock.getAvailableRotationAxis().y === false) {
			axis.Z.Destroy();
		}
	}

	private rotateFineTune(rotationVector: Vector3) {
		this.previewBlockRotation = CFrame.fromEulerAnglesXYZ(rotationVector.X, rotationVector.Y, rotationVector.Z).mul(
			this.previewBlockRotation,
		);
		this.gameUI.Sounds.Building.BlockRotate.PlaybackSpeed = SoundUtils.randomSoundSpeed();
		this.gameUI.Sounds.Building.BlockRotate.Play();
		this.updatePosition(true);
	}

	public rotate(axis: "x" | "y" | "z", isInverted: boolean = InputController.isShiftPressed()) {
		if (this.selectedBlock === undefined) {
			return;
		}

		const { x, y, z } = this.selectedBlock.getAvailableRotationAxis();

		if (axis === "x" && x) {
			this.rotateFineTune(new Vector3(isInverted ? math.pi / 2 : math.pi / -2, 0, 0));
		} else if (axis === "y" && y) {
			this.rotateFineTune(new Vector3(0, isInverted ? math.pi / 2 : math.pi / -2, 0));
		} else if (axis === "z" && z) {
			this.rotateFineTune(new Vector3(0, 0, isInverted ? math.pi / 2 : math.pi / -2));
		} else {
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	public selectBlock(block?: AbstractBlock): void {
		// Remove old block preview
		this.previewBlock?.Destroy();

		this.selectedBlock = block;

		this.prepareVisual();
	}

	public prepareVisual() {
		if (this.selectedBlock === undefined) {
			return;
		}

		// Spawning a new block
		this.previewBlock = this.selectedBlock.getModel().Clone();
		this.previewBlock.Parent = Workspace;

		// Customizing
		this.addAxisModel();
		this.addHighlight();
		PartUtils.ghostModel(this.previewBlock);

		// First update
		this.updatePosition();
	}

	public async placeBlock() {
		// ERROR: Nothing to place
		if (!this.previewBlock || !this.previewBlock.PrimaryPart) {
			return;
		}

		// ERROR: Block is not selected
		if (this.selectedBlock === undefined) {
			return;
		}

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync({
			block: this.selectedBlock.id,
			location: this.previewBlock.PrimaryPart.CFrame,
		});

		if (response.success === true) {
			task.wait();
			this.updatePosition(true);

			// Create welds
			ContraptionWelder.makeJoints(response.model as Model);

			// Play sound
			this.gameUI.Sounds.Building.BlockPlace.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlace.Play();
		} else {
			Logger.info("[BUILDING] Block placement failed: " + response.message);
			this.gameUI.Sounds.Building.BlockPlaceError.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockPlaceError.Play();
		}
	}

	public equip(): void {
		super.equip();

		// Selecting a block
		this.prepareVisual();
	}

	public unequip(): void {
		super.unequip();

		this.previewBlock?.Destroy();
	}

	public registerDesktopEvents() {
		// Keyboard controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.R, () => this.rotate("x"));
		this.inputHandler.onKeyPressed(Enum.KeyCode.T, () => this.rotate("y"));
		this.inputHandler.onKeyPressed(Enum.KeyCode.Y, () => this.rotate("z"));

		this.eventHandler.registerEvent(this.mouse.Move, () => this.updatePosition());
		this.eventHandler.registerEvent(this.mouse.Button1Down, async () => await this.placeBlock());
	}

	public registerConsoleEvents() {
		// Gamepad button controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonX, () => this.placeBlock());

		// Gamepad DPAD controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadLeft, () => this.rotate("x", false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadUp, () => this.rotate("y", false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadDown, () => this.rotate("y", false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadRight, () => this.rotate("z", false));

		this.eventHandler.registerEvent((Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"), () =>
			this.updatePosition(),
		);
	}

	public registerTouchEvents() {
		// Touch controls
		this.inputHandler.onTouchTap(() => this.updatePosition());

		// Touchscreen controls
		this.eventHandler.registerEvent(this.gameUI.TouchControls.BuildTool.PlaceButton.MouseButton1Click, () =>
			this.placeBlock(),
		);
		this.eventHandler.registerEvent(this.gameUI.TouchControls.BuildTool.RotateRButton.MouseButton1Click, () =>
			this.rotate("x", true),
		);
		this.eventHandler.registerEvent(this.gameUI.TouchControls.BuildTool.RotateTButton.MouseButton1Click, () =>
			this.rotate("y", true),
		);
		this.eventHandler.registerEvent(this.gameUI.TouchControls.BuildTool.RotateYButton.MouseButton1Click, () =>
			this.rotate("z", true),
		);
		this.eventHandler.registerEvent(UserInputService.TouchStarted, (_) => this.updatePosition());
	}

	public updatePosition(savePosition: boolean = false) {
		if (!this.selectedBlock || !this.previewBlock) {
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
			InputController.isPaused() ||
			!PlayerUtils.isAlive(Players.LocalPlayer) ||
			(GuiUtils.isCursorOnVisibleGui() && !savePosition)
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
}
