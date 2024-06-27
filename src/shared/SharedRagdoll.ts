import { C2SRemoteEvent } from "shared/event/PERemoteEvent";

export namespace SharedRagdoll {
	export const event = new C2SRemoteEvent<boolean>("ragdoll_trigger");
	const ragdollAttributeName = "Radgoll";

	export function subscribeToPlayerRagdollChange(humanoid: Humanoid, func: () => void): RBXScriptConnection {
		return humanoid.GetAttributeChangedSignal(ragdollAttributeName).Connect(func);
	}

	/** @server */
	export function setPlayerRagdoll(humanoid: Humanoid, ragdolling: boolean): void {
		humanoid.SetAttribute(ragdollAttributeName, ragdolling);
	}
	export function isPlayerRagdolling(humanoid: Humanoid): boolean {
		return humanoid.GetAttribute(ragdollAttributeName) === true;
	}
}
