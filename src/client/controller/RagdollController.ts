import { ClientComponentEvents } from "client/component/ClientComponentEvents";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { HostedService } from "shared/GameHost";
import { SharedRagdoll } from "shared/SharedRagdoll";

function initRagdollUp(humanoid: Humanoid): RBXScriptConnection {
	const player = LocalPlayer.player;

	while (!player.Character?.FindFirstChild("ConstraintsFolder")) {
		task.wait();
	}

	const getUpTime = 4;
	return humanoid.GetAttributeChangedSignal(SharedRagdoll.ragdollAttributeName).Connect(() => {
		if (humanoid.GetAttribute(SharedRagdoll.ragdollAttributeName)) {
			humanoid.SetStateEnabled("GettingUp", false);
			humanoid.SetStateEnabled("Swimming", false);
			humanoid.SetStateEnabled("Seated", false);
			humanoid.ChangeState("Physics");

			if (humanoid.GetState() !== Enum.HumanoidStateType.Dead && humanoid.Health > 0) {
				task.spawn(() => {
					task.wait(getUpTime);

					while (task.wait()) {
						if (humanoid.Health <= 0) break;
						if (!humanoid.RootPart) break;
						if (!humanoid.GetAttribute(SharedRagdoll.ragdollAttributeName)) break;

						if (humanoid.RootPart.AssemblyLinearVelocity.Magnitude < 10) {
							SharedRagdoll.event.send(false);
							break;
						}
					}
				});
			}
		} else {
			humanoid.ChangeState("GettingUp");
			humanoid.SetStateEnabled("GettingUp", true);
			humanoid.SetStateEnabled("Swimming", true);
			humanoid.SetStateEnabled("Seated", true);

			const character = player.Character;
			if (character) {
				character.PivotTo(character.GetPivot().add(new Vector3(0, 2, 0)));
			}
		}

		humanoid.AutoRotate = !humanoid.GetAttribute(SharedRagdoll.ragdollAttributeName);
	});
}

export class RagdollController extends HostedService {
	constructor() {
		super();

		const event = new ClientComponentEvents(this);
		event.subInput((ih) =>
			ih.onKeyDown("R", () => {
				const humanoid = LocalPlayer.humanoid.get();
				if (!humanoid || humanoid.Sit) return;

				task.spawn(() => SharedRagdoll.event.send(!humanoid.GetAttribute(SharedRagdoll.ragdollAttributeName)));
			}),
		);

		this.event.subscribeObservable(
			LocalPlayer.humanoid,
			(humanoid) => {
				if (!humanoid) return;
				initRagdollUp(humanoid);
			},
			true,
		);
	}
}
