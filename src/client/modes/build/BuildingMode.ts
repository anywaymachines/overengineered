import { Players } from "@rbxts/services";
import LocalPlayerController from "client/controller/LocalPlayerController";
import MirrorVisualizer from "client/controller/MirrorVisualizer";
import Gui from "client/gui/Gui";
import BuildingModeScene, { BuildingModeSceneDefinition } from "client/gui/buildmode/BuildingModeScene";
import PlayMode from "client/modes/PlayMode";
import ToolController from "client/tools/ToolController";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";

declare global {
	type MirrorMode = {
		readonly x?: Vector3;
		readonly y?: Vector3;
		readonly z?: Vector3;
	};
}

export default class BuildingMode extends PlayMode {
	readonly mirrorMode = new ObservableValue<MirrorMode>({ x: Vector3.zero });

	readonly mirrorVisualizer = new MirrorVisualizer();

	constructor() {
		super();

		this.mirrorVisualizer.mirrorMode.bindTo(this.mirrorMode);
		this.add(this.mirrorVisualizer);

		const tools = new ToolController(this);
		this.add(tools);

		const scene = new BuildingModeScene(
			Gui.getGameUI<{ BuildingMode: BuildingModeSceneDefinition }>().BuildingMode,
			tools,
		);
		this.add(scene);
	}

	getName(): PlayModes {
		return "build";
	}

	onSwitchToNext(mode: PlayModes | undefined) {}
	onSwitchFromPrev(prev: PlayModes | undefined) {
		const tp = () => {
			if (!LocalPlayerController.rootPart) return;

			const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
			const pos = plot.GetPivot().Position.add(new Vector3(plot.GetExtentsSize().X / 2 + 2, 10, 0));

			if (LocalPlayerController.rootPart.Position.sub(pos).Magnitude < plot.GetExtentsSize().X) return;

			LocalPlayerController.rootPart.CFrame = new CFrame(pos);
			LocalPlayerController.rootPart.AssemblyLinearVelocity = Vector3.zero;
			LocalPlayerController.rootPart.AssemblyAngularVelocity = Vector3.zero;
		};

		delay(0.1, tp);
	}
}
