import { Players, RunService, Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";
import type { PlacedBlockData } from "shared/building/BlockManager";

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

	private findWingSurface(wingSurface: BasePart) {
		const Z = wingSurface.Size.X * wingSurface.Size.Z;
		const X = Z * 0.05;
		return wingSurface.IsA("WedgePart") ? new Vector3(Z, X, X).mul(0.5) : new Vector3(X, Z, X);
	}

	private initializeForces() {
		// Enable fluidforces for roblox engineers
		if (RunService.IsStudio() || GameDefinitions.isRobloxEngineer(Players.LocalPlayer)) {
			this.wingSurface.EnableFluidForces = true;
			return;
		}

		if (this.input.enabled.get() === false) return;

		// Create force constraints
		const attachment = new Instance("Attachment", this.wingSurface);
		const vectorForce = new Instance("VectorForce", this.wingSurface);
		vectorForce.RelativeTo = Enum.ActuatorRelativeTo.Attachment0;
		vectorForce.Attachment0 = attachment;

		// Set up wing material properties
		const density = math.max(0.7, new PhysicalProperties(this.block.material).Density / 2);
		this.wingSurface.CustomPhysicalProperties = new PhysicalProperties(density, 0.3, 0.5, 1, 1);

		const surface = this.findWingSurface(this.wingSurface);
		this.event.subscribe(RunService.Heartbeat, () => {
			const force = surface
				.mul(
					this.wingSurface.CFrame.PointToObjectSpace(
						this.wingSurface.Position.add(this.wingSurface.Velocity),
					).mul(-21),
				)
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
			vectorForce.Enabled = force.Magnitude > Workspace.Gravity * this.wingSurface.Mass;
			vectorForce.Force = force;
		});
	}
}
