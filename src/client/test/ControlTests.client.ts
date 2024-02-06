import { RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Control from "client/gui/Control";
import { Element } from "client/gui/Element";
import Gui from "client/gui/Gui";
import { ButtonControl, TextButtonControl } from "client/gui/controls/Button";
import SharedComponent from "shared/component/SharedComponent";
import { ColorWheelTest } from "./control/ColorWheelTest";
import { ConfigTest } from "./control/ConfigTest";
import { TransformTest } from "./control/TransformTest";
import { WorldPipetteTest } from "./control/WorldPipetteTest";

const launch = true && RunService.IsStudio();
if (!launch) new Signal<() => void>().Wait();

task.wait(0.5); // wait for the controls to enable

const createElement = Element.create;
const parent = new SharedComponent(createElement("ScreenGui", { Name: "TestScreenGui", Parent: Gui.getPlayerGui() }));

// close button
{
	const closebtn = parent.add(
		TextButtonControl.create({
			Text: "Close the test GUI",
			Size: new UDim2(0, 100, 0, 30),
			Position: new UDim2(0, 0, 0, 100),
		}),
	);
	closebtn.show();
	closebtn.activated.Connect(() => parent.destroy());
}

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

const testenv = TestEnvironment.create();
parent.add(testenv);

const tests: readonly (readonly [name: string, test: Control])[] = [
	...ColorWheelTest.createTests(),
	...WorldPipetteTest.createTests(),
	...TransformTest.createTests(),
	...ConfigTest.createTests(),
];
for (const [name, content] of tests) {
	content.hide();
	testenv.addTab(name, content);
}

parent.enable();
