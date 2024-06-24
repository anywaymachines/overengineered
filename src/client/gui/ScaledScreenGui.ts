import { InstanceComponent } from "shared/component/InstanceComponent";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";

let globalScale: ReadonlyObservableValue<number>;
export class ScaledScreenGui<T extends ScreenGui> extends InstanceComponent<T> {
	static initializeGlobalScale(scale: ReadonlyObservableValue<number>) {
		globalScale = scale;
		globalScale.subscribe((scale) => $trace("GUI scaling set to", scale));
	}

	private readonly uiscale: UIScale;

	constructor(gui: T) {
		super(gui);
		if (!globalScale) throw "Global scale was not set";

		let uiscale = gui.FindFirstChild("UIScale") as UIScale | undefined;
		if (!uiscale) {
			uiscale = new Instance("UIScale");
			uiscale.Parent = gui;
		}
		this.uiscale = uiscale;

		const update = () => {
			const asize = this.instance.AbsoluteSize;
			const mult = globalScale.get();

			uiscale.Scale = math.min((asize.Y / 1080) * mult, 9999999);
		};

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(gui as ScreenGui, "AbsoluteSize"),
			update,
		);
		this.event.subscribeObservable(globalScale, update);
		update();
	}

	getScale() {
		return this.uiscale.Scale;
	}
}
