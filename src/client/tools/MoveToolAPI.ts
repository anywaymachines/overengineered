import { Players, ReplicatedStorage, UserInputService, Workspace } from "@rbxts/services";
import InputController from "client/core/InputController";
import AbstractToolAPI from "client/core/abstract/AbstractToolAPI";
import Signals from "client/core/network/Signals";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import SharedPlots from "shared/building/SharedPlots";

export default class MoveToolAPI extends AbstractToolAPI {
	private MoveExtent?: BasePart;

	private XHandles?: Handles;
	private YHandles?: Handles;
	private ZHandles?: Handles;

	constructor(gameUI: GameUI) {
		super(gameUI);
	}

	public displayGUI(noAnimations?: boolean | undefined): void {
		// NO GUI
	}
	public hideGUI(): void {
		// NO GUI
	}

	public createHandles() {
		this.destroyHandles();

		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const blocks = plot.FindFirstChild("Blocks") as Model;

		if (blocks.GetChildren().isEmpty()) {
			return;
		}

		this.MoveExtent = ReplicatedStorage.Assets.MoveHandles.Clone();
		this.MoveExtent.Parent = Workspace;

		this.MoveExtent.Size = blocks.GetExtentsSize();
		(this.MoveExtent as MoveHandles).SelectionBox.Adornee = blocks;

		this.XHandles = (this.MoveExtent as MoveHandles).XHandles;
		this.YHandles = (this.MoveExtent as MoveHandles).YHandles;
		this.ZHandles = (this.MoveExtent as MoveHandles).ZHandles;

		this.XHandles.Parent = this.gameUI as unknown as ScreenGui;
		this.YHandles.Parent = this.gameUI as unknown as ScreenGui;
		this.ZHandles.Parent = this.gameUI as unknown as ScreenGui;

		this.updateVisibility();

		this.eventHandler.registerOnce(
			this.XHandles.MouseButton1Down,
			async (face: Enum.NormalId) => await this.move(face),
		);
		this.eventHandler.registerOnce(
			this.YHandles.MouseButton1Down,
			async (face: Enum.NormalId) => await this.move(face),
		);
		this.eventHandler.registerOnce(
			this.ZHandles.MouseButton1Down,
			async (face: Enum.NormalId) => await this.move(face),
		);

		this.MoveExtent.CFrame = blocks.GetBoundingBox()[0];
	}

	public async move(face: Enum.NormalId): Promise<void> {
		let vector: Vector3 = Vector3.zero;

		if (face === Enum.NormalId.Top) {
			vector = new Vector3(0, 2, 0);
		} else if (face === Enum.NormalId.Bottom) {
			vector = new Vector3(0, -2, 0);
		} else if (face === Enum.NormalId.Front) {
			vector = new Vector3(0, 0, -2);
		} else if (face === Enum.NormalId.Back) {
			vector = new Vector3(0, 0, 2);
		} else if (face === Enum.NormalId.Left) {
			vector = new Vector3(-2, 0, 0);
		} else if (face === Enum.NormalId.Right) {
			vector = new Vector3(2, 0, 0);
		}

		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerMove").CallServerAsync({
			vector: vector,
		});

		// Parsing response
		if (response.success) {
			// Move success
			task.wait();

			this.createHandles();
		} else {
			// Block not removed
			Logger.info("[MOVING] Move failed: " + response.message);

			this.createHandles();
		}
	}

	public registerConsoleEvents(): void {
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadUp, () => this.move(Enum.NormalId.Top));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadDown, () => this.move(Enum.NormalId.Bottom));

		// DPad
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadLeft, () => this.gamepadMove(false));
		this.inputHandler.onKeyPressed(Enum.KeyCode.DPadRight, () => this.gamepadMove(true));

		this.eventHandler.registerEvent(Signals.CAMERA_MOVED, () => this.updateVisibility());
	}

	updateVisibility() {
		if (!this.YHandles || !this.ZHandles) {
			return;
		}

		if (InputController.currentPlatform !== "Console") {
			return;
		}

		this.ZHandles.Visible = this.getDirection() === 0 || math.abs(this.getDirection()) === 180 ? true : false;
		this.YHandles.Visible = math.abs(this.getDirection()) === 90 ? true : false;
	}

	getDirection() {
		const camera = Workspace.CurrentCamera as Camera;
		const xyz = camera.CFrame.ToOrientation();
		const direction = math.floor((math.deg(xyz[1]) + 45) / 90) * 90;
		return direction;
	}

	gamepadMove(isRight: boolean) {
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

	public destroyHandles() {
		this.MoveExtent?.Destroy();
		this.XHandles?.Destroy();
		this.YHandles?.Destroy();
		this.ZHandles?.Destroy();
	}

	public equip(): void {
		super.equip();

		this.createHandles();
	}

	public unequip(): void {
		super.unequip();

		this.destroyHandles();
	}
}
