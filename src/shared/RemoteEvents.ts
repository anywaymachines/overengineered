import Effects from "./effects/Effects";
import { AutoC2SRemoteEvent } from "./event/C2SRemoteEvent";
import { AutoS2CRemoteEvent } from "./event/S2CRemoteEvent";

const RemoteEvents = {
	...Effects,

	Burn: new AutoC2SRemoteEvent<BasePart>("burn"),
	ImpactExplode: new AutoC2SRemoteEvent<{ readonly part: BasePart; readonly blastRadius: number }>("impact_explode"),
	ImpactBreak: new AutoC2SRemoteEvent<BasePart>("impact_break"),
	Impulse: new AutoS2CRemoteEvent<{
		readonly part: BasePart;
		readonly impulse: Vector3;
		readonly position: Vector3 | undefined;
	}>("impulse"),

	// empty method just to trigger constructors
	initialize() {},
} as const;
export default RemoteEvents;
