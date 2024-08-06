import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { TransformService } from "shared/component/TransformService";
import { ObservableValue } from "shared/event/ObservableValue";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { DropdownDefinition } from "client/gui/controls/Dropdown";

export type DropdownListDefinition = DropdownDefinition & {
	readonly Button: TextButtonDefinition;
	readonly Content: {
		readonly Template: TextButtonDefinition;
	};
};
export class DropdownList<TValue extends string = string> extends Control<DropdownListDefinition> {
	readonly selectedItem = new ObservableValue<TValue | undefined>(undefined);

	private readonly itemTemplate;
	private readonly button;
	private readonly contents;
	private readonly names = new Map<TValue, string>();

	constructor(gui: DropdownListDefinition) {
		super(gui);

		this.itemTemplate = this.asTemplate(this.gui.Content.Template);

		this.button = this.add(new TextButtonControl(this.gui.Button));
		this.contents = this.add(new Control<GuiObject, TextButtonControl>(this.gui.Content));

		this.event.subscribe(this.button.activated, () => this.toggle());
		this.event.subscribeObservable(
			this.selectedItem,
			(v) => this.button.text.set(v === undefined ? "" : this.names.get(v) ?? v),
			true,
		);
	}

	private contentsVisible = false;
	private toggle() {
		this.contentsVisible = !this.contentsVisible;

		let height = this.button.instance.Size.Y.Offset;
		for (const button of this.contents.getChildren()) {
			TransformService.run(button.instance, (tr) =>
				tr
					.func(() => {
						if (!this.contentsVisible) {
							button.instance.Interactable = false;
						}
					})
					.moveY(new UDim(0, this.contentsVisible ? height : 0), TransformService.commonProps.quadOut02)
					.then()
					.func(() => {
						if (this.contentsVisible) {
							button.instance.Interactable = true;
						}
					}),
			);

			height += button.instance.Size.Y.Offset;
		}
	}

	addItem(name: TValue, text?: string) {
		const btn = new TextButtonControl(this.itemTemplate(), () => {
			this.selectedItem.set(name);
			this.toggle();
		});

		if (text !== undefined) {
			this.names.set(name, text);
		}

		btn.text.set(text ?? name);
		this.contents.add(btn);
	}
}
