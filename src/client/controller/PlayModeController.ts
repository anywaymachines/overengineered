import ComponentBase from "client/base/ComponentBase";
import Popup from "client/base/Popup";
import Signals from "client/event/Signals";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import ObservableValue from "shared/event/ObservableValue";
import LocalPlayerController from "./LocalPlayerController";
import BuildingMode from "./modes/BuildingMode";
import RideMode from "./modes/RideMode";

export default class PlayModeController extends ComponentBase {
	public readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	private readonly modes;

	constructor() {
		super();

		Remotes.Client.GetNamespace("Ride")
			.Get("SetPlayModeOnClient")
			.SetCallback((mode) => {
				this.playmode.set(mode);
				return { success: true };
			});

		this.modes = {
			build: new BuildingMode(),
			ride: new RideMode(),
		} as const;

		for (const mode of Objects.values(this.modes)) {
			mode.disable();
		}

		const controls = LocalPlayerController.getPlayerModule().GetControls();
		this.event.subscribe(Popup.onAnyShow, () => {
			controls.Disable();

			const active = this.playmode.get();
			if (active) this.modes[active].disable();
		});
		this.event.subscribe(Popup.onAnyHide, () => {
			controls.Enable();

			const active = this.playmode.get();
			if (active) this.modes[active].enable();
		});

		this.event.subscribeObservable(this.playmode, (mode, prev) => this.setMode(mode, prev));
		this.event.subscribe(Signals.PLAYER.DIED, () => this.setMode(undefined, this.playmode.get()));

		this.setMode(this.playmode.get(), undefined);
	}

	private async setMode(mode: PlayModes | undefined, prev: PlayModes | undefined) {
		if (mode === prev) return;

		if (prev) {
			this.modes[prev].onSwitchToNext(mode);
			this.modes[prev].disable();
		}
		if (mode) {
			this.modes[mode].onSwitchFromPrev(prev);
			this.modes[mode].enable();
		}
	}
}
