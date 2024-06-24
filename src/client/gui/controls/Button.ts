import { SoundController } from "client/controller/SoundController";
import { Control } from "client/gui/Control";
import { ObjectOverlayStorage } from "shared/component/ObjectOverlayStorage";
import { TransformService } from "shared/component/TransformService";
import { Element } from "shared/Element";
import { Signal } from "shared/event/Signal";
import type { ElementProperties } from "shared/Element";

export type ButtonDefinition = GuiButton;
export class ButtonControl<T extends ButtonDefinition = ButtonDefinition> extends Control<T> {
	readonly activated = new Signal();
	private readonly visibilityOverlay = new ObjectOverlayStorage({ transparency: 0 });

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

		this.visibilityOverlay.value.subscribe(({ transparency }) => {
			TransformService.run(gui as GuiObject, (tr) => {
				if (gui.Transparency === 1 && transparency !== 1) {
					tr.func(() => (this.gui.Visible = true)).then();
				}

				tr.transform("Transparency", transparency, TransformService.commonProps.quadOut02);

				if (transparency === 1) {
					tr.then().func(() => (this.gui.Visible = false));
				}
			});
		});
	}

	setInteractable(interactable: boolean) {
		this.gui.Interactable = interactable;
		this.visibilityOverlay.get(0).transparency = interactable ? undefined : 0.6;
	}
	protected setInstanceVisibilityFunction(visible: boolean): void {
		this.visibilityOverlay.get(-1).transparency = visible ? undefined : 1;
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
