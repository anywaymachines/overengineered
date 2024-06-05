import { SoundController } from "client/controller/SoundController";
import { Control } from "client/gui/Control";
import { TransformService } from "shared/component/TransformService";
import { Element } from "shared/Element";
import { Signal } from "shared/event/Signal";
import type { ElementProperties } from "shared/Element";

export type ButtonDefinition = GuiButton;
export class ButtonControl<T extends ButtonDefinition = ButtonDefinition> extends Control<T> {
	readonly activated = new Signal();
	private animateInteractability?: (interactable: boolean) => void;

	constructor(gui: T, activated?: () => void) {
		super(gui);

		const silent = this.getAttribute<boolean>("silent") === true;

		this.event.subscribe(this.gui.Activated, () => {
			if (!silent) SoundController.getSounds().Click.Play();
			this.activated.Fire();
		});

		if (activated) {
			this.activated.Connect(activated);
		}
	}

	setInteractable(interactable: boolean) {
		this.animateInteractability ??= TransformService.boolStateMachine(
			this.instance as GuiButton,
			TransformService.commonProps.quadOut02,
			{ Transparency: this.instance.Transparency },
			{ Transparency: 0.6 },
		);

		this.gui.Interactable = interactable;
		this.animateInteractability(interactable);
	}
}

export type TextButtonDefinition = (GuiButton & { readonly TextLabel: TextLabel }) | TextButton;
export class TextButtonControl<T extends TextButtonDefinition = TextButtonDefinition> extends ButtonControl<T> {
	readonly text;

	constructor(gui: T, activated?: () => void) {
		super(gui, activated);

		const isTextButton = (button: TextButtonDefinition): button is TextButton =>
			!button.FindFirstChild("TextLabel");

		this.text = this.event.observableFromInstanceParam(
			isTextButton(this.gui) ? (this.gui as TextButton) : this.gui.TextLabel!,
			"Text",
		);
	}

	static create(props: ElementProperties<TextButton>, activated?: () => void) {
		const gui = Element.create("TextButton", props);
		return new TextButtonControl(gui, activated);
	}
}
