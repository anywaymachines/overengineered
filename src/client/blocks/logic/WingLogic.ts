import { RunService } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import RobloxUnit from "shared/RobloxUnit";
import { PlacedBlockData } from "shared/building/BlockManager";

type Wing = BlockModel & {
	readonly WingSurface:
		| BasePart
		| (UnionOperation & {
				readonly VectorForce: VectorForce;
		  });
};

export default class WingLogic extends BlockLogic<Wing> {
	private wingSurface;

	constructor(block: PlacedBlockData) {
		super(block);

		this.wingSurface = this.instance.WingSurface;
	}

	private findSurface(wingSurface: BasePart): Vector3 {
		const Z = wingSurface.Size.X * wingSurface.Size.Z;
		const X = Z * 0.05;
		return wingSurface.IsA("WedgePart") ? new Vector3(Z, X, X).mul(0.5) : new Vector3(X, Z, X);
	}

	protected prepare() {
		super.prepare();

		// FIXME: Wait for fluid forces to exit Beta
		if (RunService.IsStudio()) {
			this.wingSurface.EnableFluidForces = true;
		} else {
			const surface = this.findSurface(this.wingSurface);
			const vectorForce = this.wingSurface.FindFirstChild("VectorForce") as VectorForce;

			const density = math.max(
				0.7,
				RobloxUnit.GetMaterialPhysicalProperties(this.block.material ?? Enum.Material.Plastic).Density / 2,
			);
			this.wingSurface.CustomPhysicalProperties = new PhysicalProperties(density, 0.3, 0.5, 1, 1);

			if (!vectorForce) return;

			this.eventHandler.subscribe(RunService.Heartbeat, () => {
				const force = surface
					.mul(
						this.wingSurface.CFrame.PointToObjectSpace(
							this.wingSurface.Position.add(this.wingSurface.Velocity),
						).mul(-1),
					)
					.mul(21)
					.add(vectorForce.Force)
					.div(2);
				vectorForce.Force = force;
			});
		}
	}
}
