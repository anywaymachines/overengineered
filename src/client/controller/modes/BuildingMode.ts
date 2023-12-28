import { Players } from "@rbxts/services";
import BuildingModeScene, { BuildingModeSceneDefinition } from "client/gui/scenes/BuildingModeScene";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import GuiController from "../GuiController";
import MirrorVisualizer from "../MirrorVisualizer";
import ToolController from "../ToolController";
import PlayMode from "./PlayMode";

export default class BuildingMode extends PlayMode {
	readonly mirrorMode = new ObservableValue<readonly CFrame[]>([
		CFrame.identity,
		CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2),
		CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(new Vector3(0, 4, 0)),
	]);

	readonly mirrorVisualizer = new MirrorVisualizer();

	constructor() {
		super();

		this.mirrorVisualizer.mirrorMode.bindTo(this.mirrorMode);
		this.add(this.mirrorVisualizer);

		const tools = new ToolController(this);
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

		delay(0.1, tp);
	}
}
