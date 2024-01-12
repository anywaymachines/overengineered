import { Workspace } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import GameEnvironmentController from "client/controller/GameEnvironmentController";
import { PlacedBlockData } from "shared/building/BlockManager";

type HeliumBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly VectorForce: VectorForce;
	};
};
export default class HeliumBlockLogic extends BlockLogic<HeliumBlock> {
	private readonly part;
	private readonly vectorForce;

	constructor(block: PlacedBlockData) {
		super(block);

		this.part = this.instance.Part;
		this.vectorForce = this.part.VectorForce;
	}

	protected prepare() {
		super.prepare();

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), () => this.update());
	}

	private update() {
		this.vectorForce.Force = new Vector3(
			0,
			Workspace.Gravity *
				this.part.Mass *
				1.2 *
				(1 - GameEnvironmentController.currentHeight / GameEnvironmentController.WeightlessnessHeight),
			0,
		);
	}
}
