import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { GameEnvironment } from "shared/data/GameEnvironment";
import { Physics } from "shared/Physics";
import type { PlacedBlockData } from "shared/building/BlockManager";

type HeliumBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly VectorForce: VectorForce;
	};
};
export class HeliumBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.heliumblock, HeliumBlock> {
	private readonly part;
	private readonly vectorForce;
	private airDensityConstant = 1.2 / GameEnvironment.EarthAirDensity;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.heliumblock);

		this.part = this.instance.Part;
		this.vectorForce = this.part.VectorForce;

		this.event.subscribeObservable(this.input.density, () => this.update());
		this.event.onEnable(() => this.update());
	}

	tick(tick: number): void {
		super.tick(tick);

		this.update();
	}

	private update() {
		//tick works when block works
		const height = Physics.LocalHeight.fromGlobal(this.part.GetPivot().Y);
		const counterforce = Physics.GetGravityOnHeight(height) * this.part.Mass;
		this.vectorForce.Force = new Vector3(
			0,
			((Physics.GetAirDensityOnHeight(height) * this.airDensityConstant) / this.input.density.get()) *
				counterforce,
			0,
		);
	}
}
