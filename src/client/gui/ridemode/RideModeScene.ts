import { Players, RunService, UserInputService } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Control from "client/base/Control";
import Machine from "client/blocks/logic/Machine";
import RocketEngineLogic from "client/blocks/logic/RocketEngineLogic";
import InputController from "client/controller/InputController";
import { requestMode } from "client/controller/modes/PlayModeRequest";
import Remotes from "shared/Remotes";
import RobloxUnit from "shared/RobloxUnit";
import SlotsMeta from "shared/SlotsMeta";
import Objects from "shared/_fixes_/objects";
import EventHandler from "shared/event/EventHandler";
import { ButtonControl, TextButtonControl, TextButtonDefinition } from "../controls/Button";
import { DictionaryControl } from "../controls/DictionaryControl";
import ProgressBarControl from "../controls/ProgressBarControl";
import { SliderControlDefinition } from "../controls/SliderControl";
import RocketEngineGui, { RocketEngineGuiDefinition } from "./RocketEngineGui";

export type ActionBarControlDefinition = GuiObject & {
	Stop: GuiButton;
	Sit: GuiButton;
	Settings: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition, controls: RideModeControls) {
		super(gui);

		const stopButton = this.added(new ButtonControl(this.gui.Stop));
		const sitButton = this.added(new ButtonControl(this.gui.Sit));
		const settingsButton = this.added(new ButtonControl(this.gui.Settings));

		this.event.onPrepare((input) => {
			if (input === "Touch") {
				settingsButton.show();
			} else {
				settingsButton.hide();
			}
		});

		this.event.subscribe(stopButton.activated, async () => {
			await requestMode("build");
		});

		this.event.subscribe(sitButton.activated, async () => {
			Remotes.Client.GetNamespace("Ride").Get("Sit").SendToServer();
		});

		this.event.subscribe(settingsButton.activated, async () => {
			controls.toggleSettingsMode();
		});
	}
}

type RideModeControlsDefinition = GuiObject & {
	Overlay: GuiObject;
	Button: TextButtonDefinition;
};
export class RideModeControls extends DictionaryControl<RideModeControlsDefinition, string, Control> {
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

	toggleSettingsMode() {
		if (this.quitSettingsMode) {
			this.quitSettingsMode();
			this.quitSettingsMode = undefined;
			return;
		}

		const overlay = new Control(new Instance("Frame"));
		this.add(overlay);
		const ehandlers: EventHandler[] = [];

		for (const [_, child] of this.getKeyedChildren()) {
			if (child === overlay) continue;

			const instance = this.overlayTemplate();
			instance.Position = new UDim2(0, 0, 0, 0);
			instance.Size = new UDim2(1, 0, 1, 0);
			instance.Parent = child.getGui();
			child.getGui().Active = false;

			let inputting = false;
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

		this.quitSettingsMode = async () => {
			for (const child of overlay.getChildren()) {
				if (!(child instanceof Control)) continue;
				child.getGui().Active = true;
			}

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

		let pos = 0;
		const map: Record<string, ConfigurableBlockLogic<ConfigValueTypes>[]> = {};

		for (const block of machine.getChildren()) {
			if (!(block instanceof ConfigurableBlockLogic)) {
				continue;
			}

			const config = block.config;
			for (const id of Objects.keys(block.getKeysDefinition())) {
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

		for (const [keycode, blocks] of Objects.entries(map)) {
			const btn = new TextButtonControl(this.buttonTemplate());
			btn.text.set(keycode);
			this.addKeyed(keycode, btn);

			this.event.subscribe(btn.getGui().InputBegan, (input) => {
				if (
					input.UserInputType === Enum.UserInputType.MouseButton1 ||
					input.UserInputType === Enum.UserInputType.Touch
				) {
					if (!machine.seat.occupant) return;

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
					if (!machine.seat.occupant) return;

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
				const size = btn.getGui().Size;
				btn.getGui().Position = new UDim2(0.95, 0, 1 - size.Y.Scale * pos - 0.01 * pos, 0);

				pos++;
			}
		}
	}
}

export type RideModeSceneDefinition = GuiObject & {
	ActionBarGui: ActionBarControlDefinition;
	Torque: RocketEngineGuiDefinition;
	Speed: SliderControlDefinition;
	Controls: RideModeControlsDefinition;
};

export default class RideModeScene extends Control<RideModeSceneDefinition> {
	private readonly actionbar;
	private readonly controls;

	private readonly torqueTemplate;
	private readonly speedTemplate;

	constructor(gui: RideModeSceneDefinition) {
		super(gui);

		this.controls = new RideModeControls(this.gui.Controls);
		this.add(this.controls);

		this.actionbar = new ActionBarControl(gui.ActionBarGui, this.controls);
		this.add(this.actionbar);
		this.actionbar.show();

		this.torqueTemplate = Control.asTemplate(this.gui.Torque);
		this.speedTemplate = Control.asTemplate(this.gui.Speed);
	}

	public start(machine: Machine) {
		if (InputController.inputType.get() === "Touch") {
			this.controls.start(machine);
		}

		{
			const player = Players.LocalPlayer.Character!.WaitForChild("HumanoidRootPart") as Part;
			const maxSpdShow = RobloxUnit.getSpeedFromMagnitude(800, "MetersPerSecond");

			const speed = new ProgressBarControl(this.speedTemplate(), 0, maxSpdShow, 0.1);
			speed.show();
			this.controls.add(speed);

			this.event.subscribe(RunService.Heartbeat, () => {
				const spd = RobloxUnit.getSpeedFromMagnitude(
					player.GetVelocityAtPosition(player.Position).Magnitude,
					"MetersPerSecond",
				);

				speed.value.set(spd);
				speed.getTextValue().set(spd);
			});
		}

		const rockets = machine.getChildren().filter((c) => c instanceof RocketEngineLogic);
		if (rockets.size() !== 0) {
			const torque = new RocketEngineGui(this.torqueTemplate(), machine);
			torque.show();
			this.controls.add(torque);
		}
	}
}
