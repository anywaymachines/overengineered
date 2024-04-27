import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

export class ImpactBreakAutoC2SRemoteEvent extends AutoC2SRemoteEvent<BasePart[]> {
	justRun(player: Player | undefined, arg: BasePart[] | undefined): void {
		if (!arg) return;

		arg.forEach((part) => {
			part.CustomPhysicalProperties = new PhysicalProperties(
				math.clamp(part.CurrentPhysicalProperties.Density * 3, 0.01, 100),
				math.clamp(part.CurrentPhysicalProperties.Friction * 3.5, 0, 2),
				part.CurrentPhysicalProperties.Elasticity,
			);
		});

		super.justRun(player, arg);
	}
}
