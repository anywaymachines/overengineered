import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import InputController from "client/controller/InputController";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";
import SharedPlots from "shared/building/SharedPlots";

/** A tool for moving the entire building as a whole */
export default class MoveTool extends ToolBase {
	private MoveExtent?: MoveHandles;
	private XHandles?: Handles;
	private YHandles?: Handles;
	private ZHandles?: Handles;

	getDisplayName(): string {
		return "Moving Mode";
	}

	getImageID(): string {
		return "rbxassetid://12539306575";
	}

	getShortDescription(): string {
		return "Move your contraption";
	}

	private destroyHandles() {
		this.MoveExtent?.Destroy();
		this.XHandles?.Destroy();
		this.YHandles?.Destroy();
		this.ZHandles?.Destroy();
	}

	private createHandles() {
		this.destroyHandles();

		if (!this.isEquipped) {
			return;
		}

		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const blocks = plot.FindFirstChild("Blocks") as Model;

		if (blocks.GetChildren().isEmpty()) {
			return;
		}

		this.MoveExtent = ReplicatedStorage.Assets.MoveHandles.Clone();
		this.MoveExtent.Parent = Workspace;

		this.MoveExtent.Size = blocks.GetExtentsSize();
		this.MoveExtent.SelectionBox.Adornee = blocks;

		this.XHandles = this.MoveExtent.XHandles;
		this.YHandles = this.MoveExtent.YHandles;
		this.ZHandles = this.MoveExtent.ZHandles;

		this.XHandles.Parent = this.gameUI;
		this.YHandles.Parent = this.gameUI;
		this.ZHandles.Parent = this.gameUI;

		this.updateVisibility();

		this.eventHandler.subscribeOnce(
			this.XHandles.MouseButton1Down,
			async (face: Enum.NormalId) => await this.move(face),
		);
		this.eventHandler.subscribeOnce(
			this.YHandles.MouseButton1Down,
			async (face: Enum.NormalId) => await this.move(face),
		);
		this.eventHandler.subscribeOnce(
			this.ZHandles.MouseButton1Down,
			async (face: Enum.NormalId) => await this.move(face),
		);

		this.MoveExtent.Position = blocks.GetBoundingBox()[0].Position;
		this.MoveExtent.Size = blocks.GetExtentsSize();
	}

	private updateVisibility() {
		if (!this.YHandles || !this.ZHandles) {
			return;
		}

		if (InputController.inputType.get() !== "Gamepad") {
			return;
		}

		this.ZHandles.Visible = this.getDirection() === 0 || math.abs(this.getDirection()) === 180 ? true : false;
		this.YHandles.Visible = math.abs(this.getDirection()) === 90 ? true : false;
	}

	private getDirection() {
		const camera = Workspace.CurrentCamera as Camera;
		const xyz = camera.CFrame.ToOrientation();
		const direction = math.floor((math.deg(xyz[1]) + 45) / 90) * 90;
		return direction;
	}

	prepare() {
		super.prepare();
		this.createHandles();

		this.eventHandler.subscribe(Signals.BLOCKS.ADDED, () => this.createHandles());
		this.eventHandler.subscribe(Signals.BLOCKS.REMOVED, () => this.createHandles());
		this.eventHandler.subscribe(Signals.CONTRAPTION.MOVED, () => this.createHandles());
	}

	public disable() {
		super.disable();
		this.destroyHandles();
	}

	private async move(face: Enum.NormalId): Promise<void> {
		let vector: Vector3 = Vector3.zero;

		if (face === Enum.NormalId.Top) vector = new Vector3(0, 2, 0);
		else if (face === Enum.NormalId.Bottom) vector = new Vector3(0, -2, 0);
		else if (face === Enum.NormalId.Front) vector = new Vector3(0, 0, -2);
		else if (face === Enum.NormalId.Back) vector = new Vector3(0, 0, 2);
		else if (face === Enum.NormalId.Left) vector = new Vector3(-2, 0, 0);
		else if (face === Enum.NormalId.Right) vector = new Vector3(2, 0, 0);

		const response = await ActionController.instance.executeOperation(
			"Move block",
			async () => {
				await BuildingController.moveBlock({ vector: vector.mul(-1) });
			},
			{ vector: vector },
			(info) => BuildingController.moveBlock(info),
		);

		// Parsing response
		if (response.success) {
			// Move success
		} else {
			SoundController.getSounds().BuildingMode.BlockPlaceError.Play();
		}

		this.createHandles();
	}

	private gamepadMove(isRight: boolean) {
		const direction = this.getDirection();

		if (direction === 0) {
			this.move(isRight ? Enum.NormalId.Right : Enum.NormalId.Left);
		} else if (direction === -90) {
			this.move(isRight ? Enum.NormalId.Back : Enum.NormalId.Front);
		} else if (direction === 90) {
			this.move(isRight ? Enum.NormalId.Front : Enum.NormalId.Back);
		} else if (math.abs(direction) === 180) {
			this.move(isRight ? Enum.NormalId.Left : Enum.NormalId.Right);
		}
	}

	protected prepareDesktop(): void {}

	protected prepareGamepad(): void {
		this.inputHandler.onKeyDown(Enum.KeyCode.DPadUp, () => this.move(Enum.NormalId.Top));
		this.inputHandler.onKeyDown(Enum.KeyCode.DPadDown, () => this.move(Enum.NormalId.Bottom));

		// DPad
		this.inputHandler.onKeyDown(Enum.KeyCode.DPadLeft, () => this.gamepadMove(false));
		this.inputHandler.onKeyDown(Enum.KeyCode.DPadRight, () => this.gamepadMove(true));

		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updateVisibility());
	}

	protected prepareTouch(): void {}

	public getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		const keys: { key: Enum.KeyCode; text: string }[] = [];

		keys.push({ key: Enum.KeyCode.DPadUp, text: "Move up" });
		keys.push({ key: Enum.KeyCode.DPadDown, text: "Move down" });

		keys.push({
			key: Enum.KeyCode.DPadLeft,
			text: "Move left (based on camera)",
		});

		keys.push({
			key: Enum.KeyCode.DPadRight,
			text: "Move right (based on camera)",
		});

		return keys;
	}
	public getKeyboardTooltips() {
		return [];
	}
}
