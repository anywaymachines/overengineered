import { RunService } from "@rbxts/services";
import { Control } from "client/gui/Control";
import { LabelControl } from "client/gui/controls/LabelControl";
import { Gui } from "client/gui/Gui";
import { ComponentChildren } from "shared/component/ComponentChildren";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import { Element } from "shared/Element";
import { Strings } from "shared/fixes/String.propmacro";

class CategoryControl extends Control {
	readonly unnamed = new ComponentChildren<LabelControl>(this);
	readonly named = new ComponentKeyedChildren<defined, LabelControl>(this);
	readonly categories = new ComponentKeyedChildren<defined, CategoryControl>(this);
	tempDisabled = false;

	constructor(gui: GuiObject) {
		super(gui);

		this.unnamed.onAdded.Connect((c) => (c.instance.Parent = gui));
		this.named.onAdded.Connect((k, c) => (c.instance.Parent = gui));
		this.categories.onAdded.Connect((k, c) => (c.instance.Parent = gui));
	}
}

const mainControl = new CategoryControl(Gui.getGameUI<{ DebugLog: GuiObject }>().DebugLog);
if (RunService.IsStudio()) {
	mainControl.show();
} else {
	mainControl.hide();
}
const disabled = !mainControl.isEnabled();
const disabledCategoryObject = {};

const categoryStack: defined[] = [];

export namespace DebugLog {
	function newText(text?: unknown) {
		return new LabelControl(
			Element.create("TextLabel", {
				AutoLocalize: false,
				Font: Enum.Font.Ubuntu,
				TextSize: 32,
				AutomaticSize: Enum.AutomaticSize.XY,
				BackgroundTransparency: 0.5,
				Text: tostring(text ?? ""),
			}),
		);
	}
	function newCategoryControl(name: defined) {
		const gui = Element.create(
			"Frame",
			{
				BackgroundTransparency: 1,
				AutomaticSize: Enum.AutomaticSize.XY,
			},
			{
				list: Element.create("UIListLayout", {
					Padding: new UDim(0, 4),
					FillDirection: Enum.FillDirection.Vertical,
					SortOrder: Enum.SortOrder.LayoutOrder,
					HorizontalAlignment: Enum.HorizontalAlignment.Right,
				}),
				padding: Element.create("UIPadding", { PaddingLeft: new UDim(0, 8) }),
				title: newText(`[[[${name}]]]`).instance,
			},
		);

		return new CategoryControl(gui);
	}

	export function category(name: defined, props: object & Record<string, unknown>, disabled = false) {
		if (disabled) return;

		startCategory(name, disabled);
		multiNamed(props);
		endCategory();
	}

	export function startCategory(name: defined, disable = false) {
		if (disabled) return;

		if (disable) {
			categoryStack.push(disabledCategoryObject);
		} else {
			categoryStack.push(name);
		}
	}
	export function endCategory() {
		if (disabled) return;
		categoryStack.pop();
	}

	function getCurrentParent(): CategoryControl | undefined {
		if (categoryStack.size() === 0) {
			return mainControl;
		}

		let c = mainControl;
		for (const cat of categoryStack) {
			if (cat === disabledCategoryObject) {
				return undefined;
			}

			let nextcat = c.categories.get(cat);
			if (!nextcat) {
				nextcat = newCategoryControl(cat);
				c.categories.add(cat, nextcat);
			}

			c = nextcat;
		}

		return c;
	}

	export function multiNamed(props: object & Record<string, unknown>) {
		if (disabled) return;

		for (const [name, value] of pairs(props)) {
			named(name, value);
		}
	}
	export function named(name: defined, text: defined) {
		if (disabled) return;

		const category = getCurrentParent();
		if (!category) return;

		let control = category.named.get(name);
		if (!control) {
			control = newText();
			category.named.add(name, control);
		}

		control.instance.Text = `${Strings.pretty(text)} [${name}]`;
	}
	export function log(text: string) {
		if (disabled) return;

		const category = getCurrentParent();
		if (!category) return;

		const control = newText();
		control.value.set(text);
		category.unnamed.add(control);

		task.delay(1, () => control.destroy());
	}
}
