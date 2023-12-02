import { RunService } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import GameEnvironmentController from "client/controller/GameEnvironmentController";

export default class WingLogic extends BlockLogic {
	private wingSurface: BasePart;
	private vectorForce: VectorForce;

	private surface: Vector3;

	constructor(block: Model) {
		super(block);

		this.wingSurface = block.FindFirstChild("WingSurface") as BasePart;
		this.vectorForce = this.wingSurface.FindFirstChild("VectorForce") as VectorForce;
		this.surface = this.findSurface(this.wingSurface);

		this.wingSurface.CustomPhysicalProperties = new PhysicalProperties(0.7, 0.3, 0.5, 1, 1);

		this.setup();
	}

	private findSurface(wingSurface: BasePart): Vector3 {
		const Z = wingSurface.Size.X * wingSurface.Size.Z;
		const X = Z * 0.05;
		return wingSurface.IsA("WedgePart") ? new Vector3(Z, X, X).mul(0.5) : new Vector3(X, Z, X);
	}

	protected setup() {
		super.setup();

		this.eventHandler.subscribe(RunService.Heartbeat, () => {
			const force = this.surface
				.mul(
					this.wingSurface.CFrame.PointToObjectSpace(
						this.wingSurface.Position.add(this.wingSurface.Velocity),
					).mul(-1),
				)
				.mul(21)
				.add(this.vectorForce.Force)
				.div(2);
			this.vectorForce.Force = force;
		});
	}
}
