import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { WireToolTests } from "client/tools/WireTool2";
import { Element } from "shared/Element";
import SharedComponent from "shared/component/SharedComponent";
import Objects from "shared/fixes/objects";
import { LogicTests } from "./LogicTest1";
import { ColorWheelTest } from "./control/ColorWheelTest";
import { ComponentTests } from "./control/ComponentTests";
import { ConfigTest } from "./control/ConfigTest";
import { LoadSlotTest } from "./control/LoadSlotTest";
import { PopupTest } from "./control/PopupTest";
import { TransformTest } from "./control/TransformTest";
import { WorldPipetteTest } from "./control/WorldPipetteTest";

const enabled = RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm";
if (!enabled) new Signal().Wait();
task.wait(0.5); // wait for the controls to enable

let destroy: (() => void) | undefined;
const create = () => {
	const parent = new SharedComponent(
		Element.create("ScreenGui", { Name: "TestScreenGui", Parent: Gui.getPlayerGui() }),
	);

	const tabs = TabControl.create();
	parent.add(tabs);

	const wrapNonVisual = (
		name: string,
		tests: Readonly<Record<string, () => void>>,
	): readonly [name: string, test: Control] => {
		const frame = Element.create(
			"Frame",
			{
				Size: new UDim2(1, 0, 1, 0),
				BackgroundTransparency: 1,
			},
			{
				list: Element.create("UIListLayout", {
					FillDirection: Enum.FillDirection.Vertical,
				}),
			},
		);
		const control = new Control(frame);

		for (const [name, test] of Objects.entries(tests)) {
			const button = TextButtonControl.create({
				Text: name,
				AutomaticSize: Enum.AutomaticSize.XY,
				TextSize: 16,
			});
			button.activated.Connect(test);

			control.add(button);
		}

		return [name, control];
	};

	const closebtn = tabs.addButton();
	closebtn.text.set("Close");
	closebtn.activated.Connect(() => destroy?.());

	const tests: readonly (readonly [name: string, test: Control])[] = [
		...ColorWheelTest.createTests(),
		...WorldPipetteTest.createTests(),
		...TransformTest.createTests(),
		...ConfigTest.createTests(),
		...PopupTest.createTests(),
		...LoadSlotTest.createTests(),
		wrapNonVisual("Wire Tool", WireToolTests),
		wrapNonVisual("Logic", LogicTests),
		wrapNonVisual("Component", ComponentTests),
	];
	for (const [name, content] of tests) {
		content.hide();
		tabs.addTab(name, content);
	}

	parent.enable();
	destroy = () => {
		destroy = undefined;
		parent.destroy();
	};
};

spawn(create);
