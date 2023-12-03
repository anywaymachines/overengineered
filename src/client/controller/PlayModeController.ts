import Remotes from "shared/Remotes";
import SoundController from "./SoundController";
import ObservableValue from "shared/event/ObservableValue";
import ComponentContainer from "client/base/ComponentContainer";
import BuildingMode from "./modes/BuildingMode";
import PlayMode from "./modes/PlayMode";
import RideMode from "./modes/RideMode";
import Signals from "client/event/Signals";
import PlayerController from "./PlayerController";
import Popup from "client/base/Popup";
import BlockLogicController from "./BlockLogicController";
import Objects from "shared/Objects";

export default class PlayModeController extends ComponentContainer {
	public readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	private readonly modeContainer;
	private readonly modes;

	constructor() {
		super();

		Remotes.Client.GetNamespace("Ride")
			.Get("SetPlayModeOnClient")
			.SetCallback((mode) => {
				this.playmode.set(mode);
				return { success: true };
			});

		this.modeContainer = new ComponentContainer<PlayMode>();
		this.modeContainer.enable();

		const build = new BuildingMode();
		this.modeContainer.add(build);

		const ride = new RideMode();
		this.modeContainer.add(ride);

		this.playmode.subscribe((mode: PlayModes | undefined, prev: PlayModes | undefined) => {
			if (prev === "build" && mode === "ride") {
				BlockLogicController.setupBlocks();
				SoundController.getSounds().RideMode.RideStart.Play();
			}
		});

		this.modes = { build, ride } as const;
		for (const mode of Objects.values(this.modes)) {
			mode.disable();
		}

		const controls = PlayerController.getPlayerModule().GetControls();
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

		this.event.subscribeObservable(this.playmode, (mode, prev) => this.setMode(mode, prev), true);
		this.event.subscribe(Signals.PLAYER.DIED, () => this.setMode(undefined, this.playmode.get()));
	}

	private async setMode(mode: PlayModes | undefined, prev: PlayModes | undefined) {
		if (prev) this.modes[prev].disable();
		if (mode) this.modes[mode].enable();
	}
}
