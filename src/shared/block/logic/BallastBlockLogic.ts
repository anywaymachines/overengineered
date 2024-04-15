import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class BallastBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.ballast> {
	readonly part;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.ballast);

		this.part = this.block.instance.WaitForChild("Part") as BasePart;

		this.event.subscribeObservable(
			this.input.density,
			(density) => {
				const currentPhysProp = this.part.CurrentPhysicalProperties;
				const materialPhysProp = new PhysicalProperties(this.part.Material);
				const physProp = new PhysicalProperties(
					materialPhysProp.Density + density,
					currentPhysProp.Friction,
					currentPhysProp.Elasticity,
					currentPhysProp.FrictionWeight,
					currentPhysProp.ElasticityWeight,
				);
				this.part.CustomPhysicalProperties = physProp;
			},
			true,
		);
	}
}
