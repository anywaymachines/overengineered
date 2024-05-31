import { GuiService, StarterGui } from "@rbxts/services";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { Signals } from "client/event/Signals";
import { Popup } from "client/gui/Popup";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { RideMode } from "client/modes/ride/RideMode";
import { Controller } from "shared/component/Controller";
import { ObservableValue } from "shared/event/ObservableValue";
import { Remotes } from "shared/Remotes";

@injectable
export class PlayModeController extends Controller {
	readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	readonly modes;

	static initialize(di: DIContainer) {
		const controller = di.regResolve(PlayModeController);
		for (const [, mode] of pairs(controller.modes)) {
			di.registerSingleton(mode);
		}

		return controller;
	}
	constructor(@inject di: DIContainer) {
		super();

		GuiService.SetGameplayPausedNotificationEnabled(false);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		Remotes.Client.GetNamespace("Ride")
			.Get("SetPlayModeOnClient")
			.SetCallback((mode) => {
				this.playmode.set(mode);
				return { success: true };
			});

		this.modes = {
			build: di.resolveForeignClass(BuildingMode),
			ride: di.resolveForeignClass(RideMode),
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
