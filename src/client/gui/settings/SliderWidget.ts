import EventHandler from "client/event/EventHandler";

type SliderWidgetType = Frame & {
	Frame: Frame & {
		TextButton: TextButton;
	};
	TextBox: TextBox;
	TextLabel: TextLabel;
};

export default class SliderWidget {
	private readonly eventHandler = new EventHandler();
	private readonly widget: SliderWidgetType;
	private value = 0;

	constructor(widget: SliderWidgetType) {
		this.widget = widget;

		this.updateVisuals();

		let startpos: number | undefined;
		this.eventHandler.subscribe(widget.Frame.TextButton.MouseButton1Down, (x, y) => {
			startpos = x;
		});
		this.eventHandler.subscribe(widget.Frame.TextButton.MouseMoved, (x, y) => {
			if (startpos === undefined) return;

			this.value = x - startpos;
			this.updateVisuals();
		});
		this.eventHandler.subscribe(widget.Frame.TextButton.MouseButton1Up, () => {
			startpos = undefined;
		});
	}

	public getValue() {
		return this.value;
	}

	private updateVisuals() {
		this.widget.Frame.TextButton.Position = new UDim2(this.value, 0, 0, 0);
		this.widget.TextBox.Text = this.value + "";
	}
}
