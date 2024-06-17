import { LocalPlayer } from "client/controller/LocalPlayer";
import { HostedService } from "shared/GameHost";
import { SharedRagdoll } from "shared/SharedRagdoll";

const toggleRagdoll = (humanoid: Humanoid, enabled: boolean) => {
	if (enabled) {
		humanoid.ChangeState("Physics");
	} else {
		humanoid.ChangeState("Freefall");
	}
};

export class RagdollController extends HostedService {
	constructor() {
		super();

		this.event.subscribeObservable(
			LocalPlayer.humanoid,
			(humanoid) => {
				if (!humanoid) return;

				humanoid
					.GetAttributeChangedSignal(SharedRagdoll.ragdollAttributeName)
					.Connect(() =>
						toggleRagdoll(humanoid, humanoid.GetAttribute(SharedRagdoll.ragdollAttributeName) === true),
					);

				humanoid.Died.Connect(() => {
					humanoid.AutoRotate = false;
					humanoid.SetAttribute(SharedRagdoll.ragdollAttributeName, true);
				});
			},
			true,
		);
	}
}
