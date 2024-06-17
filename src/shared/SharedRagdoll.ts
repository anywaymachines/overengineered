import { C2SRemoteEvent } from "shared/event2/PERemoteEvent";

export namespace SharedRagdoll {
	export const ragdollAttributeName = "Radgoll";
	export const event = new C2SRemoteEvent<[ragdoll: boolean]>("ragdoll_trigger");
}
