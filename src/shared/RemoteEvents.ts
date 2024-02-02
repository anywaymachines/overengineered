import Effects from "./effects/Effects";
import { AutoC2SRemoteEvent } from "./event/C2SRemoteEvent";

const RemoteEvents = {
	...Effects,

	Burn: new AutoC2SRemoteEvent<BasePart>("burn"),
	ImpactExplode: new AutoC2SRemoteEvent<{ readonly part: BasePart; readonly blastRadius: number }>("impact_explode"),
	ImpactBreak: new AutoC2SRemoteEvent<BasePart>("impact_break"),

	// empty method just to trigger constructors
	initialize() {},
} as const;
export default RemoteEvents;
