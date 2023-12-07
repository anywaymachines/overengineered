import { Players } from "@rbxts/services";
import BuildingModeScene, { BuildingModeSceneDefinition } from "client/gui/scenes/BuildingModeScene";
import SharedPlots from "shared/building/SharedPlots";
import GuiController from "../GuiController";
import ToolController from "../ToolController";
import PlayMode from "./PlayMode";

export default class BuildingMode extends PlayMode {
	constructor() {
		super();

		const tools = new ToolController();
		this.add(tools);

		const scene = new BuildingModeScene(
			GuiController.getGameUI<{ BuildingMode: BuildingModeSceneDefinition }>().BuildingMode,
			tools,
		);
		this.add(scene);
	}

	getName(): PlayModes {
		return "build";
	}

	public onSwitchTo(mode: PlayModes | undefined) {}
	public onSwitchFrom(prev: PlayModes | undefined) {
		if (Players.LocalPlayer.Character) {
			const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
			const pos = plot.GetPivot().Position.add(new Vector3(plot.GetExtentsSize().X / 2 + 2, 10, 0));
			const hrp = Players.LocalPlayer.Character.FindFirstChild("HumanoidRootPart") as Part;
			hrp.CFrame = new CFrame(pos);

			hrp.AssemblyLinearVelocity = Vector3.zero;
			hrp.AssemblyAngularVelocity = Vector3.zero;
		}
	}
}
