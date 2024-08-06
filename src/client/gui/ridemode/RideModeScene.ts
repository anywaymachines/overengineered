import { RunService, UserInputService, Workspace } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { FormattedLabelControl } from "client/gui/controls/FormattedLabelControl";
import { ProgressBarControl } from "client/gui/controls/ProgressBarControl";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { TouchModeButtonControl } from "client/gui/ridemode/TouchModeButtonControl";
import { requestMode } from "client/modes/PlayModeRequest";
import { RocketEngineLogic } from "shared/block/logic/RocketEngineLogic";
import { EventHandler } from "shared/event/EventHandler";
import { Signal } from "shared/event/Signal";
import { CustomRemotes } from "shared/Remotes";
import { RobloxUnit } from "shared/RobloxUnit";
import { SlotsMeta } from "shared/SlotsMeta";
import type { ClientMachine } from "client/blocks/ClientMachine";
import type { Machine } from "client/blocks/Machine";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { ProgressBarControlDefinition } from "client/gui/controls/ProgressBarControl";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

export type ActionBarControlDefinition = GuiObject & {
	readonly Stop: GuiButton;
	readonly Sit: GuiButton;
	readonly ControlSettings: GuiButton;
	readonly ControlReset: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition, controls: RideModeControls) {
		super(gui);

		const stopButton = this.add(new ButtonControl(this.gui.Stop));
		const sitButton = this.add(new ButtonControl(this.gui.Sit));
		const controlSettingsButton = this.add(new ButtonControl(this.gui.ControlSettings));
		const controlResetButton = this.add(new ButtonControl(this.gui.ControlReset));
		controlResetButton.hide();

		this.onPrepare((input) => {
			if (input === "Touch") {
				controlSettingsButton.show();
			} else {
				controlSettingsButton.hide();
			}
		});

		this.event.subscribe(stopButton.activated, () => requestMode("build"));
		this.event.subscribe(sitButton.activated, () => CustomRemotes.modes.ride.teleportOnSeat.send());
		this.event.subscribe(controlSettingsButton.activated, () => controls.toggleSettingsMode());

		this.event.subscribe(controlResetButton.activated, async () => {
			ConfirmPopup.showPopup(
				"Reset the controls?",
				"It will be impossible to undo this action",
				() => controls.resetControls(),
				() => {},
			);
		});

		this.event.subscribe(controls.onEnterSettingsMode, () => {
			stopButton.hide();
			sitButton.hide();
			controlResetButton.show();
		});
		this.event.subscribe(controls.onQuitSettingsMode, () => {
			stopButton.show();
			sitButton.show();
			controlResetButton.hide();
		});
	}
}

type RideModeControlsDefinition = GuiObject & {
	readonly Overlay: GuiObject;
	readonly Button: TextButtonDefinition;
};
export class RideModeControls extends DictionaryControl<RideModeControlsDefinition, string, Control> {
	readonly onEnterSettingsMode = new Signal<() => void>();
	readonly onQuitSettingsMode = new Signal<() => void>();

	private readonly overlayTemplate;
	private quitSettingsMode?: () => void;

	constructor(
		gui: RideModeControlsDefinition,
		private readonly playerData: PlayerDataStorage,
	) {
		super(gui);

		this.overlayTemplate = this.asTemplate(this.gui.Overlay);

		this.onDisable(() => {
			if (this.quitSettingsMode) {
				this.toggleSettingsMode();
			}
		});
	}

	resetControl(btn: Control, pos: number) {
		const size = btn.instance.Size;

		let x = 0.95;
		let y = 1 - size.Y.Scale * pos - 0.01 * pos;

		while (y < 0.05) {
			y += 0.95;
			x -= 0.05;
		}

		btn.instance.Position = new UDim2(x, 0, y, 0);
	}
	resetControls() {
		let pos = 0;
		for (const [key, btn] of this.keyedChildren.getAll()) {
			this.resetControl(btn, pos);
			pos++;
		}
	}

	toggleSettingsMode() {
		if (this.quitSettingsMode) {
			this.quitSettingsMode();
			this.quitSettingsMode = undefined;
			return;
		}

		const overlay = new Control(new Instance("Frame"));
		this.add(overlay);
		const ehandlers: EventHandler[] = [];
		let inputting = false;

		for (const [_, child] of this.keyedChildren.getAll()) {
			if (child === overlay) continue;

			const instance = this.overlayTemplate();
			instance.Position = new UDim2(0, 0, 0, 0);
			instance.Size = new UDim2(1, 0, 1, 0);
			instance.Parent = child.instance;
			child.instance.Active = false;

			instance.InputBegan.Connect((input) => {
				if (inputting) return;

				if (
					input.UserInputType !== Enum.UserInputType.MouseButton1 &&
					input.UserInputType !== Enum.UserInputType.Touch
				)
					return;
				inputting = true;

				let prevpos = input.Position;

				const eh = new EventHandler();
				ehandlers.push(eh);
				eh.subscribe(UserInputService.InputChanged, (input) => {
					if (
						input.UserInputType !== Enum.UserInputType.MouseMovement &&
						input.UserInputType !== Enum.UserInputType.Touch
					)
						return;

					const delta = input.Position.sub(prevpos);
					prevpos = input.Position;
					child.instance.Position = child.instance.Position.add(
						new UDim2(delta.X / this.gui.AbsoluteSize.X, 0, delta.Y / this.gui.AbsoluteSize.Y, 0),
					);
				});

				eh.subscribe(UserInputService.InputEnded, (input) => {
					if (
						input.UserInputType !== Enum.UserInputType.MouseButton1 &&
						input.UserInputType !== Enum.UserInputType.Touch
					)
						return;

					{
						let abs = new Vector2(
							child.instance.Position.X.Scale * this.gui.AbsoluteSize.X,
							child.instance.Position.Y.Scale * this.gui.AbsoluteSize.Y,
						);

						const grid = child.instance.AbsoluteSize.div(4);
						abs = new Vector2(math.round(abs.X / grid.X) * grid.X, math.round(abs.Y / grid.Y) * grid.Y);

						child.instance.Position = new UDim2(
							abs.X / this.gui.AbsoluteSize.X,
							0,
							abs.Y / this.gui.AbsoluteSize.Y,
							0,
						);
					}

					eh.unsubscribeAll();
					ehandlers.remove(ehandlers.indexOf(eh));
					inputting = false;
				});
			});

			const box = new Control(instance);
			overlay.add(box);
		}

		this.onEnterSettingsMode.Fire();
		this.quitSettingsMode = async () => {
			for (const child of overlay.getChildren()) {
				if (!(child instanceof Control)) continue;
				child.instance.Active = true;
			}

			this.onQuitSettingsMode.Fire();
			this.remove(overlay);

			for (const eh of ehandlers) {
				eh.unsubscribeAll();
			}

			const touchControls: Record<string, TouchControlInfo[string]> = {};
			for (const [keycode, child] of this.keyedChildren.getAll()) {
				touchControls[keycode] = {
					pos: [child.instance.Position.X.Scale, child.instance.Position.Y.Scale],
				};
			}

			await this.playerData.sendPlayerSlot({
				index: this.playerData.loadedSlot.get() ?? -1,
				touchControls,
				save: false,
			});
		};
	}

	start(machine: Machine | ClientMachine) {
		this.clear();
		machine.onDestroy(() => this.clear());
		machine.occupiedByLocalPlayer.subscribe((occupied) => {
			if (occupied) this.show();
			else this.hide();
		}, true);

		const inputType = InputController.inputType.get();

		const inputLogics = machine.logicInputs.getChildren();
		const controls = [
			...TouchModeButtonControl.fromBlocks(inputType, inputLogics),
			//
		];

		const slots = this.playerData.slots.get();
		const controlsInfo = SlotsMeta.get(slots, this.playerData.loadedSlot.get() ?? -1)?.touchControls;

		let pos = 0;
		for (const control of controls) {
			this.keyedChildren.add(control.text.get(), control);

			const keycode = control.text.get() as KeyCode;

			const doload =
				controlsInfo !== undefined &&
				controlsInfo[keycode] !== undefined &&
				controlsInfo[keycode].pos[0] >= control.instance.AbsoluteSize.X / this.gui.AbsoluteSize.X &&
				controlsInfo[keycode].pos[0] <= 1 &&
				controlsInfo[keycode].pos[1] >= control.instance.AbsoluteSize.Y / this.gui.AbsoluteSize.Y &&
				controlsInfo[keycode].pos[1] <= 1;

			if (doload) {
				const kc = controlsInfo?.[keycode];
				if (kc) {
					if (kc.pos[0] <= 1) {
						// relative position
						control.instance.Position = new UDim2(kc.pos[0], 0, kc.pos[1], 0);
					} else {
						// pixel position
						control.instance.Position = new UDim2(0, kc.pos[0], 0, kc.pos[1]);
					}
				}
			} else {
				this.resetControl(control, pos);
				pos++;
			}
		}
	}
}

export type RideModeInfoControlDefinition = GuiObject & ProgressBarControlDefinition & { FormattedText: TextLabel };
export class RideModeInfoControl extends Control<RideModeInfoControlDefinition> {
	readonly slider;
	readonly text;

	constructor(gui: RideModeInfoControlDefinition, min: number, max: number, step: number) {
		super(gui);

		this.slider = this.add(new ProgressBarControl(this.gui, min, max, step));
		this.text = this.add(new FormattedLabelControl(this.gui.FormattedText));
	}
}

export type RideModeSceneDefinition = GuiObject & {
	readonly ActionBar: ActionBarControlDefinition;
	readonly Controls: RideModeControlsDefinition;
	readonly Info: GuiObject & {
		readonly Template: RideModeInfoControlDefinition & { Title: TextLabel };
		readonly TextTemplate: RideModeInfoControlDefinition & { Title: TextLabel };
	};
};

export class RideModeScene extends Control<RideModeSceneDefinition> {
	private readonly actionbar;
	private readonly controls;
	private readonly info;

	private readonly infoTemplate;
	private readonly infoTextTemplate;

	constructor(gui: RideModeSceneDefinition, playerData: PlayerDataStorage) {
		super(gui);

		this.controls = new RideModeControls(this.gui.Controls, playerData);
		this.add(this.controls);

		this.actionbar = new ActionBarControl(gui.ActionBar, this.controls);
		this.add(this.actionbar);
		const updateActionBarVisibility = () => this.actionbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable(LoadingController.isLoading, updateActionBarVisibility);
		this.onEnable(updateActionBarVisibility);

		this.info = new Control(this.gui.Info);
		this.add(this.info);

		this.infoTemplate = this.asTemplate(this.gui.Info.Template);
		this.infoTextTemplate = this.asTemplate(this.gui.Info.TextTemplate);
	}

	private addMeters(machine: IReadonlyContainerComponent) {
		this.info.clear();

		const init = (
			title: string,
			textformat: string,
			gui: RideModeInfoControlDefinition & { Title: TextLabel },
			min: number,
			max: number,
			step: number,
			update: (control: RideModeInfoControl) => void,
		) => {
			gui.Title.Text = title.upper();
			gui.FormattedText!.Text = textformat;

			const control = new RideModeInfoControl(gui, min, max, step);
			control.event.subscribe(RunService.Heartbeat, () => update(control));
			this.info.add(control);
		};

		{
			const maxSpdShow = RobloxUnit.getSpeedFromMagnitude(800, "MetersPerSecond");

			init("Speed", "%.1f m/s", this.infoTemplate(), 0, maxSpdShow, 0.1, (control) => {
				const rootPart = LocalPlayer.rootPart.get();
				if (!rootPart) return;

				const spd = RobloxUnit.getSpeedFromMagnitude(
					rootPart.GetVelocityAtPosition(rootPart.Position).Magnitude,
					"MetersPerSecond",
				);

				control.slider.value.set(spd);
				control.text.value.set(spd);
			});
		}

		{
			const rockets = machine
				.getChildren()
				.filter((c) => c instanceof RocketEngineLogic) as unknown as readonly RocketEngineLogic[];
			if (rockets.size() !== 0) {
				init("Torque", "%s %%", this.infoTemplate(), 0, 100, 1, (control) => {
					let avgg = 0;
					let amount = 0;
					for (const rocket of rockets) {
						if (!rocket.isEnabled()) continue;

						avgg += rocket.getTorque();
						amount++;
					}

					control.slider.value.set(amount === 0 ? 0 : avgg / amount);
					control.text.value.set(math.round(control.slider.value.get()));
				});
			}
		}

		{
			const maxAltitude = RobloxUnit.Studs_To_Meters(1500);
			init("Altitude", "%.2f m", this.infoTextTemplate(), 0, maxAltitude, 0.1, (control) => {
				const rootPart = LocalPlayer.rootPart.get();
				if (!rootPart) return;

				const alt = RobloxUnit.Studs_To_Meters(LocalPlayer.getPlayerRelativeHeight());
				control.slider.value.set(alt);
				control.text.value.set(alt);
			});
		}

		{
			init("Gravity", "%.1f m/s²", this.infoTextTemplate(), 0, 55, 0.1, (control) => {
				const alt = RobloxUnit.Studs_To_Meters(Workspace.Gravity);

				control.text.value.set(alt);
			});
		}

		{
			init("Position", "%s", this.infoTextTemplate(), 0, 1, 1, (control) => {
				const rootPart = LocalPlayer.rootPart.get();
				if (!rootPart) return;

				control.text.value.set(
					`${math.floor(RobloxUnit.Studs_To_Meters(rootPart.Position.X))} ${math.floor(RobloxUnit.Studs_To_Meters(rootPart.Position.Z))}`,
				);
			});
		}

		{
			const startTime = DateTime.now();
			const pretty = (ms: number) => {
				return `${math.floor(ms / 1000 / 60 / 60)}h ${math.floor(ms / 1000 / 60) % 60}m ${
					math.floor(ms / 1000) % 60
				}s`;
			};

			init("Time", "%s", this.infoTextTemplate(), 0, 1, 1, (control) => {
				control.text.value.set(
					pretty(
						DateTime.fromUnixTimestampMillis(
							DateTime.now().UnixTimestampMillis - startTime.UnixTimestampMillis,
						).UnixTimestampMillis,
					),
				);
			});
		}
	}

	start(machine: Machine | ClientMachine) {
		if (InputController.inputType.get() === "Touch") {
			this.controls.start(machine);
		}

		this.addMeters(machine);
	}
}
