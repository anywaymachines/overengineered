import { Players, RunService, Workspace } from "@rbxts/services";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";

type Wing = BlockModel & {
	readonly WingSurface:
		| BasePart
		| (UnionOperation & {
				readonly VectorForce: VectorForce;
		  });
};

export class WingLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.wing1x1, Wing> {
	private readonly wingSurface;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.wing1x1);

		this.wingSurface = this.instance.WingSurface;

		this.event.onEnable(() => this.initializeForces());
	}

	private initializeForces() {
		// FIXME: Enable fluidforces for roblox engineers
		if (RunService.IsStudio() || Players.LocalPlayer.IsInGroup(1200769)) {
			this.wingSurface.EnableFluidForces = true;
			return;
		}

		if (this.input.enabled.get() === false) return;

		this.wingSurface.EnableFluidForces = false;

		const findWingSurface = (wingSurface: BasePart): Vector3 => {
			const Z = wingSurface.Size.X * wingSurface.Size.Z;
			const X = Z * 0.05;
			return wingSurface.IsA("WedgePart") ? new Vector3(Z, X, X).mul(0.5) : new Vector3(X, Z, X);
		};
		const surface = findWingSurface(this.wingSurface);
		const vectorForce = this.wingSurface.FindFirstChild("VectorForce") as VectorForce;

		const density = math.max(0.7, new PhysicalProperties(this.block.material ?? Enum.Material.Plastic).Density / 2);
		this.wingSurface.CustomPhysicalProperties = new PhysicalProperties(density, 0.3, 0.5, 1, 1);

		if (!vectorForce) return;
		this.event.subscribe(RunService.Heartbeat, () => {
			const force = surface
				.mul(
					this.wingSurface.CFrame.PointToObjectSpace(
						this.wingSurface.Position.add(this.wingSurface.Velocity.add(Workspace.GlobalWind)),
					).mul(-1),
				)
				.mul(21)
				.add(vectorForce.Force)
				.div(2)
				.mul(
					math.clamp(
						1 -
							math.pow(
								(this.wingSurface.Position.Y - GameDefinitions.HEIGHT_OFFSET) /
									GameEnvironment.ZeroAirHeight,
								2,
							),
						0,
						1,
					),
				);

			// - ((0 - -16000 + 10000) / (-16000 - 10000))
			// (10000 - -16000) / (-16000 - 10000)
			// 1 - height / max height

			vectorForce.Force = force;
		});
	}
}
