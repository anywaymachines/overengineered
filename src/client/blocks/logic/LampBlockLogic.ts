import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class LampBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.lamp> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.lamp);

		this.event.subscribeObservable(
			this.logicConfig.inputs.enabled.value,
			(enabled) => {
				const part = block.PrimaryPart as BasePart;

				if (enabled) {
					part.Color = Color3.fromRGB(255, 255, 255);
					part.Material = Enum.Material.Neon;
				} else {
					part.Color = Color3.fromRGB(0, 0, 0);
					part.Material = Enum.Material.SmoothPlastic;
				}
			},
			true,
		);
	}
}
