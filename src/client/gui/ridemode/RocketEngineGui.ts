import Control from "client/base/Control";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";
import BlockLogicController from "client/controller/BlockLogicController";
import { RunService } from "@rbxts/services";
import RocketEngineLogic from "client/blocks/logic/RocketEngineLogic";

export type RocketEngineGuiDefinition = SliderControlDefinition & {};

export default class RocketEngineGui extends Control<RocketEngineGuiDefinition> {
	public readonly slider;

	constructor(gui: RocketEngineGuiDefinition) {
		super(gui);

		this.slider = new SliderControl(this.gui, 0, 1, 0.01);
		this.slider.getGui().Active = false;
		this.add(this.slider);

		this.event.subscribe(RunService.Heartbeat, () => {
			const avg: number[] = [];

			for (const block of BlockLogicController.getBlocks()) {
				if (!(block instanceof RocketEngineLogic)) continue;
				avg.push(block.getTorque());
			}

			this.slider.value.set(avg.reduce((acc, val) => acc + val, 0) / avg.size() / 100);
		});
	}
}
