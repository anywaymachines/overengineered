import { ContextActionService } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Keys } from "shared/fixes/Keys";
import { HostedService } from "shared/GameHost";
import { SharedRagdoll } from "shared/SharedRagdoll";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";

const { isPlayerRagdolling } = SharedRagdoll;
function initAutoRagdoll(humanoid: Humanoid, enabled: ReadonlyObservableValue<boolean>): SignalConnection {
	const difference = 40;

	let prevSpeed: number | undefined;
	let stopped = false;

	task.spawn(() => {
		while (true as boolean) {
			task.wait();
			if (!enabled.get()) continue;

			if (stopped) break;
			if (!humanoid.RootPart) continue;
			if (humanoid.Sit) continue;
			if (isPlayerRagdolling(humanoid)) continue;

			const state = humanoid.GetState();
			if (
				state === Enum.HumanoidStateType.Physics ||
				state === Enum.HumanoidStateType.GettingUp ||
				state === Enum.HumanoidStateType.Jumping
			) {
				prevSpeed = undefined;
				continue;
			}

			const newspeed = humanoid.RootPart.AssemblyLinearVelocity.Magnitude;
			if (prevSpeed === undefined) {
				prevSpeed = newspeed;
				continue;
			}

			const diff = math.abs(newspeed - prevSpeed);
			prevSpeed = newspeed;

			if (diff < difference) continue;

			SharedRagdoll.setPlayerRagdoll(humanoid, true);
			SharedRagdoll.event.send(true);
		}
	});

	return humanoid.Died.Once(() => (stopped = true));
}
function initRagdollUp(humanoid: Humanoid, autoRecovery: ReadonlyObservableValue<boolean>): SignalConnection {
	const player = LocalPlayer.player;

	while (!player.Character?.FindFirstChild("ConstraintsFolder")) {
		task.wait();
	}

	const getUpTime = 4;

	const actionName = "ragdoll_autoRecovery";
	return SharedRagdoll.subscribeToPlayerRagdollChange(humanoid, () => {
		if (isPlayerRagdolling(humanoid)) {
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
						if (!isPlayerRagdolling(humanoid)) break;

						if (!autoRecovery.get()) {
							ContextActionService.BindActionAtPriority(
								actionName,
								() => {
									task.spawn(() => SharedRagdoll.event.send(false));

									ContextActionService.UnbindAction(actionName);
									return Enum.ContextActionResult.Pass;
								},
								false,
								2000 + 1,
								...Enum.PlayerActions.GetEnumItems(),
							);

							break;
						}

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

		humanoid.AutoRotate = !isPlayerRagdolling(humanoid);
	});
}

@injectable
export class RagdollController extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage) {
		super();

		const actionName = "ragdoll";
		function bind(key: KeyCode, func: () => void) {
			ContextActionService.BindAction(
				actionName,
				(name, state, input) => {
					if (actionName !== name) return;
					if (state !== Enum.UserInputState.Begin) return;
					if (input.KeyCode.Name !== key) return;

					func();
				},
				false,
				Keys[key],
			);
		}
		function unbind() {
			ContextActionService.UnbindAction(actionName);
		}

		this.event.subscribeObservable(
			playerDataStorage.config.createBased((c) => c.ragdoll),
			({ triggerKey, triggerByKey }) => {
				unbind();
				if (!triggerByKey) return;

				bind(triggerKey, () => {
					const humanoid = LocalPlayer.humanoid.get();
					if (!humanoid || humanoid.Sit) return;

					const ragdolling = isPlayerRagdolling(humanoid);
					SharedRagdoll.setPlayerRagdoll(humanoid, !ragdolling);
					task.spawn(() => SharedRagdoll.event.send(!ragdolling));
				});
			},
			true,
		);

		this.event.subscribeObservable(
			LocalPlayer.humanoid,
			(humanoid) => {
				if (!humanoid) return;
				initRagdollUp(
					humanoid,
					playerDataStorage.config.createBased((c) => c.ragdoll.autoRecovery),
				);
				initAutoRagdoll(
					humanoid,
					playerDataStorage.config.createBased((c) => c.ragdoll.autoFall),
				);
			},
			true,
		);
	}
}
