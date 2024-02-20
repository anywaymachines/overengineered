import { Players, RunService, UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { AdminMessageController } from "client/AdminMessageController";
import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { WireToolTests } from "client/tools/WireTool2";
import { Element } from "shared/Element";
import SharedComponent from "shared/component/SharedComponent";
import GameDefinitions from "shared/data/GameDefinitions";
import Objects from "shared/fixes/objects";
import { ComponentTests } from "./ComponentTests";
import { LogicTest1 } from "./LogicTest1";
import { ColorWheelTest } from "./control/ColorWheelTest";
import { ConfigTest } from "./control/ConfigTest";
import { LoadSlotTest } from "./control/LoadSlotTest";
import { PopupTest } from "./control/PopupTest";
import { TransformTest } from "./control/TransformTest";
import { WorldPipetteTest } from "./control/WorldPipetteTest";

const autostart = RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm";
const launch = RunService.IsStudio() || GameDefinitions.isAdmin(Players.LocalPlayer);
if (!launch) new Signal().Wait();
task.wait(0.5); // wait for the controls to enable

let destroy: (() => void) | undefined;
const create = () => {
	print("f");
	const parent = new SharedComponent(
		Element.create("ScreenGui", { Name: "TestScreenGui", Parent: Gui.getPlayerGui() }),
	);
	// close button
	{
		const closebtn = parent.add(
			TextButtonControl.create({
				Text: "Close the test GUI",
				Size: new UDim2(0, 100, 0, 30),
				Position: new UDim2(0, 0, 0, 200),
			}),
		);
		closebtn.show();
		closebtn.activated.Connect(() => parent.destroy());
	}

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

	const tests: readonly (readonly [name: string, test: Control])[] = [
		...ColorWheelTest.createTests(),
		...WorldPipetteTest.createTests(),
		...TransformTest.createTests(),
		...ConfigTest.createTests(),
		...PopupTest.createTests(),
		...LoadSlotTest.createTests(),
		wrapNonVisual("Wire Tool", WireToolTests),
		wrapNonVisual("Logic", LogicTest1),
		wrapNonVisual("Component", ComponentTests),
		["Global message", AdminMessageController.createControl()],
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

UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
	if (input.KeyCode !== Enum.KeyCode.F7) return;
	if (!InputController.isShiftPressed()) return;

	if (destroy) destroy();
	else create();
});
if (autostart) {
	spawn(() => create());
}
