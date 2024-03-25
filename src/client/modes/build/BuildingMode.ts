import { Players } from "@rbxts/services";
import LocalPlayerController from "client/controller/LocalPlayerController";
import MirrorVisualizer from "client/controller/MirrorVisualizer";
import Gui from "client/gui/Gui";
import BuildingModeScene, { BuildingModeSceneDefinition } from "client/gui/buildmode/BuildingModeScene";
import PlayMode from "client/modes/PlayMode";
import ToolController from "client/tools/ToolController";
import { SharedPlot } from "shared/building/SharedPlot";
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
	static readonly instance = new BuildingMode();

	readonly mirrorMode = new ObservableValue<MirrorMode>({ x: Vector3.zero });
	readonly targetPlot = new ObservableValue<SharedPlot | undefined>(undefined).withDefault(
		SharedPlots.getPlotComponentByOwnerID(Players.LocalPlayer.UserId),
	);
	readonly mirrorVisualizer;
	readonly toolController;

	private constructor() {
		super();

		this.mirrorVisualizer = this.add(
			new MirrorVisualizer(
				this.targetPlot.createBased((plot) => plot.instance),
				this.mirrorMode,
			),
		);

		this.toolController = this.add(new ToolController(this));
		this.add(
			new BuildingModeScene(
				Gui.getGameUI<{ BuildingMode: BuildingModeSceneDefinition }>().BuildingMode,
				this.toolController,
			),
		);
	}

	getName(): PlayModes {
		return "build";
	}

	onSwitchToNext(mode: PlayModes | undefined) {}
	onSwitchFromPrev(prev: PlayModes | undefined) {
		const tp = () => {
			if (!LocalPlayerController.rootPart) return;

			const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
			const pos = plot.BuildingArea.GetPivot().Position.add(
				new Vector3(plot.BuildingArea.ExtentsSize.X / 2 + 2, 10, 0),
			);

			if (LocalPlayerController.rootPart.Position.sub(pos).Magnitude < plot.BuildingArea.ExtentsSize.X) return;

			LocalPlayerController.rootPart.CFrame = new CFrame(pos);
			LocalPlayerController.rootPart.AssemblyLinearVelocity = Vector3.zero;
			LocalPlayerController.rootPart.AssemblyAngularVelocity = Vector3.zero;
		};

		delay(0.1, tp);
	}
}
