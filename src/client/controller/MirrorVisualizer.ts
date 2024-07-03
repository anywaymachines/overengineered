import { ReplicatedStorage } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";

export class MirrorVisualizer extends ClientComponent {
	private readonly plot: ReadonlyObservableValue<SharedPlot>;
	private readonly mirrorMode: ReadonlyObservableValue<MirrorMode>;
	private readonly template;

	constructor(plot: ReadonlyObservableValue<SharedPlot>, mirrorMode: ReadonlyObservableValue<MirrorMode>) {
		super();

		this.plot = plot;
		this.mirrorMode = mirrorMode;
		this.template = this.asTemplate(ReplicatedStorage.WaitForChild("Assets").WaitForChild("Mirror") as Part);

		this.event.subscribeObservable(this.mirrorMode, () => this.recreate(), true);
		this.event.subscribeObservable(this.plot, (plot, prev) => {
			prev?.instance.FindFirstChild("Mirrors")?.ClearAllChildren();
			this.recreate();
		});
	}

	enable() {
		super.enable();
		this.recreate();
	}

	disable() {
		super.disable();
		this.plot.get()?.instance.FindFirstChild("Mirrors")?.ClearAllChildren();
	}

	private recreate() {
		const plot = this.plot.get();

		let mirrors = plot.instance.FindFirstChild("Mirrors");
		if (!mirrors) {
			mirrors = new Instance("Folder");
			mirrors.Name = "Mirrors";
			mirrors.Parent = plot.instance;
		}

		mirrors.ClearAllChildren();

		const mode = this.mirrorMode.get();
		const axes: (readonly [CFrame, number])[] = [];

		if (mode.y !== undefined)
			axes.push([
				CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(new Vector3(0, mode.y, 0)),
				plot.bounds.originalSize.X,
			]);
		if (mode.x !== undefined)
			axes.push([CFrame.identity.add(new Vector3(0, 0, mode.x)), plot.bounds.originalSize.X]);
		if (mode.z !== undefined)
			axes.push([
				CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2).add(new Vector3(mode.z, 0, 0)),
				plot.bounds.originalSize.Z,
			]);

		for (const [cframe, size] of axes) {
			const mirror = this.template();
			mirror.PivotTo(plot.getCenter().ToWorldSpace(cframe));
			mirror.Size = new Vector3(size, 1, 0.001);
			mirror.Parent = mirrors;
		}
	}
}
