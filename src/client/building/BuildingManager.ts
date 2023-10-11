import { Players, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/definitions/Remotes";
import BuildingModels from "shared/building/BuildingModels";
import PlayerUtils from "shared/utils/PlayerUtils";
import PartUtils from "shared/utils/PartUtils";

const LocalPlayer: Player = Players.LocalPlayer;
const PlayerGui: PlayerGui = LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
const Mouse: Mouse = LocalPlayer.GetMouse();

const defaultModel = BuildingModels.getBuildingModel("TestBlock");

export default class BuildingManager {
	private static lastPlaceable: String | undefined;
	private static renderingObject: Model | undefined;
	private static renderingObjectRotation: CFrame = new CFrame();

	private static mouseMoveCallback: RBXScriptConnection | undefined;
	private static mouseClickCallback: RBXScriptConnection | undefined;

	static isBuilding() {
		return this.renderingObject !== undefined && PlayerUtils.isAlive(LocalPlayer);
	}

	static startBuilding() {
		this.renderingObject =
			this.lastPlaceable !== undefined && BuildingModels.isModelExists(this.lastPlaceable as string)
				? BuildingModels.getBuildingModel(this.lastPlaceable as string).Clone()
				: defaultModel.Clone();

		this.renderingObject.Parent = Workspace;

		PartUtils.ghostModel(this.renderingObject);

		// Events
		this.mouseMoveCallback = Mouse.Move.Connect(() => this.updatePosition());
		this.mouseClickCallback = Mouse.Button1Down.Connect(() => this.placeBlock());

		Logger.info("Building started with " + this.renderingObject.Name);
	}

	static placeBlock() {
		if (this.renderingObject === undefined) {
			error("No render object to update");
			return;
		}

		// If game developer made a mistake
		if (this.renderingObject.PrimaryPart === undefined) {
			error("PrimaryPart is undefined");
			return;
		}

		Remotes.Client.Get("PlayerPlaceBlock")
			.CallServerAsync({
				block: this.renderingObject.Name,
				location: this.renderingObject.PrimaryPart.CFrame,
			})
			.then((response) => {
				if (response.success) {
					// TODO: Play sound of success message
				} else {
					// TODO: Play sound of failure message
				}
			});
	}

	static stopBuilding() {
		if (!this.isBuilding()) {
			return;
		}

		this.renderingObject?.Destroy();
		this.mouseMoveCallback?.Disconnect();
		this.mouseClickCallback?.Disconnect();
	}

	private static updatePosition() {
		// If there is no render object, then assert error
		if (this.renderingObject === undefined) {
			error("No render object to update");
			return;
		}

		// If game developer made a mistake
		if (this.renderingObject.PrimaryPart === undefined) {
			error("PrimaryPart is undefined");
			return;
		}

		const mouseTarget: BasePart | undefined = Mouse.Target;

		// If the mouse isn't over anything, stop rendering
		if (mouseTarget === undefined) {
			return;
		}

		const mouseHit = Mouse.Hit;
		const mouseSurface = Mouse.TargetSurface;

		// Positioning Stage 1
		const rotationRelative = mouseTarget.CFrame.sub(mouseTarget.Position).Inverse();
		const normalPositioning = normalIdToNormalVector(mouseSurface, mouseTarget);
		const positioning = mouseTarget.CFrame.mul(
			new CFrame(normalPositioning.vector.mul(normalPositioning.size / 2)),
		);
		this.renderingObject.PivotTo(positioning.mul(rotationRelative).mul(this.renderingObjectRotation));

		// Positioning Stage 2
		const convertedPosition = mouseTarget.CFrame.sub(mouseTarget.Position).PointToWorldSpace(
			normalPositioning.vector,
		);

		const RightVectorValue = math.abs(this.renderingObject.PrimaryPart.CFrame.RightVector.Dot(convertedPosition));
		const UpVectorValue = math.abs(this.renderingObject.PrimaryPart.CFrame.UpVector.Dot(convertedPosition));
		const LookVectorValue = math.abs(this.renderingObject.PrimaryPart.CFrame.LookVector.Dot(convertedPosition));

		this.renderingObject.PivotTo(
			positioning.mul(rotationRelative.Inverse()).mul(this.renderingObjectRotation.Inverse()),
		);

		// Positioning Stage 3
		const mouseHitObjectSpace = mouseTarget.CFrame.PointToObjectSpace(mouseHit.Position);
		const moveRange = 1; // TODO: Make this configurable
		const offset = roundVectorToBase(
			mouseHitObjectSpace.sub(
				new Vector3(
					math.abs(normalPositioning.vector.X),
					math.abs(normalPositioning.vector.Y),
					math.abs(normalPositioning.vector.Z),
				).mul(mouseHitObjectSpace),
			),
			moveRange,
		);

		this.renderingObject.PivotTo(
			positioning
				.mul(
					new CFrame(
						normalPositioning.vector.mul(
							RightVectorValue * (this.renderingObject.PrimaryPart.Size.X / 2) +
								UpVectorValue * (this.renderingObject.PrimaryPart.Size.Y / 2) +
								LookVectorValue * (this.renderingObject.PrimaryPart.Size.Z / 2),
						),
					),
				)
				.mul(new CFrame(offset))
				.mul(rotationRelative)
				.mul(this.renderingObjectRotation),
		);
	}
}

function roundVectorToBase(vector: Vector3, base: number): Vector3 {
	const scale = base / 2;
	const x = math.floor(vector.X / base + 0.5) * base;
	const y = math.floor(vector.Y / base + 0.5) * base;
	const z = math.floor(vector.Z / base + 0.5) * base;
	return new Vector3(x, y, z);
}

function normalIdToNormalVector(mouse_surface: Enum.NormalId, part: BasePart): { vector: Vector3; size: number } {
	switch (mouse_surface) {
		case Enum.NormalId.Top:
		case Enum.NormalId.Bottom:
			return { vector: Vector3.FromNormalId(mouse_surface), size: part.Size.Y };
		case Enum.NormalId.Front:
		case Enum.NormalId.Back:
			return { vector: Vector3.FromNormalId(mouse_surface), size: part.Size.Z };
		case Enum.NormalId.Right:
		case Enum.NormalId.Left:
		default:
			return { vector: Vector3.FromNormalId(mouse_surface), size: part.Size.X };
	}
}
