import { GuiService, StarterGui } from "@rbxts/services";
import ComponentBase from "client/component/ComponentBase";
import LocalPlayerController from "client/controller/LocalPlayerController";
import Signals from "client/event/Signals";
import Popup from "client/gui/Popup";
import Remotes from "shared/Remotes";
import SharedComponentBase from "shared/component/SharedComponentBase";
import ObservableValue from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import BuildingMode from "./build/BuildingMode";
import RideMode from "./ride/RideMode";

export default class PlayModeController extends ComponentBase {
	public readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	public readonly modes;

	constructor() {
		super();

		this.event.onPrepare(() => {
			GuiService.SetGameplayPausedNotificationEnabled(false);
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
		});

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

		for (const [_, mode] of Objects.pairs(this.modes)) {
			mode.disable();
		}

		const controls = LocalPlayerController.getPlayerModule().GetControls();
		this.event.subscribe(Popup.onAnyShow, () => {
			controls.Disable();

			const active = this.playmode.get();
			if (active) this.modes[active].disable();
		});
		this.event.subscribe(Popup.onAllHide, () => {
			controls.Enable();

			const active = this.playmode.get();
			if (active) this.modes[active].enable();
		});

		this.event.subscribeObservable(this.playmode, (mode, prev) => this.setMode(mode, prev));
		this.event.subscribe(Signals.PLAYER.DIED, () => this.setMode(undefined, this.playmode.get()));

		this.setMode(this.playmode.get(), undefined);
	}

	getDebugChildren(): readonly SharedComponentBase[] {
		return Objects.values(this.modes);
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
