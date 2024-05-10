import { RunService } from "@rbxts/services";
import { GameLoader } from "client/GameLoader";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { Element } from "shared/Element";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { pairs_ } from "shared/fixes/objects";
import { TestFramework } from "shared/test/TestFramework";

GameLoader.waitForEverything();

const enabled = RunService.IsStudio(); // && Players.LocalPlayer.Name === "i3ymm";
if (!enabled) new Instance("BindableEvent").Event.Wait();

let destroy: (() => void) | undefined;
const create = () => {
	const parent = new InstanceComponent(
		Element.create("ScreenGui", { AutoLocalize: false, Name: "TestScreenGui", Parent: Gui.getPlayerGui() }),
	);

	const tabs = TabControl.create();
	parent.add(tabs);

	const wrapNonVisual = (name: string, tests: TestFramework.Tests): readonly [name: string, test: Control] => {
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

		const alltests = tests;
		tests = {
			runAll: () => TestFramework.run(name, alltests),
			...tests,
		};

		const add = (tests: TestFramework.Tests, offset = 0) => {
			for (const [name, test] of pairs_(tests)) {
				if (typeIs(test, "function")) {
					const button = TextButtonControl.create({
						Text: string.rep(" ", offset) + name,
						AutomaticSize: Enum.AutomaticSize.XY,
						TextSize: 16,
					});
					button.activated.Connect(() => TestFramework.run(name, test));
					control.add(button);
				} else {
					const button = TextButtonControl.create({
						Text: string.rep(" ", offset) + name,
						AutomaticSize: Enum.AutomaticSize.XY,
						TextSize: 16,
					});
					button.activated.Connect(() => TestFramework.run(name, test));
					control.add(button);

					add(test, offset + 1);
				}
			}
		};
		add(tests);

		return [name, control];
	};
	const testFrom = (name: string, tests: (() => Control) | TestFramework.Tests) => {
		if (typeIs(tests, "function")) {
			return [name, tests() as Control] as const;
		}

		return wrapNonVisual(name, tests);
	};

	const closebtn = tabs.addButton();
	closebtn.text.set("Close");
	closebtn.activated.Connect(() => destroy?.());

	const tests = new ReadonlyMap(
		TestFramework.findAllTestScripts().map((t) =>
			testFrom(t.Name.sub(0, t.Name.size() - ".test".size()), TestFramework.loadTestsFromScript(t)),
		),
	);

	/*const tests: readonly (readonly [name: string, test: Control])[] = [
		...WorldPipetteTest.createTests(),
		...TransformTest.createTests(),
		...ConfigTest.createTests(),
		...PopupTest.createTests(),
		...LoadSlotTest.createTests(),
	];*/

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
