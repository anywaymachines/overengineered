import { ReplicatedStorage } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

export default class MirrorVisualizer extends ClientComponent {
	private readonly plot: ReadonlyObservableValue<PlotModel>;
	private readonly mirrorMode: ReadonlyObservableValue<MirrorMode>;
	private readonly template;

	constructor(plot: ReadonlyObservableValue<PlotModel>, mirrorMode: ReadonlyObservableValue<MirrorMode>) {
		super();

		this.plot = plot;
		this.mirrorMode = mirrorMode;
		this.template = this.asTemplate(ReplicatedStorage.WaitForChild("Assets").WaitForChild("Mirror") as Part);

		this.mirrorMode.subscribe(() => this.recreate());
		this.event.subscribeObservable(this.plot, (plot, prev) => {
			prev?.FindFirstChild("Mirrors")?.ClearAllChildren();
			this.recreate();
		});
		this.recreate();
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
		const axes = [
			!mode.y ? undefined : CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(mode.y),
			!mode.x ? undefined : CFrame.identity.add(mode.x),
			!mode.z ? undefined : CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2).add(mode.z),
		] as readonly CFrame[];

		for (const cframe of axes) {
			const mirror = this.template();
			mirror.PivotTo(plot.BuildingArea.GetPivot().ToWorldSpace(cframe));
			mirror.Parent = mirrors;
		}
	}
}
