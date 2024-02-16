import Control from "client/gui/Control";
import { Element } from "client/gui/Element";
import { TextButtonControl } from "client/gui/controls/Button";
import NumberTextBoxControl from "client/gui/controls/NumberTextBoxControl";
import Remotes from "shared/Remotes";
import { ControlTest } from "./ControlTest";

export const LoadSlotTest: ControlTest = {
	createTests() {
		const loadControl = new Control(
			Element.create(
				"Frame",
				{
					Size: new UDim2(1, 0, 1, 0),
					BackgroundTransparency: 1,
				},
				{
					list: Element.create("UIListLayout", { FillDirection: Enum.FillDirection.Vertical }),
				},
			),
		);

		const userid = loadControl.add(
			new NumberTextBoxControl(Element.create("TextBox", { Size: new UDim2(0, 100, 0, 30) })),
		);
		const slotid = loadControl.add(
			new NumberTextBoxControl(Element.create("TextBox", { Size: new UDim2(0, 100, 0, 30) })),
		);
		const loadbtn = loadControl.add(
			TextButtonControl.create({ Size: new UDim2(0, 100, 0, 30), Text: "Load slot" }),
		);

		userid.value.set(1745850275); // BlackWater
		loadbtn.activated.Connect(() =>
			Remotes.Client.GetNamespace("Admin").Get("LoadSlot").SendToServer(userid.value.get(), slotid.value.get()),
		);

		return [["Load", loadControl]];
	},
};
