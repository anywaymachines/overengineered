import Control from "client/gui/Control";
import { TextButtonControl, TextButtonDefinition } from "client/gui/controls/Button";
import ObservableValue from "shared/event/ObservableValue";
import { DropdownDefinition } from "./Dropdown";

export type DropdownListDefinition = DropdownDefinition &
	TextButtonDefinition & {
		readonly Content: {
			readonly Template: TextButtonDefinition;
		};
	};
export default class DropdownList<TValue extends string = string> extends Control<DropdownListDefinition> {
	readonly selectedItem = new ObservableValue<TValue | undefined>(undefined);

	private readonly itemTemplate;
	private readonly button;
	private readonly contents;

	constructor(gui: DropdownListDefinition, direction: "up" | "down" | "left" | "right") {
		super(gui);

		this.itemTemplate = Control.asTemplate(this.gui.Content.Template);

		this.button = this.add(new TextButtonControl(this.gui));
		this.contents = this.add(new Control(this.gui.Content));

		this.event.subscribe(this.button.activated, () => this.toggle());
		this.event.subscribeObservable2(this.selectedItem, (v) => this.button.text.set(v ?? ""), true);
	}

	private toggle() {
		this.contents.isVisible() ? this.contents.hide() : this.contents.show();
	}

	addItem(name: TValue) {
		const btn = new TextButtonControl(this.itemTemplate(), () => {
			this.selectedItem.set(name);
			this.toggle();
		});

		btn.text.set(name);
		btn.getGui().Parent = this.gui.Content;

		this.add(btn);
	}
}
