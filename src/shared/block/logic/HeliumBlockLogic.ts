import { Workspace } from "@rbxts/services";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { GameEnvironment } from "shared/data/GameEnvironment";

type HeliumBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly VectorForce: VectorForce;
	};
};
export class HeliumBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.heliumblock, HeliumBlock> {
	private readonly part;
	private readonly vectorForce;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.heliumblock);

		this.part = this.instance.Part;
		this.vectorForce = this.part.VectorForce;

		this.event.readonlyObservableFromInstanceParam(Workspace, "Gravity").subscribe(() => this.update());
		this.event.subscribeObservable(this.input.density, () => this.update());
		this.event.onEnable(() => this.update());
	}

	private update() {
		this.vectorForce.Force = new Vector3(
			0,
			math.max(
				0,
				Workspace.Gravity *
					this.part.Mass *
					1.2 *
					this.input.density.get() *
					(1 - this.instance.GetPivot().Y / GameEnvironment.ZeroGravityHeight),
			),
			0,
		);
	}
}
