import { ColorChooser, ColorChooserDefinition } from "client/gui/ColorChooser";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { ControlTest } from "client/test/visual/ControlTest";

export const ColorWheelTest: ControlTest = {
	createTests() {
		const colorparent = Gui.getGameUI<{
			Templates: { Color: GuiObject & { Content: ColorChooserDefinition } };
		}>().Templates.Color.Clone();

		return [
			[
				"Color wheel",
				new Control(colorparent)
					.withAdded(new ColorChooser(colorparent.Content))
					.with((c) => (c.instance.Position = new UDim2()))
					.with((c) => (c.instance.AnchorPoint = new Vector2())),
			],
		];
	},
};
