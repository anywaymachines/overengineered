import { Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import GuiController from "client/controller/GuiController";
import BuildingMode from "client/controller/modes/BuildingMode";

/** A tool for wiring */
export default class WireTool extends ToolBase {
	private renderedWires: BasePart[] = [];
	private readonly viewportFrame;

	constructor(mode: BuildingMode) {
		super(mode);

		this.viewportFrame = new Instance("ViewportFrame");
		this.viewportFrame.Name = "WireViewportFrame";
		this.viewportFrame.Size = UDim2.fromScale(1, 1);
		this.viewportFrame.CurrentCamera = Workspace.CurrentCamera;
		this.viewportFrame.Transparency = 1;
		this.viewportFrame.Parent = GuiController.getGameUI();
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

	private renderWire(v1: Vector3, v2: Vector3, color: Color3) {
		const distance = v2.sub(v1).Magnitude;

		const ray_visual = new Instance("Part");
		ray_visual.Anchored = true;
		ray_visual.CanCollide = false;
		ray_visual.CanQuery = false;
		ray_visual.CanTouch = false;

		ray_visual.Material = Enum.Material.Neon;
		ray_visual.Color = color;

		ray_visual.Size = new Vector3(0.15, 0.15, distance);
		ray_visual.CFrame = new CFrame(v1, v2).mul(new CFrame(0, 0, -distance / 2));
		ray_visual.Parent = this.viewportFrame;

		this.renderedWires.push(ray_visual);
	}

	private clearWires() {
		this.renderedWires.forEach((element) => {
			element.Destroy();
		});
	}

	public enable(): void {
		super.enable();
	}

	public disable(): void {
		super.disable();

		this.clearWires();
	}
}
