import EventHandler from "client/event/EventHandler";

type CheckBoxWidgetType = Frame & {
	TextButton: TextButton;
	TextLabel: TextLabel;
};

export default class CheckBoxWidget implements ICheckBoxWidget {
	private readonly eventHandler = new EventHandler();
	private readonly widget: CheckBoxWidgetType;
	private checked = false;

	constructor(widget: CheckBoxWidgetType) {
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
