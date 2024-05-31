import { Players, RunService, UserInputService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { InputController } from "client/controller/InputController";
import { GameLoader } from "client/GameLoader";
import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { Gui } from "client/gui/Gui";
import { ServerRestartController } from "client/ServerRestartController";
import { LoadSlotTest } from "client/test/visual/LoadSlotTest";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Element } from "shared/Element";

GameLoader.waitForEverything();

const enabled = RunService.IsStudio() || GameDefinitions.isAdmin(Players.LocalPlayer);
if (!enabled) new Instance("BindableEvent").Event.Wait();
task.wait(0.5); // wait for the controls to enable

let destroy: (() => void) | undefined;
const create = () => {
	const parent = new InstanceComponent(
		Element.create("ScreenGui", { AutoLocalize: false, Name: "TestScreenGui", Parent: Gui.getPlayerGui() }),
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

		for (const [name, test] of pairs(tests)) {
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
		["Load", LoadSlotTest.create(false)],
		["Load REMOTE", LoadSlotTest.create(true)],
		["Global message", AdminMessageController.createControl()],
		wrapNonVisual("Restart", { restart: ServerRestartController.sendToServer }),
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
