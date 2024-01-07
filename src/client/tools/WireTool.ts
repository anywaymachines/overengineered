import { ReplicatedStorage, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import BuildingMode from "client/controller/modes/BuildingMode";
import PartUtils from "shared/utils/PartUtils";

/** A tool for wiring */
export default class WireTool extends ToolBase {
	private renderedWires: BasePart[] = [];
	private renderedMarkers: BillboardGui[] = [];

	private readonly viewportFrame;

	constructor(mode: BuildingMode) {
		super(mode);

		this.viewportFrame = new Instance("ViewportFrame");
		this.viewportFrame.Name = "WireViewportFrame";
		this.viewportFrame.Size = UDim2.fromScale(1, 1);
		this.viewportFrame.CurrentCamera = Workspace.CurrentCamera;
		this.viewportFrame.Transparency = 1;
		this.viewportFrame.Parent = GuiController.getGameUI();
		this.viewportFrame.Ambient = Color3.fromRGB(255, 255, 255);
		this.viewportFrame.LightColor = Color3.fromRGB(255, 255, 255);
	}

	getDisplayName(): string {
		return "Wire Mode";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895880948";
	}

	getShortDescription(): string {
		return "Creating wires for experienced people";
	}

	public getGamepadTooltips(): readonly { key: Enum.KeyCode; text: string }[] {
		return []; // todo
	}

	public getKeyboardTooltips(): readonly { keys: string[]; text: string }[] {
		return []; // todo
	}

	private createMarker(
		part: BasePart,
		markerType: "input" | "connected_input" | "output",
		color: Color3 = Color3.fromRGB(255, 0, 255),
	) {
		let marker;

		if (markerType === "output") {
			marker = ReplicatedStorage.Assets.Wires.WireMarkerOutput.Clone();
		} else if (markerType === "connected_input") {
			marker = ReplicatedStorage.Assets.Wires.WireMarkerInputConnected.Clone();
		} else if (markerType === "input") {
			marker = ReplicatedStorage.Assets.Wires.WireMarkerInput.Clone();
		}

		// TODO: Offset if input exists

		if (!marker) return;

		marker.Adornee = part;
		marker.Parent = GuiController.getGameUI();

		PartUtils.applyToAllDescendantsOfType("TextButton", marker, (button) => {
			if (button.BackgroundColor3 === Color3.fromRGB(255, 0, 255)) {
				button.BackgroundColor3 = color;
			}
		});
		this.renderedMarkers.push(marker);
	}

	/**
	 * Creates a wire that is highlighted and that is on top of all objects. It is not deleted until the cleanup is called
	 * @param firstPoint The origin vector
	 * @param secondPoint The end vector
	 * @param color Wire color
	 */
	private createWire(
		firstPoint: Vector3,
		secondPoint: Vector3,
		color: Color3 = Color3.fromRGB(255, 0, 255),
	): BasePart {
		const distance = secondPoint.sub(firstPoint).Magnitude;

		const ray_visual = new Instance("Part");
		ray_visual.Anchored = true;
		ray_visual.CanCollide = false;
		ray_visual.CanQuery = false;
		ray_visual.CanTouch = false;

		ray_visual.Material = Enum.Material.SmoothPlastic;
		ray_visual.Transparency = 0.1;
		ray_visual.Color = color;

		ray_visual.Size = new Vector3(0.1, 0.1, distance - 0.45);
		ray_visual.CFrame = new CFrame(firstPoint, secondPoint).mul(new CFrame(0, 0, -distance / 2));
		ray_visual.Parent = this.viewportFrame;

		this.renderedWires.push(ray_visual);

		return ray_visual;
	}

	private clearWire(wire: BasePart) {
		wire.Destroy();
	}

	private clearWires() {
		this.renderedWires.forEach((element) => {
			element.Destroy();
		});
	}

	private clearMarkers() {
		this.renderedMarkers.forEach((element) => {
			element.Destroy();
		});
	}

	public enable(): void {
		super.enable();

		const part = Workspace.FindFirstChild("Part") as BasePart;
		const col = Color3.fromRGB(107, 176, 219);
		this.createMarker(part, "output", col);
		this.createWire(part.Position, new Vector3(50, 50, 50), col);
	}

	public disable(): void {
		super.disable();

		this.clearWires();
		this.clearMarkers();
	}
}
