import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

export default class ImpactBreakAutoC2SRemoteEvent extends AutoC2SRemoteEvent<BasePart> {
	justRun(player: Player | undefined, arg: BasePart): void {
		arg.CustomPhysicalProperties = new PhysicalProperties(
			arg.CurrentPhysicalProperties.Density * 3,
			math.clamp(arg.CurrentPhysicalProperties.Friction * 3.5, 0, 2),
			arg.CurrentPhysicalProperties.Elasticity,
		);

		super.justRun(player, arg);
	}
}
