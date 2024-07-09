import { Players, RunService, UserInputService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { InputController } from "client/controller/InputController";
import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { TabControl } from "client/gui/controls/TabControl";
import { Gui } from "client/gui/Gui";
import { ServerRestartController } from "client/ServerRestartController";
import { TestRunner } from "client/test/TestRunner";
import { LoadSlotTest } from "client/test/visual/LoadSlotTest";
import { TutorialCreator } from "client/tutorial/creator/TutorialCreator";
import { TestTutorial } from "client/tutorial/tutorials/TestTutorial";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Element } from "shared/Element";
import { HostedService } from "shared/GameHost";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

@injectable
export class AdminGui extends HostedService {
	static initializeIfAdminOrStudio(host: GameHostBuilder) {
		const enabled = RunService.IsStudio() || GameDefinitions.isAdmin(Players.LocalPlayer);
		if (!enabled) return;

		host.services.registerService(this);
	}

	constructor(@inject di: DIContainer) {
		super();

		let destroy: (() => void) | undefined;
		const create = () => {
			const parent = new InstanceComponent(
				Element.create("ScreenGui", { AutoLocalize: false, Name: "TestScreenGui", Parent: Gui.getPlayerGui() }),
			);

			const tabs = TabControl.create();
			parent.add(tabs);

			const wrapNonVisual = (
				name: string,
				tests: Readonly<Record<string, (di: DIContainer) => void>>,
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
					button.activated.Connect(() => test(di));

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
				wrapNonVisual("Tutorial creator", {
					startTest: (di) => TestTutorial.start(di),
					setBefore: (di) => TutorialCreator.setBefore(di.resolve<ReadonlyPlot>()),
					printDiff: (di) => print(TutorialCreator.serializeDiffToTsCode(di.resolve<ReadonlyPlot>())),
					print: (di) => print(TutorialCreator.serializePlotToTsCode(di.resolve<ReadonlyPlot>())),
				}),
				wrapNonVisual("Restart", { restart: ServerRestartController.sendToServer }),
				wrapNonVisual("TESTS", { open: TestRunner.create }),
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

		this.event.subscribe(UserInputService.InputBegan, (input) => {
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
			if (input.KeyCode !== Enum.KeyCode.F7) return;
			if (!InputController.isShiftPressed()) return;

			if (destroy) destroy();
			else create();
		});
	}
}
