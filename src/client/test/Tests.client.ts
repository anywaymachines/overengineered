import { Players, RunService } from "@rbxts/services";
import { GameLoader } from "client/GameLoader";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { ComponentDisablerTests } from "client/test/tests/ComponentDisablerTests";
import { LoadingTests } from "client/test/tests/LoadingTests";
import { TutorialTests } from "client/test/tests/TutorialTests";
import { WireToolTests } from "client/test/tests/WireManagerTests";
import { Element } from "shared/Element";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { Objects } from "shared/fixes/objects";
import { AABBTests } from "./tests/AABBTests";
import { ComponentTests } from "./tests/ComponentTests";
import { LogicTests } from "./tests/LogicTests";
import { ColorWheelTest } from "./visual/ColorWheelTest";
import { ConfigTest } from "./visual/ConfigTest";
import { LoadSlotTest } from "./visual/LoadSlotTest";
import { PopupTest } from "./visual/PopupTest";
import { TransformTest } from "./visual/TransformTest";
import { WorldPipetteTest } from "./visual/WorldPipetteTest";

GameLoader.waitForEverything();

const enabled = RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm";
if (!enabled) new Instance("BindableEvent").Event.Wait();

let destroy: (() => void) | undefined;
const create = () => {
	const parent = new InstanceComponent(
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

		const alltests = tests;
		tests = {
			runAll: () => {
				for (const [name, test] of Objects.pairs_(alltests)) {
					print(`[${name}] Running`);
					test();
					print(`[${name}] SUCCESS`);
				}
			},
			...tests,
		};

		for (const [name, test] of Objects.pairs_(tests)) {
			const button = TextButtonControl.create({
				Text: name,
				AutomaticSize: Enum.AutomaticSize.XY,
				TextSize: 16,
			});
			button.activated.Connect(() => {
				print(`[${name}] Running`);
				test();
				print(`[${name}] SUCCESS`);
			});

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
		wrapNonVisual("AABB", AABBTests),
		wrapNonVisual("Loading", LoadingTests),
		wrapNonVisual("ComponentDisabler", ComponentDisablerTests),
		wrapNonVisual("Tutorial", TutorialTests),
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
