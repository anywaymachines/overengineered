import Control from "client/base/Control";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";

export type TestSceneDefinition = GuiObject & {
	VerticalSlider: SliderControlDefinition;
};

export default class TestScene extends Control<TestSceneDefinition> {
	constructor(gui: TestSceneDefinition) {
		super(gui);

		this.add(new SliderControl(this.gui.VerticalSlider, 0, 1, 0.01));
	}
}
