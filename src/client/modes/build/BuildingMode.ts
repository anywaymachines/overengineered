import { Players } from "@rbxts/services";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { MirrorVisualizer } from "client/controller/MirrorVisualizer";
import { BuildingModeScene } from "client/gui/buildmode/BuildingModeScene";
import { Gui } from "client/gui/Gui";
import { PlayMode } from "client/modes/PlayMode";
import { BlockSelect } from "client/tools/highlighters/BlockSelect";
import { ToolController } from "client/tools/ToolController";
import { SharedPlots } from "shared/building/SharedPlots";
import { ObservableValue } from "shared/event/ObservableValue";
import type { BuildingModeSceneDefinition } from "client/gui/buildmode/BuildingModeScene";
import type { SharedPlot } from "shared/building/SharedPlot";

declare global {
	type MirrorMode = {
		readonly x?: number;
		readonly y?: number;
		readonly z?: number;
	};
}

@injectable
export class BuildingMode extends PlayMode {
	/** @deprecated TOBEDELETED, only tutorial uses this */
	static readonly instance: BuildingMode = undefined!;

	readonly mirrorMode = new ObservableValue<MirrorMode>({});
	readonly targetPlot = new ObservableValue<SharedPlot | undefined>(undefined).withDefault(
		SharedPlots.getPlotComponentByOwnerID(Players.LocalPlayer.UserId),
	);
	readonly mirrorVisualizer;
	readonly toolController;
	readonly gui;

	constructor(@inject di: DIContainer) {
		super();

		di = di.beginScope();
		di.registerSingleton(this);

		this.targetPlot.subscribe((plot, prev) => {
			const index = BlockSelect.blockRaycastParams.FilterDescendantsInstances.indexOf(prev.instance);
			if (index !== -1) {
				BlockSelect.blockRaycastParams.FilterDescendantsInstances.remove(index);
			}

			BlockSelect.blockRaycastParams.AddToFilter(plot.instance);
		}, true);

		this.mirrorVisualizer = this.parent(
			new MirrorVisualizer(
				this.targetPlot.createBased((plot) => plot.instance),
				this.mirrorMode,
			),
		);

		this.toolController = this.parent(di.resolveForeignClass(ToolController));
		this.gui = this.parentGui(
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
		const plot = SharedPlots.getPlotComponentByOwnerID(Players.LocalPlayer.UserId);

		const tp = () => {
			if (!LocalPlayerController.rootPart) return;

			const pos = plot.getSpawnPosition();
			if (LocalPlayerController.rootPart.Position.sub(pos).Magnitude < plot.instance.BuildingArea.ExtentsSize.X) {
				return;
			}

			forcetp();
		};

		const forcetp = () => {
			if (!LocalPlayerController.rootPart) return;

			const pos = plot.getSpawnPosition();
			LocalPlayerController.rootPart.CFrame = new CFrame(pos);
			LocalPlayerController.rootPart.AssemblyLinearVelocity = Vector3.zero;
			LocalPlayerController.rootPart.AssemblyAngularVelocity = Vector3.zero;
		};

		if (!prev) {
			task.delay(0.1, forcetp);
		} else {
			task.delay(0.1, tp);
		}
	}
}
