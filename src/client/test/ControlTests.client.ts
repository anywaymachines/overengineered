import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { AdminMessageController } from "client/AdminMessageController";
import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Control from "client/gui/Control";
import { Element } from "client/gui/Element";
import Gui from "client/gui/Gui";
import { ButtonControl, TextButtonControl } from "client/gui/controls/Button";
import { WireToolTests } from "client/tools/WireTool2";
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

const autostart = RunService.IsStudio();
const launch = true && GameDefinitions.isAdmin(Players.LocalPlayer);
if (!launch) new Signal<() => void>().Wait();

task.wait(0.5); // wait for the controls to enable

const createElement = Element.create;

type TestEnvironmentDefinition = Frame & {
	readonly Tabs: ScrollingFrame;
	readonly Content: Frame;
};
class TestEnvironment extends Control<TestEnvironmentDefinition> {
	private readonly tabs = new Map<string, Control>();

	constructor(gui: TestEnvironmentDefinition) {
		super(gui);
	}

	static create() {
		const gui = createElement(
			"Frame",
			{
				Size: new UDim2(1, 0, 1, 0),
				Transparency: 1,
			},
			{
				Tabs: createElement(
					"ScrollingFrame",
					{
						Size: new UDim2(0, 200, 1, 0),
						Transparency: 1,
					},
					{
						list: createElement("UIListLayout"),
					},
				),
				Content: createElement("Frame", {
					Position: new UDim2(0, 200, 0, 0),
					Size: new UDim2(1, -200, 1, 0),
					Transparency: 1,
				}),
			},
		);

		return new TestEnvironment(gui);
	}

	addTab(name: string, content: Control) {
		this.tabs.set(name, content);

		content.getGui().Parent = this.gui.Content;
		this.add(content);
		content.hide();

		const button = this.add(
			new ButtonControl(
				createElement("TextButton", { Size: new UDim2(1, 0, 0, 20), Text: name, Parent: this.gui.Tabs }),
			),
		);
		button.activated.Connect(() => {
			for (const [_, tab] of this.tabs) {
				tab.hide();
			}

			content.show();
		});
	}
}

//

let destroy: (() => void) | undefined;
const ih = new InputHandler();
ih.onKeyDown("F7", () => {
	if (!InputController.isShiftPressed()) return;

	if (destroy) destroy();
	else create();
});
if (autostart) {
	spawn(() => create());
}

const create = () => {
	const parent = new SharedComponent(
		createElement("ScreenGui", { Name: "TestScreenGui", Parent: Gui.getPlayerGui() }),
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

	const testenv = TestEnvironment.create();
	parent.add(testenv);

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
		wrapNonVisual("Global message", {
			restart: () => AdminMessageController.send("Server restart\nSave your builds"),
			test: () => AdminMessageController.send("MESSAGE TEST THIS IS A WARNING\nNOT"),
		}),
	];
	for (const [name, content] of tests) {
		content.hide();
		testenv.addTab(name, content);
	}

	parent.enable();
	destroy = () => {
		destroy = undefined;
		parent.destroy();
	};
};
