import EventHandler from "shared/EventHandler";

type CheckBoxControlDefinition = {
	TextButton: TextButton;
	TextLabel: TextLabel;
};

export default class CheckBoxControl {
	private readonly eventHandler = new EventHandler();
	private readonly widget: CheckBoxControlDefinition;
	private checked = false;

	constructor(widget: CheckBoxControlDefinition) {
		this.widget = widget;

		this.updateVisuals();
		this.eventHandler.subscribe(widget.TextButton.MouseButton1Click, () => {
			this.checked = !this.checked;
			this.updateVisuals();
		});
	}

	public getValue() {
		return this.checked;
	}

	private updateVisuals() {
		this.widget.TextButton.Text = this.checked ? "æ" : "";
	}
}
