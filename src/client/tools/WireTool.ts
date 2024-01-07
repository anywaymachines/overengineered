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

		return marker;
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
		const wire = new Instance("Part");
		wire.Anchored = true;
		wire.CanCollide = false;
		wire.CanQuery = false;
		wire.CanTouch = false;

		wire.Material = Enum.Material.SmoothPlastic;
		wire.Transparency = 0.1;
		wire.Color = color;

		wire.Parent = this.viewportFrame;

		this.updateWire(wire, firstPoint, secondPoint);

		this.renderedWires.push(wire);

		return wire;
	}

	private updateWire(wire: BasePart, firstPoint: Vector3, secondPoint: Vector3) {
		const distance = secondPoint.sub(firstPoint).Magnitude;
		wire.Size = new Vector3(0.1, 0.1, distance - 0.4);
		wire.CFrame = new CFrame(firstPoint, secondPoint).mul(new CFrame(0, 0, -distance / 2));
	}

	private clearWire(wire: BasePart) {
		wire.Destroy();
		this.renderedWires.remove(this.renderedWires.indexOf(wire));
	}

	private clearWires() {
		this.renderedWires.forEach((element) => {
			element.Destroy();
		});
		this.renderedWires.clear();
	}

	private clearMarkers() {
		this.renderedMarkers.forEach((element) => {
			element.Destroy();
		});
		this.renderedMarkers.clear();
	}

	public enable(): void {
		super.enable();

		const part = Workspace.FindFirstChild("Part") as BasePart;
		const col = Color3.fromRGB(107, 176, 219);
		this.createMarker(part, "output", col);
		this.createWire(part.Position, new Vector3(50, 50, 50), col);

		/*
			key - boolean
			switch - boolean
			number - number
		*/
	}

	public disable(): void {
		super.disable();

		this.clearWires();
		this.clearMarkers();
	}
}
