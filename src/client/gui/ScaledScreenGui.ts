import { PlayerDataStorage } from "client/PlayerDataStorage";
import { InstanceComponent } from "shared/component/InstanceComponent";

export class ScaledScreenGui<T extends ScreenGui> extends InstanceComponent<T> {
	private readonly uiscale: UIScale;

	constructor(gui: T) {
		super(gui);

		let uiscale = gui.FindFirstChild("UIScale") as UIScale | undefined;
		if (!uiscale) {
			uiscale = new Instance("UIScale");
			uiscale.Parent = gui;
		}
		this.uiscale = uiscale;

		const update = () => {
			const asize = this.instance.AbsoluteSize;
			const mult = PlayerDataStorage.config.get().uiScale;

			const scale = math.min((asize.Y / 1080) * mult, 9999999);
			uiscale!.Scale = scale;
			$log("GUI scaling set to " + scale);
		};

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(gui as ScreenGui, "AbsoluteSize"),
			update,
		);
		this.event.subscribeObservable(PlayerDataStorage.config.createChild("uiScale", 1), update);
		update();
	}

	getScale() {
		return this.uiscale.Scale;
	}
}
