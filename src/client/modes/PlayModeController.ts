import { GuiService, StarterGui } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Signals } from "client/event/Signals";
import { Popup } from "client/gui/Popup";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { requestMode } from "client/modes/PlayModeRequest";
import { RideMode } from "client/modes/ride/RideMode";
import { ObservableValue } from "shared/event/ObservableValue";
import { HostedService } from "shared/GameHost";
import { CustomRemotes } from "shared/Remotes";

@injectable
export class PlayModeController extends HostedService {
	private readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	private readonly modes;

	static initialize(host: GameHostBuilder) {
		host.services.registerSingletonClass(BuildingMode);
		host.services.registerSingletonClass(RideMode);
		host.services.registerService(PlayModeController);
	}
	constructor(@inject build: BuildingMode, @inject ride: RideMode) {
		super();

		GuiService.SetGameplayPausedNotificationEnabled(false);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		CustomRemotes.modes.setOnClient.subscribe((mode) => {
			if (mode) {
				Signals.LOCAL_PLAY_MODE_CHANGED.Fire(mode);
			}

			this.playmode.set(mode);
			return { success: true };
		});

		this.modes = {
			build,
			ride,
		} as const;

		for (const [_, mode] of pairs(this.modes)) {
			mode.disable();
		}

		const controls = LocalPlayer.getPlayerModule().GetControls();
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

		this.onEnable(() => {
			spawn(() => requestMode("build"));
			Signals.PLAYER.SPAWN.Connect(() => spawn(() => requestMode("build")));
		});
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
