import { Players } from "@rbxts/services";
import Signals from "client/event/Signals";
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

	public onSwitchToNext(mode: PlayModes | undefined) {}
	public onSwitchFromPrev(prev: PlayModes | undefined) {
		const tp = () => {
			if (!Players.LocalPlayer.Character) return;

			const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
			const pos = plot.GetPivot().Position.add(new Vector3(plot.GetExtentsSize().X / 2 + 2, 10, 0));
			const hrp = Players.LocalPlayer.Character.WaitForChild("HumanoidRootPart") as Part;
			hrp.CFrame = new CFrame(pos);

			hrp.AssemblyLinearVelocity = Vector3.zero;
			hrp.AssemblyAngularVelocity = Vector3.zero;
		};

		if (prev === undefined) {
			Signals.PLAYER.SPAWN.Once(tp);
		} else tp();
	}
}
