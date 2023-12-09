import { RunService } from "@rbxts/services";
import Control from "client/base/Control";
import Machine from "client/blocks/logic/Machine";
import RocketEngineLogic from "client/blocks/logic/RocketEngineLogic";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";

export type RocketEngineGuiDefinition = SliderControlDefinition & {};

export default class RocketEngineGui extends Control<RocketEngineGuiDefinition> {
	public readonly slider;

	constructor(gui: RocketEngineGuiDefinition, machine: Machine) {
		super(gui);

		this.slider = new SliderControl(this.gui, 0, 100, 1);
		this.slider.getGui().Active = false;
		this.add(this.slider);

		this.event.subscribe(RunService.Heartbeat, () => {
			const avg: number[] = [];
			for (const block of machine.getChildren()) {
				if (!(block instanceof RocketEngineLogic)) continue;
				avg.push(block.getTorque());
			}

			this.slider.value.set(avg.reduce((acc, val) => acc + val, 0) / avg.size());
		});
	}
}
