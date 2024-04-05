import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Logger } from "shared/Logger";
import { InstanceComponent } from "shared/component/InstanceComponent";

export class ScaledScreenGui<T extends ScreenGui> extends InstanceComponent<T> {
	constructor(gui: T) {
		super(gui);

		let uiscale = gui.FindFirstChild("UIScale") as UIScale | undefined;
		if (!uiscale) {
			uiscale = new Instance("UIScale");
			uiscale.Parent = gui;
		}

		const update = () => {
			const asize = gui.AbsoluteSize;
			const mult = PlayerDataStorage.config.get().uiScale;

			const scale = math.min((asize.Y / 1080) * mult, 9999999);
			uiscale!.Scale = scale;
			Logger.info("GUI scaling set to " + scale);
		};

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(gui as ScreenGui, "AbsoluteSize"),
			update,
		);
		this.event.subscribeObservable(PlayerDataStorage.config.createChild("uiScale", 1), update);
		update();
	}
}
