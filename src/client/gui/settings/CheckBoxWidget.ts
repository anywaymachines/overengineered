import EventHandler from "client/event/EventHandler";

type CheckBoxWidgetType = Frame & {
	TextButton: TextButton;
	TextLabel: TextLabel;
};

class CheckBoxWidget {
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
		this.widget.TextButton.Text = this.checked ? "+" : "-";
	}
}

const parent = script.Parent as CheckBoxWidgetType;
print(parent);
new CheckBoxWidget(parent);
