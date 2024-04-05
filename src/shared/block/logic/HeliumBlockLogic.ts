import { Workspace } from "@rbxts/services";
import { BlockLogic } from "shared/block/BlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import { GameEnvironment } from "shared/data/GameEnvironment";

type HeliumBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly VectorForce: VectorForce;
	};
};
export class HeliumBlockLogic extends BlockLogic<HeliumBlock> {
	private readonly part;
	private readonly vectorForce;

	constructor(block: PlacedBlockData) {
		super(block);

		this.part = this.instance.Part;
		this.vectorForce = this.part.VectorForce;

		this.event.readonlyObservableFromInstanceParam(Workspace, "Gravity").subscribe(() => this.update());
		this.event.onEnable(() => this.update());
	}

	private update() {
		this.vectorForce.Force = new Vector3(
			0,
			Workspace.Gravity *
				this.part.Mass *
				1.2 *
				(1 - this.instance.GetPivot().Y / GameEnvironment.ZeroGravityHeight),
			0,
		);
	}
}
