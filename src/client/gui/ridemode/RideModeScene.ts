import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Control from "client/base/Control";
import Machine from "client/blocks/logic/Machine";
import { requestMode } from "client/controller/modes/PlayModeRequest";
import Remotes from "shared/Remotes";
import Objects from "shared/_fixes_/objects";
import { ButtonControl, TextButtonControl, TextButtonDefinition } from "../controls/Button";
import RocketEngineGui, { RocketEngineGuiDefinition } from "./RocketEngineGui";

export type ActionBarControlDefinition = GuiObject & {
	Stop: GuiButton;
	Sit: GuiButton;
};
export class ActionBarControl extends Control<ActionBarControlDefinition> {
	constructor(gui: ActionBarControlDefinition) {
		super(gui);

		const stopButton = this.added(new ButtonControl(this.gui.Stop));
		const sitButton = this.added(new ButtonControl(this.gui.Sit));
		this.event.subscribe(stopButton.activated, async () => {
			await requestMode("build");
		});

		this.event.subscribe(sitButton.activated, async () => {
			Remotes.Client.GetNamespace("Ride").Get("Sit").SendToServer();
		});
	}
}

type RideModeControlsDefinition = GuiObject & {
	Button: TextButtonDefinition;
};
export class RideModeControls extends Control<RideModeControlsDefinition> {
	private readonly buttonTemplate;

	constructor(gui: RideModeControlsDefinition) {
		super(gui);
		this.buttonTemplate = Control.asTemplate(this.gui.Button);
	}

	start(machine: Machine) {
		this.clear();
		machine.destroyed.Connect(() => this.clear());

		let pos = 0;
		for (const block of machine.getChildren()) {
			if (!(block instanceof ConfigurableBlockLogic)) {
				continue;
			}

			const config = block.config;
			for (const [id, key] of Objects.entries(block.getKeysDefinition())) {
				const keycode = config.get(id) as KeyCode;

				const btn = new TextButtonControl(this.buttonTemplate());
				btn.text.set(keycode);
				this.add(btn);

				this.event.subscribe(btn.getGui().InputBegan, (input) => {
					if (input.UserInputType === Enum.UserInputType.MouseButton1) {
						key.keyDown?.();
					}
				});
				this.event.subscribe(btn.getGui().InputEnded, (input) => {
					if (input.UserInputType === Enum.UserInputType.MouseButton1) {
						key.keyUp?.();
					}
				});

				const size = btn.getGui().Size;
				btn.getGui().Position = new UDim2(0, 0, size.Y.Scale * pos, 0);

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

		this.actionbar = new ActionBarControl(gui.ActionBarGui);
		this.add(this.actionbar);
		this.actionbar.show();

		this.controls = new RideModeControls(this.gui.Controls);
		this.add(this.controls);

		this.torqueTemplate = Control.asTemplate(this.gui.Torque);
	}

	public start(machine: Machine) {
		this.controls.start(machine);

		const torque = new RocketEngineGui(this.torqueTemplate(), machine);
		torque.show();
		this.controls.add(torque);
	}
}
