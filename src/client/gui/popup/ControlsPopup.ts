import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { Keybinds } from "client/Keybinds";

export type ControlsPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: GuiObject & {
		readonly Template: GuiObject & {
			readonly HeadingLabel: TextLabel;
			readonly Control: KeyChooserControlDefinition;
		};
	};
};

@injectable
export class ControlsPopup extends Popup<ControlsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Gui.getGameUI<{ Popup: { Controls: ControlsPopupDefinition } }>().Popup.Controls;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	private readonly template;

	constructor(gui: ControlsPopupDefinition, @inject keybinds: Keybinds) {
		super(gui);

		this.template = this.asTemplate(gui.Content.Template, true);
		this.add(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

		const children = new DictionaryControl<GuiObject, string, Control>(gui.Content);
		this.event.subscribeMap(
			keybinds.registrations,
			(key, value) => {
				if (!value) {
					children.keyedChildren.remove(key);
					return;
				}

				const gui = this.template();
				gui.HeadingLabel.Text = value.displayName;

				const control = new Control(gui);
				const keyChooser = control.add(new KeyChooserControl(gui.Control));
				keyChooser.value.set([...value.getKeys()][0]);
				keyChooser.value.changed.Connect((key) => value.setKeys([key]));

				children.keyedChildren.add(key, control);
			},
			true,
		);
	}
}
