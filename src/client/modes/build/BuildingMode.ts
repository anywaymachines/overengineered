import { LocalPlayer } from "client/controller/LocalPlayer";
import { MirrorVisualizer } from "client/controller/MirrorVisualizer";
import { BuildingModeScene } from "client/gui/buildmode/BuildingModeScene";
import { Gui } from "client/gui/Gui";
import { PlayMode } from "client/modes/PlayMode";
import { BlockSelect } from "client/tools/highlighters/BlockSelect";
import { ToolController } from "client/tools/ToolController";
import { ObservableValue } from "shared/event/ObservableValue";
import { SharedRagdoll } from "shared/SharedRagdoll";
import type { BuildingModeSceneDefinition } from "client/gui/buildmode/BuildingModeScene";
import type { SharedPlot } from "shared/building/SharedPlot";

declare global {
	type MirrorMode = {
		readonly x?: number;
		readonly y?: number;
		readonly z?: number;
	};
}

export type EditMode = "global" | "local";

@injectable
export class BuildingMode extends PlayMode {
	readonly mirrorMode = new ObservableValue<MirrorMode>({});
	readonly targetPlot;
	readonly mirrorVisualizer;
	readonly toolController;
	readonly gui;
	readonly gridEnabled = new ObservableValue(true);
	readonly editMode = new ObservableValue<EditMode>("global");

	constructor(@inject di: DIContainer, @inject plot: SharedPlot) {
		super();

		di = di.beginScope();
		di.registerSingleton(this);

		this.event.subInput((ih) => {
			ih.onKeyDown("LeftControl", () => this.gridEnabled.set(false));
			ih.onKeyUp("LeftControl", () => this.gridEnabled.set(true));
		});

		this.targetPlot = new ObservableValue<SharedPlot | undefined>(undefined).withDefault(plot);
		this.targetPlot.subscribe((plot, prev) => {
			const index = BlockSelect.blockRaycastParams.FilterDescendantsInstances.indexOf(prev.instance);
			if (index !== -1) {
				BlockSelect.blockRaycastParams.FilterDescendantsInstances.remove(index);
			}

			BlockSelect.blockRaycastParams.AddToFilter(plot.instance);
		}, true);

		this.mirrorVisualizer = this.parent(new MirrorVisualizer(this.targetPlot, this.mirrorMode));

		this.toolController = this.parent(di.resolveForeignClass(ToolController));
		this.gui = this.parentGui(
			new BuildingModeScene(
				Gui.getGameUI<{ BuildingMode: BuildingModeSceneDefinition }>().BuildingMode,
				this,
				this.toolController,
				di,
			),
		);
	}

	getName(): PlayModes {
		return "build";
	}

	onSwitchToNext(mode: PlayModes | undefined) {}
	onSwitchFromPrev(prev: PlayModes | undefined) {
		const plot = this.targetPlot.get();

		const tp = () => {
			const rootPart = LocalPlayer.rootPart.get();
			if (!rootPart) return;

			const pos = plot.getSpawnPosition();
			if (rootPart.Position.sub(pos).Magnitude < plot.instance.BuildingArea.ExtentsSize.X) {
				return;
			}

			forcetp();
		};

		const forcetp = () => {
			const rootPart = LocalPlayer.rootPart.get();
			if (!rootPart) return;

			const humanoid = LocalPlayer.humanoid.get();
			if (!humanoid) return;

			task.spawn(() => SharedRagdoll.event.send(false));

			const pos = plot.getSpawnPosition();
			rootPart.CFrame = new CFrame(pos);
			rootPart.AssemblyLinearVelocity = Vector3.zero;
			rootPart.AssemblyAngularVelocity = Vector3.zero;
		};

		if (!prev) {
			task.delay(0.1, forcetp);
		} else {
			task.delay(0.1, tp);
		}
	}
}
