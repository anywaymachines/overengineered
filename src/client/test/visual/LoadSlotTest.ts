import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { Element } from "shared/Element";
import { CustomRemotes } from "shared/Remotes";

export const LoadSlotTest = {
	create(imported: boolean) {
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
			new NumberTextBoxControl(
				Element.create("TextBox", {
					Size: new UDim2(0, 100, 0, 30),
					ClearTextOnFocus: false,
					AutoLocalize: false,
				}),
			),
		);
		const slotid = loadControl.add(
			new NumberTextBoxControl(
				Element.create("TextBox", {
					Size: new UDim2(0, 100, 0, 30),
					ClearTextOnFocus: false,
					AutoLocalize: false,
				}),
			),
		);
		const loadbtn = loadControl.add(
			TextButtonControl.create({ Size: new UDim2(0, 100, 0, 30), Text: "Load slot", AutoLocalize: false }),
		);

		userid.value.set(1745850275); // BlackWater
		loadbtn.activated.Connect(() =>
			CustomRemotes.slots.loadAsAdmin.send({ userid: userid.value.get(), index: slotid.value.get(), imported }),
		);

		return loadControl;
	},
};
