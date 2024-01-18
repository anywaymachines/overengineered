import BlockLogic from "client/base/BlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";

type Wing = BlockModel & {
	readonly WingSurface: BasePart & {
		readonly VectorForce: VectorForce;
	};
};

export default class WingLogic extends BlockLogic<Wing> {
	private wingSurface;

	constructor(block: PlacedBlockData) {
		super(block);

		this.wingSurface = this.instance.WingSurface;
	}

	protected prepare() {
		super.prepare();

		this.wingSurface.EnableFluidForces = true;
	}
}
