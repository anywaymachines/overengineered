import { ReplicatedStorage } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";

export default class MirrorVisualizer extends ClientComponent {
	readonly mirrorMode = new ObservableValue<MirrorMode>({});
	readonly plot = new ObservableValue<Model | undefined>(undefined);
	private readonly template;

	constructor() {
		super();

		this.template = Control.asTemplate(ReplicatedStorage.WaitForChild("Assets").WaitForChild("Mirror") as Part);

		this.mirrorMode.subscribe(() => this.recreate());
		this.plot.subscribe((plot, prev) => {
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
		if (!plot) return;

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
			mirror.PivotTo(plot.GetPivot().ToWorldSpace(cframe));
			mirror.Parent = mirrors;
		}
	}
}
