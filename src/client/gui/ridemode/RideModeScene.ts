import { Players, RunService, UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import PlayerDataStorage from "client/PlayerDataStorage";
import Control from "client/base/Control";
import Machine from "client/blocks/logic/Machine";
import RocketEngineLogic from "client/blocks/logic/RocketEngineLogic";
import InputController from "client/controller/InputController";
import PopupController from "client/controller/PopupController";
import { requestMode } from "client/controller/modes/PlayModeRequest";
import Remotes from "shared/Remotes";
import RobloxUnit from "shared/RobloxUnit";
import EventHandler from "shared/event/EventHandler";
import { ButtonControl, TextButtonDefinition } from "../controls/Button";
import { DictionaryControl } from "../controls/DictionaryControl";
import FormattedLabelControl from "../controls/FormattedLabelControl";
import ProgressBarControl, { ProgressBarControlDefinition } from "../controls/ProgressBarControl";

export type ActionBarControlDefinition = GuiObject & {
	Stop: GuiButton;
	Sit: GuiButton;
	ControlSettings: GuiButton;
	ControlReset: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition, controls: RideModeControls) {
		super(gui);

		const stopButton = this.added(new ButtonControl(this.gui.Stop));
		const sitButton = this.added(new ButtonControl(this.gui.Sit));
		const controlSettingsButton = this.added(new ButtonControl(this.gui.ControlSettings));
		const controlResetButton = this.added(new ButtonControl(this.gui.ControlReset));
		controlResetButton.hide();

		this.event.onPrepare((input) => {
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
			PopupController.instance.showConfirmation(
				"Reset the controls?",
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
	Overlay: GuiObject;
	Button: TextButtonDefinition;
};
export class RideModeControls extends DictionaryControl<RideModeControlsDefinition, string, Control> {
	readonly onEnterSettingsMode = new Signal<() => void>();
	readonly onQuitSettingsMode = new Signal<() => void>();

	private readonly buttonTemplate;
	private readonly overlayTemplate;
	private quitSettingsMode?: () => void;

	constructor(gui: RideModeControlsDefinition) {
		super(gui);

		this.buttonTemplate = Control.asTemplate(this.gui.Button);
		this.overlayTemplate = Control.asTemplate(this.gui.Overlay);

		this.onDisabled.Connect(() => {
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
		for (const [key, btn] of this.getKeyedChildren()) {
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

		for (const [_, child] of this.getKeyedChildren()) {
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
			for (const [keycode, child] of this.getKeyedChildren()) {
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
		machine.destroyed.Connect(() => this.clear());
		machine.seat.occupiedByLocalPlayer.subscribe((occupied) => {
			if (occupied) this.show();
			else this.hide();
		}, true);

		/*
		const inputType = InputController.inputType.get();
		for (const logic of machine.getChildren()) {
			if (!(logic instanceof ConfigurableBlockLogic)) continue;

			for (const [, input] of Objects.pairs(logic.input)) {
				const gui = input.getRideModeGui(inputType);
				if (!gui) continue;

				this.add(input);
			}
		}
		*/

		/*
		let pos = 0;
		const map: Record<string, ConfigurableBlockLogic<BlockConfigBothDefinitions>[]> = {};
		
		for (const block of machine.getChildren()) {
			if (!(block instanceof ConfigurableBlockLogic)) {
				continue;
			}

			const config = block.config;
			for (const [id, ] of Objects.pairs(block.getKeysDefinition())) {
				const keycode = config.get(id) as KeyCode;
				map[keycode] ??= [];
				map[keycode].push(block);
			}
		}

		let controlsInfo: TouchControlInfo | undefined;
		const slots = PlayerDataStorage.slots.get();
		if (slots) {
			controlsInfo = SlotsMeta.get(slots, PlayerDataStorage.loadedSlot.get() ?? -1)?.touchControls;
		}

		for (const [keycode, blocks] of Objects.pairs(map)) {
			const btn = new TextButtonControl(this.buttonTemplate());
			btn.text.set(keycode);
			this.addKeyed(keycode, btn);

			this.event.subscribe(btn.getGui().InputBegan, (input) => {
				if (
					input.UserInputType === Enum.UserInputType.MouseButton1 ||
					input.UserInputType === Enum.UserInputType.Touch
				) {
					if (!machine.seat.occupiedByLocalPlayer.get()) return;

					for (const block of blocks) {
						block.tryTriggerKeycodeDown(keycode as never);
					}
				}
			});
			this.event.subscribe(btn.getGui().InputEnded, (input) => {
				if (
					input.UserInputType === Enum.UserInputType.MouseButton1 ||
					input.UserInputType === Enum.UserInputType.Touch
				) {
					if (!machine.seat.occupiedByLocalPlayer.get()) return;

					for (const block of blocks) {
						block.tryTriggerKeycodeUp(keycode as never);
					}
				}
			});

			const doload =
				controlsInfo !== undefined &&
				controlsInfo[keycode] !== undefined &&
				controlsInfo[keycode].pos[0] >= btn.getGui().AbsoluteSize.X / this.gui.AbsoluteSize.X &&
				controlsInfo[keycode].pos[0] <= 1 &&
				controlsInfo[keycode].pos[1] >= btn.getGui().AbsoluteSize.Y / this.gui.AbsoluteSize.Y &&
				controlsInfo[keycode].pos[1] <= 1;

			if (doload) {
				const kc = controlsInfo?.[keycode];
				if (kc) btn.getGui().Position = new UDim2(kc.pos[0], 0, kc.pos[1], 0);
			} else {
				this.resetControl(btn, pos);
				pos++;
			}
		}*/
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
	ActionBarGui: ActionBarControlDefinition;
	Controls: RideModeControlsDefinition;
	Info: GuiObject & {
		Template: RideModeInfoControlDefinition & { Title: TextLabel };
		TextTemplate: RideModeInfoControlDefinition & { Title: TextLabel };
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

		this.actionbar = new ActionBarControl(gui.ActionBarGui, this.controls);
		this.add(this.actionbar);
		this.actionbar.show();

		this.info = new Control(this.gui.Info);
		this.add(this.info);

		this.infoTemplate = Control.asTemplate(this.gui.Info.Template);
		this.infoTextTemplate = Control.asTemplate(this.gui.Info.TextTemplate);
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

		const player = Players.LocalPlayer.Character!.WaitForChild("HumanoidRootPart") as Part;

		{
			const maxSpdShow = RobloxUnit.getSpeedFromMagnitude(800, "MetersPerSecond");

			init("Speed", "%d m/s", this.infoTemplate(), 0, maxSpdShow, 0.1, (control) => {
				const spd = RobloxUnit.getSpeedFromMagnitude(
					player.GetVelocityAtPosition(player.Position).Magnitude,
					"MetersPerSecond",
				);

				control.slider.value.set(spd);
				control.text.value.set(spd);
			});
		}

		{
			const rockets = machine.getChildren().filter((c) => c instanceof RocketEngineLogic);
			if (rockets.size() !== 0) {
				init("Torque", "%d %%", this.infoTemplate(), 0, 100, 1, (control) => {
					const avg: number[] = [];
					for (const block of machine.getChildren()) {
						if (!(block instanceof RocketEngineLogic)) continue;
						avg.push(block.getTorque());
					}

					control.slider.value.set(avg.reduce((acc, val) => acc + val, 0) / avg.size());
					control.text.value.set(control.slider.value.get());
				});
			}
		}

		{
			const maxAltitude = RobloxUnit.Studs_To_Meters(1500);
			init("Altitude", "%d m", this.infoTextTemplate(), 0, maxAltitude, 0.1, (control) => {
				const alt = RobloxUnit.Studs_To_Meters(player.Position.Y);

				control.slider.value.set(alt);
				control.text.value.set(alt);
			});
		}

		{
			init("Position", "%s m", this.infoTextTemplate(), 0, 1, 1, (control) => {
				control.text.value.set(
					math.floor(RobloxUnit.Studs_To_Meters(player.Position.X)) +
						" m " +
						math.floor(RobloxUnit.Studs_To_Meters(player.Position.Z)),
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

	public start(machine: Machine) {
		if (InputController.inputType.get() === "Touch") {
			this.controls.start(machine);
		}

		this.addMeters(machine);
	}
}
