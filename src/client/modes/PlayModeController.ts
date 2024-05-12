import { GuiService, StarterGui } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { Signals } from "client/event/Signals";
import { Popup } from "client/gui/Popup";
import { Remotes } from "shared/Remotes";
import { ObservableValue } from "shared/event/ObservableValue";
import { Objects } from "shared/fixes/objects";
import { BuildingMode } from "./build/BuildingMode";
import { RideMode } from "./ride/RideMode";

export class PlayModeController extends ClientComponent {
	readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	readonly modes;

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
			build: BuildingMode.instance,
			ride: new RideMode(),
		} as const;

		for (const [_, mode] of pairs(this.modes)) {
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

		this.event.subscribe(Signals.LOCAL_PLAY_MODE_CHANGED, (mode) => this.callImmediateSetMode(mode));
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...Objects.values(this.modes)];
	}

	private callImmediateSetMode(mode: PlayModes) {
		const prev = this.playmode.get();

		if (prev) {
			this.modes[prev].onImmediateSwitchToNext(mode);
		}

		this.modes[mode].onImmediateSwitchFromPrev(prev);
	}
	private setMode(mode: PlayModes | undefined, prev: PlayModes | undefined) {
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
