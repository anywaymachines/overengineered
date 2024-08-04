import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class WheelBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.wheel> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.wheel);

		const collider = this.instance.FindFirstChild("Collider") as BasePart;
		const frictionMagic = 2; //hardcoded
		const elasticityMagic = 1; //hardcoded

		if (!collider) return;

		this.input.friction.subscribe((v) => {
			const modifier = v / 100;
			const props = collider.CustomPhysicalProperties;
			if (!props) return;
			collider.CustomPhysicalProperties = new PhysicalProperties(
				props.Density,
				modifier * frictionMagic,
				props.Elasticity,
				props.FrictionWeight,
				props.ElasticityWeight,
			);
		});

		this.input.elasticity.subscribe((v) => {
			const modifier = v / 100;
			const props = collider.CustomPhysicalProperties;
			if (!props) return;
			collider.CustomPhysicalProperties = new PhysicalProperties(
				props.Density,
				props.Friction,
				modifier * elasticityMagic,
				props.FrictionWeight,
				props.ElasticityWeight,
			);
		});
	}
}
