import { RunService } from "@rbxts/services";
import BlockLogic from "client/base/BlockLogic";
import RobloxUnit from "shared/RobloxUnit";

export default class WingLogic extends BlockLogic {
	private wingSurface: BasePart;
	private vectorForce: VectorForce;

	private surface: Vector3;

	constructor(block: Model) {
		super(block);

		this.wingSurface = block.WaitForChild("WingSurface") as BasePart;
		this.vectorForce = this.wingSurface.WaitForChild("VectorForce") as VectorForce;
		this.surface = this.findSurface(this.wingSurface);

		const material =
			Enum.Material.GetEnumItems().find((value) => value.Value === (block.GetAttribute("material") as number)) ??
			Enum.Material.Plastic;
		const density = math.max(0.7, RobloxUnit.GetMaterialPhysicalProperties(material).Density);
		this.wingSurface.CustomPhysicalProperties = new PhysicalProperties(density, 0.3, 0.5, 1, 1);
	}

	private findSurface(wingSurface: BasePart): Vector3 {
		const Z = wingSurface.Size.X * wingSurface.Size.Z;
		const X = Z * 0.05;
		return wingSurface.IsA("WedgePart") ? new Vector3(Z, X, X).mul(0.5) : new Vector3(X, Z, X);
	}

	protected prepare() {
		super.prepare();

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
