import Control from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import ConfirmPopup from "client/gui/popup/ConfirmPopup";
import SavePopup from "client/gui/popup/SavePopup";
import SelectButtonPopup from "client/gui/popup/SelectButtonPopup";
import SettingsPopup from "client/gui/popup/SettingsPopup";
import { ControlTest } from "client/test/visual/ControlTest";
import { Element } from "shared/Element";

export const PopupTest: ControlTest = {
	createTests() {
		return [
			[
				"Popups",
				new Control(
					Element.create(
						"Frame",
						{
							Size: new UDim2(1, 0, 1, 0),
							BackgroundTransparency: 1,
						},
						{
							list: Element.create("UIListLayout", { FillDirection: Enum.FillDirection.Vertical }),
							b1: TextButtonControl.create({
								Text: "Confirmation",
								Size: new UDim2(0, 200, 0, 30),
							})
								.with((b) =>
									b.activated.Connect(() =>
										ConfirmPopup.showPopup(
											"Show the next popup????",
											"this irreversible !!!",
											() => b.text.set("YES"),
											() => b.text.set("NO"),
										),
									),
								)
								.with((b) => b.enable()).instance,
							b2: TextButtonControl.create({
								Text: "Multi Confirmation",
								Size: new UDim2(0, 200, 0, 30),
							})
								.with((b) =>
									b.activated.Connect(() =>
										ConfirmPopup.showPopup(
											"Show the next popup????",
											"this irreversible !!!",
											() => {
												ConfirmPopup.showPopup(
													"Confirm????",
													"this will do nothing and is irreversible !!!",
													() => {},
													() => {},
												);
											},
											() => {},
										),
									),
								)
								.with((b) => b.enable()).instance,
							b3: TextButtonControl.create({
								Text: "Key Selection",
								Size: new UDim2(0, 200, 0, 30),
							})
								.with((b) =>
									b.activated.Connect(() =>
										SelectButtonPopup.showPopup(
											(btn) => b.text.set(btn),
											() => b.text.set("CANCEL"),
										),
									),
								)
								.with((b) => b.enable()).instance,
							b4: TextButtonControl.create({
								Text: "Settings",
								Size: new UDim2(0, 200, 0, 30),
							})
								.with((b) => b.activated.Connect(() => SettingsPopup.showPopup()))
								.with((b) => b.enable()).instance,
							b5: TextButtonControl.create({
								Text: "Saves",
								Size: new UDim2(0, 200, 0, 30),
							})
								.with((b) => b.activated.Connect(() => SavePopup.showPopup()))
								.with((b) => b.enable()).instance,
						},
					),
				),
			],
		];
	},
};
