import { StarterGui } from "@rbxts/services";
import Objects from "shared/fixes/objects";
import Control from "./base/Control";
import { CheckBoxControlDefinition } from "./gui/controls/CheckBoxControl";

const createElement = <T extends keyof CreatableInstances, const TChildren extends Readonly<Record<string, Instance>>>(
	instanceType: T,
	properties?: Partial<ExcludeMembers<CreatableInstances[T], "Name">>,
	children?: TChildren,
): CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] } => {
	const instance = new Instance(instanceType);

	if (properties !== undefined) {
		Objects.assign(instance, properties);
	}

	if (children) {
		for (const [name, child] of Objects.pairs(children)) {
			child.Name = name as string;
			child.Parent = instance;
		}
	}

	return instance as CreatableInstances[T] & { [k in keyof TChildren]: TChildren[k] };
};

const newFont = (font: Enum.Font, weight: Enum.FontWeight) => {
	const f = Font.fromEnum(font);
	f.Weight = weight;

	return f;
};

const gameui = StarterGui.WaitForChild("GameUI") as ScreenGui;
gameui.FindFirstChild("AutoCreated")?.Destroy();

const parent = createElement("Frame", {
	Name: "AutoCreated",
	Parent: gameui,
	Size: new UDim2(1, 0, 1, 0),
	Transparency: 1,
});

{
	const autoHideScript = new Instance("LocalScript") as LocalScript & { Source: string };
	autoHideScript.Name = "AutoHide";
	autoHideScript.Source = "script.Parent.Visible = false";
	autoHideScript.Parent = parent;
}

const templates = (
	StarterGui.WaitForChild("GameUI") as ScreenGui & {
		readonly Templates: {
			readonly Controls: {
				readonly Checkbox: CheckBoxControlDefinition;
			};
		};
	}
).Templates.Controls;

const checkBox = Control.asTemplate(templates.Checkbox, false);

checkBox().Parent = parent;
