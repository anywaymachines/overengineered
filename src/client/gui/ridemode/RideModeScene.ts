import { HttpService, UserInputService } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import ConfigurableBlockLogic, { KeyDefinition } from "client/base/ConfigurableBlockLogic";
import Control from "client/base/Control";
import Machine from "client/blocks/logic/Machine";
import { requestMode } from "client/controller/modes/PlayModeRequest";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import EventHandler from "shared/event/EventHandler";
import { ButtonControl, TextButtonControl, TextButtonDefinition } from "../controls/Button";
import { DictionaryControl } from "../controls/DictionaryControl";
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

			instance.InputBegan.Connect((input) => {
				if (
					input.UserInputType !== Enum.UserInputType.MouseButton1 &&
					input.UserInputType !== Enum.UserInputType.Touch
				)
					return;

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
					child.getGui().Position = child.getGui().Position.add(new UDim2(0, delta.X, 0, delta.Y));
				});
				eh.subscribe(UserInputService.InputEnded, (input) => {
					if (
						input.UserInputType !== Enum.UserInputType.MouseButton1 &&
						input.UserInputType !== Enum.UserInputType.Touch
					)
						return;

					eh.unsubscribeAll();
					ehandlers.remove(ehandlers.indexOf(eh));
				});
			});

			const box = new Control(instance);
			overlay.add(box);
		}

		this.quitSettingsMode = async () => {
			this.remove(overlay);

			for (const eh of ehandlers) {
				eh.unsubscribeAll();
			}

			const touchControls: Record<string, TouchControlInfo[string]> = {};
			for (const [keycode, child] of this.getKeyedChildren()) {
				touchControls[keycode] = {
					pos: [child.getGui().Position.X.Offset, child.getGui().Position.Y.Offset],
				};
			}

			const response = await Remotes.Client.GetNamespace("Slots")
				.Get("Save")
				.CallServerAsync({
					index: PlayerDataStorage.loadedSlot.get() ?? -1,
					touchControls,
					save: false,
				});

			if (!response.success) {
				Logger.error(response.message);
				return;
			}

			await PlayerDataStorage.refetchData();
		};
	}

	start(machine: Machine) {
		this.clear();
		machine.destroyed.Connect(() => this.clear());

		let pos = 0;
		const map: Record<string, KeyDefinition[]> = {};

		for (const block of machine.getChildren()) {
			if (!(block instanceof ConfigurableBlockLogic)) {
				continue;
			}

			const config = block.config;
			for (const [id, key] of Objects.entries(block.getKeysDefinition())) {
				const keycode = config.get(id) as KeyCode;
				map[keycode] ??= [];
				map[keycode].push(key);
			}
		}

		const controlsInfo = PlayerDataStorage.data
			.get()
			?.slots.find((slot) => slot.index === PlayerDataStorage.loadedSlot.get() ?? -1)?.touchControls;
		print(controlsInfo);
		print(HttpService.JSONEncode(PlayerDataStorage.data.get()?.slots));

		for (const [keycode, keys] of Objects.entries(map)) {
			const btn = new TextButtonControl(this.buttonTemplate());
			btn.text.set(keycode);
			this.addKeyed(keycode, btn);

			this.event.subscribe(btn.getGui().InputBegan, (input) => {
				if (input.UserInputType === Enum.UserInputType.MouseButton1) {
					for (const key of keys) {
						key.keyDown?.();
					}
				}
			});
			this.event.subscribe(btn.getGui().InputEnded, (input) => {
				if (input.UserInputType === Enum.UserInputType.MouseButton1) {
					for (const key of keys) {
						key.keyUp?.();
					}
				}
			});

			print(controlsInfo);
			if (controlsInfo) {
				const kc = controlsInfo[keycode];
				if (kc)
					btn.getGui().Position = new UDim2(
						0,
						math.clamp(kc.pos[0], btn.getGui().AbsoluteSize.X, this.gui.AbsoluteSize.X),
						0,
						math.clamp(kc.pos[1], btn.getGui().AbsoluteSize.Y, this.gui.AbsoluteSize.Y),
					);
			} else {
				const size = btn.getGui().Size;
				btn.getGui().Position = new UDim2(0.95, 0, 1 - size.Y.Scale * pos, -10 * (pos + 1));

				pos++;
			}
		}
	}
}

export type RideModeSceneDefinition = GuiObject & {
	ActionBarGui: ActionBarControlDefinition;
	Torque: RocketEngineGuiDefinition;
	Controls: RideModeControlsDefinition;
};

export default class RideModeScene extends Control<RideModeSceneDefinition> {
	private readonly actionbar;
	private readonly controls;

	private readonly torqueTemplate;

	constructor(gui: RideModeSceneDefinition) {
		super(gui);

		this.controls = new RideModeControls(this.gui.Controls);
		this.add(this.controls);

		this.actionbar = new ActionBarControl(gui.ActionBarGui, this.controls);
		this.add(this.actionbar);
		this.actionbar.show();

		this.torqueTemplate = Control.asTemplate(this.gui.Torque);
	}

	public start(machine: Machine) {
		this.controls.start(machine);

		const torque = new RocketEngineGui(this.torqueTemplate(), machine);
		torque.show();
		this.controls.add(torque);
	}
}
