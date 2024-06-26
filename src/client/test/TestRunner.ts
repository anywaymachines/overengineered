import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { Gui } from "client/gui/Gui";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { Element } from "shared/Element";
import { TestFramework } from "shared/test/TestFramework";

export namespace TestRunner {
	let destroy: (() => void) | undefined;
	export function create(di: ReadonlyDIContainer) {
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
				runAll: () => TestFramework.run(name, alltests, di),
				...tests,
			};

			const add = (tests: TestFramework.Tests, offset = 0) => {
				for (const [name, test] of pairs(tests)) {
					if (typeIs(test, "function")) {
						const button = TextButtonControl.create({
							Text: string.rep(" ", offset) + name,
							AutomaticSize: Enum.AutomaticSize.XY,
							TextSize: 16,
						});
						button.activated.Connect(() => TestFramework.run(name, test, di));
						control.add(button);
					} else {
						const button = TextButtonControl.create({
							Text: string.rep(" ", offset) + name,
							AutomaticSize: Enum.AutomaticSize.XY,
							TextSize: 16,
						});
						button.activated.Connect(() => TestFramework.run(name, test, di));
						control.add(button);

						add(test, offset + 1);
					}
				}
			};
			add(tests);

			return [name, control];
		};
		const testFrom = (name: string, tests: ((di?: ReadonlyDIContainer) => Control) | TestFramework.Tests) => {
			if (typeIs(tests, "function")) {
				const test = tests(di);
				if (test instanceof Control) {
					return [name, test] as const;
				}

				return wrapNonVisual(name, test);
			}

			return wrapNonVisual(name, tests);
		};

		const closebtn = tabs.addButton();
		closebtn.text.set("Close");
		closebtn.activated.Connect(() => destroy?.());

		const tests = TestFramework.findAllTestScripts()
			.map((t) => testFrom(t.Name.sub(0, t.Name.size() - ".test".size()), TestFramework.loadTestsFromScript(t)))
			.sort((l, r) => l[0] < r[0]);

		for (const [name, content] of tests) {
			content.hide();
			tabs.addTab(name, content);
		}

		parent.enable();
		destroy = () => {
			destroy = undefined;
			parent.destroy();
		};
	}
}
