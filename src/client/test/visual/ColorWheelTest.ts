import { ColorWheel, ColorWheelDefinition } from "client/gui/ColorWheel";
import { Gui } from "client/gui/Gui";
import { ControlTest } from "client/test/visual/ControlTest";

export const ColorWheelTest: ControlTest = {
	createTests() {
		return [
			[
				"Color wheel",
				new ColorWheel(Gui.getGameUI<{ Templates: { Color: ColorWheelDefinition } }>().Templates.Color.Clone())
					.with((c) => (c.instance.Position = new UDim2()))
					.with((c) => (c.instance.AnchorPoint = new Vector2())),
			],
		];
	},
};
