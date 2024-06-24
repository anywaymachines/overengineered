import { ContextActionService } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { Component } from "shared/component/Component";
import { ComponentEvents } from "shared/component/ComponentEvents";
import { Keys } from "shared/fixes/Keys";
import { HostedService } from "shared/GameHost";
import { SharedRagdoll } from "shared/SharedRagdoll";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";

const { isPlayerRagdolling } = SharedRagdoll;
function initAutoRagdoll(event: ComponentEvents, humanoid: Humanoid, enabled: ReadonlyObservableValue<boolean>) {
	let prevSpeed: number | undefined;

	event.loop(0, () => {
		if (!enabled.get()) return;
		if (!humanoid.RootPart) return;
		if (humanoid.Sit) return;
		if (isPlayerRagdolling(humanoid)) return;

		const state = humanoid.GetState();
		if (
			state === Enum.HumanoidStateType.Physics ||
			state === Enum.HumanoidStateType.GettingUp ||
			state === Enum.HumanoidStateType.Jumping
		) {
			prevSpeed = undefined;
			return;
		}

		const newspeed = humanoid.RootPart.AssemblyLinearVelocity.Magnitude;
		if (prevSpeed === undefined) {
			prevSpeed = newspeed;
			return;
		}

		const diff = math.abs(newspeed - prevSpeed);
		prevSpeed = newspeed;

		const difference = state === Enum.HumanoidStateType.Landed ? 100 : 50;
		if (diff < difference) return;

		$log("Ragdolled with a diff of", diff);
		SharedRagdoll.event.send(true);
	});
}
function initRagdollUp(event: ComponentEvents, humanoid: Humanoid, autoRecovery: ReadonlyObservableValue<boolean>) {
	const player = LocalPlayer.player;

	while (!player.Character?.FindFirstChild("ConstraintsFolder")) {
		task.wait();
	}

	const getUpTime = 4;
	const actionName = "ragdoll_autoRecovery";
	event.subscribeRegistration(() =>
		SharedRagdoll.subscribeToPlayerRagdollChange(humanoid, () => {
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
		}),
	);
}
function initRagdollKey(
	event: ComponentEvents,
	key: ReadonlyObservableValue<{ triggerByKey: boolean; triggerKey: KeyCode }>,
) {
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

	let can = true;
	event.subscribeObservable(
		key,
		({ triggerKey, triggerByKey }) => {
			unbind();
			if (!triggerByKey) return;

			bind(triggerKey, () => {
				if (!can) return;

				const humanoid = LocalPlayer.humanoid.get();
				if (!humanoid || humanoid.Sit) return;

				const ragdolling = isPlayerRagdolling(humanoid);
				can = false;
				task.delay(1, () => (can = true));
				task.spawn(() => SharedRagdoll.event.send(!ragdolling));
			});
		},
		true,
	);
}

@injectable
export class RagdollController extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage) {
		super();

		initRagdollKey(
			this.event,
			playerDataStorage.config.createBased((c) => c.ragdoll),
		);
		this.event.subscribeObservable(
			LocalPlayer.humanoid,
			(humanoid) => {
				if (!humanoid) return;

				task.delay(1, () => {
					const character = LocalPlayer.character.get();
					if (!character) return;

					const component = new Component();
					const event = new ComponentEvents(component);

					initRagdollUp(
						event,
						humanoid,
						playerDataStorage.config.createBased((c) => c.ragdoll.autoRecovery),
					);
					initAutoRagdoll(
						event,
						humanoid,
						playerDataStorage.config.createBased((c) => c.ragdoll.autoFall),
					);

					humanoid.Died.Once(() => component.disable());
					event.subscribe(character.GetPropertyChangedSignal("Parent"), () => {
						if (character.Parent) return;
						component.destroy();
					});

					component.enable();
				});
			},
			true,
		);
	}
}
