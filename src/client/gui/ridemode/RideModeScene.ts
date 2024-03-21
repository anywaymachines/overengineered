import { RunService, UserInputService, Workspace } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import Machine from "client/blocks/Machine";
import InputController from "client/controller/InputController";
import { LoadingController } from "client/controller/LoadingController";
import LocalPlayerController from "client/controller/LocalPlayerController";
import Control from "client/gui/Control";
import { ButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import FormattedLabelControl from "client/gui/controls/FormattedLabelControl";
import ProgressBarControl, { ProgressBarControlDefinition } from "client/gui/controls/ProgressBarControl";
import ConfirmPopup from "client/gui/popup/ConfirmPopup";
import TouchModeButtonControl from "client/gui/ridemode/TouchModeButtonControl";
import { requestMode } from "client/modes/PlayModeRequest";
import Remotes from "shared/Remotes";
import RobloxUnit from "shared/RobloxUnit";
import SlotsMeta from "shared/SlotsMeta";
import RocketEngineLogic from "shared/block/logic/RocketEngineLogic";
import EventHandler from "shared/event/EventHandler";
import Signal from "shared/event/Signal";

export type ActionBarControlDefinition = GuiObject & {
	readonly Stop: GuiButton;
	readonly Sit: GuiButton;
	readonly ControlSettings: GuiButton;
	readonly ControlReset: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition, controls: RideModeControls) {
		super(gui);

		const stopButton = this.added(new ButtonControl(this.gui.Stop));
		const sitButton = this.added(new ButtonControl(this.gui.Sit));
		const controlSettingsButton = this.added(new ButtonControl(this.gui.ControlSettings));
		const controlResetButton = this.added(new ButtonControl(this.gui.ControlReset));
		controlResetButton.hide();

		this.onPrepare((input) => {
			if (input === "Touch") {
				controlSettingsButton.show();
			} else {
				controlSettingsButton.hide();
			}
		});

		this.event.subscribe(stopButton.activated, async () => {
			await requestMode("build");
		});

		this.event.subscribe(sitButton.activated, async () => {
			Remotes.Client.GetNamespace("Ride").Get("Sit").SendToServer();
		});

		this.event.subscribe(controlSettingsButton.activated, async () => {
			controls.toggleSettingsMode();
		});

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

	constructor(gui: RideModeControlsDefinition) {
		super(gui);

		this.overlayTemplate = this.asTemplate(this.gui.Overlay);

		this.event.onDisable(() => {
			if (this.quitSettingsMode) {
				this.toggleSettingsMode();
			}
		});
	}

	resetControl(btn: Control, pos: number) {
		const size = btn.getGui().Size;

		let x = 0.95;
		let y = 1 - size.Y.Scale * pos - 0.01 * pos;

		while (y < 0.05) {
			y += 0.95;
			x -= 0.05;
		}

		btn.getGui().Position = new UDim2(x, 0, y, 0);
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
			instance.Parent = child.getGui();
			child.getGui().Active = false;

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
					child.getGui().Position = child
						.getGui()
						.Position.add(
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
							child.getGui().Position.X.Scale * this.gui.AbsoluteSize.X,
							child.getGui().Position.Y.Scale * this.gui.AbsoluteSize.Y,
						);

						const grid = child.getGui().AbsoluteSize.div(4);
						abs = new Vector2(math.round(abs.X / grid.X) * grid.X, math.round(abs.Y / grid.Y) * grid.Y);

						child.getGui().Position = new UDim2(
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
				child.getGui().Active = true;
			}

			this.onQuitSettingsMode.Fire();
			this.remove(overlay);

			for (const eh of ehandlers) {
				eh.unsubscribeAll();
			}

			const touchControls: Record<string, TouchControlInfo[string]> = {};
			for (const [keycode, child] of this.keyedChildren.getAll()) {
				touchControls[keycode] = {
					pos: [child.getGui().Position.X.Scale, child.getGui().Position.Y.Scale],
				};
			}

			await PlayerDataStorage.sendPlayerSlot({
				index: PlayerDataStorage.loadedSlot.get() ?? -1,
				touchControls,
				save: false,
			});
		};
	}

	start(machine: Machine) {
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

		let controlsInfo: TouchControlInfo | undefined;
		const slots = PlayerDataStorage.slots.get();
		if (slots) {
			controlsInfo = SlotsMeta.get(slots, PlayerDataStorage.loadedSlot.get() ?? -1)?.touchControls;
		}

		let pos = 0;
		for (const control of controls) {
			this.keyedChildren.add(control.text.get(), control);

			const keycode = control.text.get() as KeyCode;

			const doload =
				controlsInfo !== undefined &&
				controlsInfo[keycode] !== undefined &&
				controlsInfo[keycode].pos[0] >= control.getGui().AbsoluteSize.X / this.gui.AbsoluteSize.X &&
				controlsInfo[keycode].pos[0] <= 1 &&
				controlsInfo[keycode].pos[1] >= control.getGui().AbsoluteSize.Y / this.gui.AbsoluteSize.Y &&
				controlsInfo[keycode].pos[1] <= 1;

			if (doload) {
				const kc = controlsInfo?.[keycode];
				if (kc) {
					if (kc.pos[0] <= 1) {
						// relative position
						control.getGui().Position = new UDim2(kc.pos[0], 0, kc.pos[1], 0);
					} else {
						// pixel position
						control.getGui().Position = new UDim2(0, kc.pos[0], 0, kc.pos[1]);
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

		this.slider = this.added(new ProgressBarControl(this.gui, min, max, step));
		this.text = this.added(new FormattedLabelControl(this.gui.FormattedText));
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

export default class RideModeScene extends Control<RideModeSceneDefinition> {
	private readonly actionbar;
	private readonly controls;
	private readonly info;

	private readonly infoTemplate;
	private readonly infoTextTemplate;

	constructor(gui: RideModeSceneDefinition) {
		super(gui);

		this.controls = new RideModeControls(this.gui.Controls);
		this.add(this.controls);

		this.actionbar = new ActionBarControl(gui.ActionBar, this.controls);
		this.add(this.actionbar);
		const updateActionBarVisibility = () => this.actionbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable2(LoadingController.isLoading, updateActionBarVisibility);
		this.onEnable(updateActionBarVisibility);

		this.info = new Control(this.gui.Info);
		this.add(this.info);

		this.infoTemplate = this.asTemplate(this.gui.Info.Template);
		this.infoTextTemplate = this.asTemplate(this.gui.Info.TextTemplate);
	}

	private addMeters(machine: Machine) {
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
				if (!LocalPlayerController.rootPart) return;

				const spd = RobloxUnit.getSpeedFromMagnitude(
					LocalPlayerController.rootPart.GetVelocityAtPosition(LocalPlayerController.rootPart.Position)
						.Magnitude,
					"MetersPerSecond",
				);

				control.slider.value.set(spd);
				control.text.value.set(spd);
			});
		}

		{
			const rockets = machine.getChildren().filter((c) => c instanceof RocketEngineLogic);
			if (rockets.size() !== 0) {
				init("Torque", "%s %%", this.infoTemplate(), 0, 100, 1, (control) => {
					const avg: number[] = [];
					for (const block of machine.getChildren()) {
						if (!block.isEnabled()) continue;
						if (!(block instanceof RocketEngineLogic)) continue;
						avg.push(block.getTorque());
					}

					control.slider.value.set(
						avg.size() === 0 ? 0 : avg.reduce((acc, val) => acc + val, 0) / avg.size(),
					);
					control.text.value.set(control.slider.value.get());
				});
			}
		}

		{
			const maxAltitude = RobloxUnit.Studs_To_Meters(1500);
			init("Altitude", "%.2f m", this.infoTextTemplate(), 0, maxAltitude, 0.1, (control) => {
				if (!LocalPlayerController.rootPart) return;

				const alt = RobloxUnit.Studs_To_Meters(LocalPlayerController.rootPart.Position.Y);

				control.slider.value.set(alt);
				control.text.value.set(alt);
			});
		}

		{
			init("Gravity", "%.1f m/s²", this.infoTextTemplate(), 0, 55, 0.1, (control) => {
				const alt = RobloxUnit.Studs_To_Meters(Workspace.Gravity) / 5.14;

				control.text.value.set(alt);
			});
		}

		{
			init("Position", "%s m", this.infoTextTemplate(), 0, 1, 1, (control) => {
				if (!LocalPlayerController.rootPart) return;

				control.text.value.set(
					math.floor(RobloxUnit.Studs_To_Meters(LocalPlayerController.rootPart.Position.X)) +
						" m " +
						math.floor(RobloxUnit.Studs_To_Meters(LocalPlayerController.rootPart.Position.Z)),
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

	start(machine: Machine) {
		if (InputController.inputType.get() === "Touch") {
			this.controls.start(machine);
		}

		this.addMeters(machine);
	}
}
