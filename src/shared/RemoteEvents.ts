import ImpactBreakAutoC2SRemoteEvent from "shared/block/impact/ImpactBreakAutoC2SRemoteEvent";
import Effects from "./effects/Effects";
import { AutoC2SRemoteEvent } from "./event/C2SRemoteEvent";

const RemoteEvents = {
	...Effects,

	Burn: new AutoC2SRemoteEvent<BasePart[]>("burn"),
	ImpactExplode: new AutoC2SRemoteEvent<{ part: BasePart; blastRadius: number }[]>("impact_explode"),
	ImpactBreak: new ImpactBreakAutoC2SRemoteEvent("impact_break"),

	// empty method just to trigger constructors
	initialize() {},
} as const;
export default RemoteEvents;
