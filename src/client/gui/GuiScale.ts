import Logger from "shared/Logger";
import { InstanceComponent } from "shared/component/InstanceComponent";

export class ScaledScreenGui<T extends ScreenGui> extends InstanceComponent<T> {
	constructor(gui: T) {
		super(gui);

		let scale = gui.FindFirstChild("UIScale") as UIScale | undefined;
		if (!scale) {
			scale = new Instance("UIScale");
			scale.Parent = gui;
		}

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(gui as ScreenGui, "AbsoluteSize"),
			(asize) => {
				// scale!.Scale = math.min(asize.Y / 1080, asize.X / 1920);
				scale!.Scale = math.min(asize.Y / 1080, 9999999);
				Logger.info("GUI scaling set to " + scale!.Scale);
			},
			true,
		);
	}
}
