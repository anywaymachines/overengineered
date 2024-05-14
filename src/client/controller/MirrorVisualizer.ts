import { ReplicatedStorage } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { SharedPlots } from "shared/building/SharedPlots";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

export class MirrorVisualizer extends ClientComponent {
	private readonly plot: ReadonlyObservableValue<PlotModel>;
	private readonly mirrorMode: ReadonlyObservableValue<MirrorMode>;
	private readonly template;

	constructor(plot: ReadonlyObservableValue<PlotModel>, mirrorMode: ReadonlyObservableValue<MirrorMode>) {
		super();

		this.plot = plot;
		this.mirrorMode = mirrorMode;
		this.template = this.asTemplate(ReplicatedStorage.WaitForChild("Assets").WaitForChild("Mirror") as Part);

		this.event.subscribeObservable(this.mirrorMode, () => this.recreate(), true);
		this.event.subscribeObservable(this.plot, (plot, prev) => {
			prev?.FindFirstChild("Mirrors")?.ClearAllChildren();
			this.recreate();
		});
	}

	enable() {
		super.enable();
		this.recreate();
	}

	disable() {
		super.disable();
		this.plot.get()?.FindFirstChild("Mirrors")?.ClearAllChildren();
	}

	private recreate() {
		const plot = this.plot.get();

		let mirrors = plot.FindFirstChild("Mirrors");
		if (!mirrors) {
			mirrors = new Instance("Folder");
			mirrors.Name = "Mirrors";
			mirrors.Parent = plot;
		}

		mirrors.ClearAllChildren();

		const mode = this.mirrorMode.get();
		const axes: (readonly [CFrame, number])[] = [];

		if (mode.y !== undefined)
			axes.push([
				CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(new Vector3(0, mode.y, 0)),
				SharedPlots.getPlotBuildingRegion(plot).getSize().X,
			]);
		if (mode.x !== undefined)
			axes.push([
				CFrame.identity.add(new Vector3(0, 0, mode.x)),
				SharedPlots.getPlotBuildingRegion(plot).getSize().X,
			]);
		if (mode.z !== undefined)
			axes.push([
				CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2).add(new Vector3(mode.z, 0, 0)),
				SharedPlots.getPlotBuildingRegion(plot).getSize().Z,
			]);

		for (const [cframe, size] of axes) {
			const mirror = this.template();
			mirror.PivotTo(plot.BuildingArea.GetPivot().ToWorldSpace(cframe));
			mirror.Size = new Vector3(size, 1, 0.001);
			mirror.Parent = mirrors;
		}
	}
}
