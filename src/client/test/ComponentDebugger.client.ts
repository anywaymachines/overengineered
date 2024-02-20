import { Players, RunService, UserInputService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import InputController from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import { ButtonControl } from "client/gui/controls/Button";
import { Element } from "shared/Element";
import GameDefinitions from "shared/data/GameDefinitions";
import { rootComponents } from "./RootComponents";

type TreeControlDefinition = GuiObject & {
	readonly Main: GuiButton;
	readonly Children: Frame;
};
class TreeControl extends Control<TreeControlDefinition, Control> {
	static createChildList(main: GuiButton): TreeControl {
		const createElement = Element.create;
		const gui = createElement(
			"Frame",
			{
				Size: new UDim2(1, 0, 0, 0),
				AutomaticSize: Enum.AutomaticSize.Y,
				BackgroundColor3: Colors.black,
				BackgroundTransparency: 0.9,
			},
			{
				list: createElement("UIListLayout", { SortOrder: Enum.SortOrder.LayoutOrder }),
				Main: main,
				Children: createElement(
					"Frame",
					{
						Size: new UDim2(1, 0, 0, 0),
						AutomaticSize: Enum.AutomaticSize.Y,
						BackgroundColor3: Colors.black,
						BackgroundTransparency: 1,
						LayoutOrder: 99,
					},
					{
						list: createElement("UIListLayout", { SortOrder: Enum.SortOrder.LayoutOrder }),
						padding: createElement("UIPadding", { PaddingLeft: new UDim(0, 20) }),
					},
				),
			},
		);

		return new TreeControl(gui);
	}

	private readonly main: ButtonControl;
	readonly childContainer: Control;

	constructor(gui: TreeControlDefinition) {
		super(gui);
		this.main = this.add(new ButtonControl(gui.Main));
		this.childContainer = this.add(new Control(this.gui.Children));

		this.main.getGui().BackgroundColor3 = Colors.accent;
		this.event.subscribe(this.main.activated, () => {
			if (this.childContainer.isVisible()) {
				this.main.getGui().BackgroundColor3 = Colors.accentDark;
				this.childContainer.hide();
			} else {
				this.main.getGui().BackgroundColor3 = Colors.accent;
				this.childContainer.show();
			}
		});
	}
}

const create = (): TreeControl => {
	const createElement = Element.create;
	const root = createElement(
		"ScrollingFrame",
		{
			Name: "DebugROOT",
			Size: new UDim2(1, 0, 1, 0),
			BackgroundColor3: Colors.black,
			BackgroundTransparency: 1,
			ScrollingDirection: Enum.ScrollingDirection.Y,
			AutomaticCanvasSize: Enum.AutomaticSize.Y,
			Parent: createElement("ScreenGui", {
				Name: "DebugSCREEN",
				Parent: Gui.getPlayerGui(),
			}),
		},
		{
			list: createElement("UIListLayout", { SortOrder: Enum.SortOrder.LayoutOrder }),
			Main: createElement("TextButton", {
				Text: "TREE",
				AutomaticSize: Enum.AutomaticSize.XY,
				LayoutOrder: 0,
			}),
			Children: createElement(
				"Frame",
				{
					Size: new UDim2(1, 0, 0, 0),
					AutomaticSize: Enum.AutomaticSize.Y,
					BackgroundColor3: Colors.black,
					BackgroundTransparency: 1,
					LayoutOrder: 1,
				},
				{
					list: createElement("UIListLayout", { SortOrder: Enum.SortOrder.LayoutOrder }),
					padding: createElement("UIPadding", { PaddingLeft: new UDim(0, 20) }),
				},
			),
		},
	);

	return new TreeControl(root);
};

let tree: TreeControl | undefined;
const update = () => {
	if (!tree) throw "what";

	const add = (component: IDebuggableComponent, tree: TreeControl) => {
		const childtree = tree.childContainer.add(
			TreeControl.createChildList(
				Element.create("TextButton", {
					AutomaticSize: Enum.AutomaticSize.XY,
					Text: tostring(getmetatable(component)),
					TextColor3: Colors.white,
					Font: Enum.Font.Ubuntu,
					TextSize: 16,
				}),
			),
		);

		for (const child of component.getDebugChildren()) {
			add(child, childtree);
		}
	};

	for (const root of rootComponents) {
		add(root, tree);
	}
};
const toggle = () => {
	if (!tree) {
		tree = create();
		update();
		tree.show();
		return;
	} else {
		tree.destroy();
		tree = undefined;
	}
};

const launch = RunService.IsStudio() || GameDefinitions.isAdmin(Players.LocalPlayer);
if (!launch) new Signal<() => void>().Wait();
task.wait(0.5); // wait for the controls to enable

UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
	if (input.KeyCode !== Enum.KeyCode.F6) return;
	if (!InputController.isShiftPressed()) return;

	toggle();
});
