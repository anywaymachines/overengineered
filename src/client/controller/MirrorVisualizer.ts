import { ReplicatedStorage } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import Control from "client/gui/Control";
import ObservableValue from "shared/event/ObservableValue";

export default class MirrorVisualizer extends ClientComponent {
	readonly mirrorMode = new ObservableValue<readonly CFrame[]>([]);
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

	public enable() {
		super.enable();
		this.recreate();
	}

	public disable() {
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

		for (const cframe of this.mirrorMode.get()) {
			const mirror = this.template();
			mirror.PivotTo(plot.GetPivot().ToWorldSpace(cframe));
			mirror.Parent = mirrors;
		}
	}
}
