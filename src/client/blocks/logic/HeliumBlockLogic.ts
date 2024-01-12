import { Workspace } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import GameEnvironmentController from "client/controller/GameEnvironmentController";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class HeliumBlockLogic extends BlockLogic {
	private part: BasePart;
	private vectorForce: VectorForce;

	constructor(block: PlacedBlockData) {
		super(block);

		this.part = this.instance.FindFirstChild("Part") as BasePart;
		this.vectorForce = this.part.FindFirstChild("VectorForce") as VectorForce;
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
