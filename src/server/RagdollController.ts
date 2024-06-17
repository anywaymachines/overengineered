import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";
import { SharedRagdoll } from "shared/SharedRagdoll";

namespace RagdollModule {
	type ConstraintConfig = {
		readonly UpperAngle: number;
		readonly TwistLowerAngle: number;
		readonly TwistUpperAngle: number;
	};
	type ConstraintsConfig = { readonly [k in string]: ConstraintConfig };

	const r6ConstraintsConfig: ConstraintsConfig = {
		Hip: {
			UpperAngle: 60,
			TwistLowerAngle: -45,
			TwistUpperAngle: 45,
		},
		Shoulder: {
			UpperAngle: 80,
			TwistLowerAngle: -60,
			TwistUpperAngle: 20,
		},
		Neck: {
			UpperAngle: 30,
			TwistLowerAngle: -50,
			TwistUpperAngle: 50,
		},
	};
	const r15ConstraintsConfig: ConstraintsConfig = {
		Ankle: {
			UpperAngle: 0,
			TwistLowerAngle: -5,
			TwistUpperAngle: 5,
		},
		Elbow: {
			UpperAngle: 0,
			TwistLowerAngle: 5,
			TwistUpperAngle: 45,
		},

		Hip: {
			UpperAngle: 20,
			TwistLowerAngle: -70,
			TwistUpperAngle: 70,
		},
		Knee: {
			UpperAngle: 0,
			TwistLowerAngle: -45,
			TwistUpperAngle: -5,
		},
		Neck: {
			UpperAngle: 30,
			TwistLowerAngle: -35,
			TwistUpperAngle: 35,
		},
		Shoulder: {
			UpperAngle: 45,
			TwistLowerAngle: -80,
			TwistUpperAngle: 80,
		},
		Waist: {
			UpperAngle: 10,
			TwistLowerAngle: -25,
			TwistUpperAngle: 25,
		},
		Wrist: {
			UpperAngle: 0,
			TwistLowerAngle: -15,
			TwistUpperAngle: 15,
		},
	};

	export function createJoints(character: Model) {
		const constraintsFolder = new Instance("Folder", character);
		constraintsFolder.Name = "ConstraintsFolder";

		const humanoid = character.WaitForChild("Humanoid") as Humanoid;
		humanoid.BreakJointsOnDeath = false;
		humanoid.RequiresNeck = false;

		if (humanoid.RigType === Enum.HumanoidRigType.R6) {
			for (const [, joint] of pairs(character.GetDescendants())) {
				if (!joint.IsA("Motor6D")) continue;
				assert(joint.Part0);
				assert(joint.Part1);

				if (joint.Name === "RootJoint") {
					const rootHinge = new Instance("HingeConstraint");
					rootHinge.Name = "RootHinge";
					rootHinge.LimitsEnabled = true;
					rootHinge.LowerAngle = 0;
					rootHinge.UpperAngle = 0;

					const att0 = new Instance("Attachment", joint.Part1);
					att0.Name = "RootAttachment0";
					const att1 = new Instance("Attachment", joint.Part0);
					att1.Name = "RootAttachment1";

					rootHinge.Attachment0 = att0;
					rootHinge.Attachment1 = att1;
					rootHinge.Parent = constraintsFolder;
				} else {
					const ballSocket = new Instance("BallSocketConstraint");
					ballSocket.Name = joint.Name + " Socket";
					ballSocket.Enabled = true;
					ballSocket.LimitsEnabled = true;
					ballSocket.TwistLimitsEnabled = true;

					let jointName: string;
					if (string.find(joint.Name, "Right ")[0]) {
						jointName = string.split(joint.Name, "Right ")[1];
					} else if (string.find(joint.Name, "Left ")[0]) {
						jointName = string.split(joint.Name, "Left ")[1];
					} else {
						jointName = joint.Name;
					}

					const jointConfig = r6ConstraintsConfig[jointName];
					ballSocket.UpperAngle = jointConfig.UpperAngle;
					ballSocket.TwistLowerAngle = jointConfig.TwistLowerAngle;
					ballSocket.TwistUpperAngle = jointConfig.TwistUpperAngle;

					const att0 = new Instance("Attachment", joint.Part0);
					att0.Name = joint.Part1.Name + " Attachment0";
					att0.CFrame = joint.C0;

					const att1 = new Instance("Attachment", joint.Part1);
					att1.Name = joint.Part1.Name + " Attachment1";
					att1.CFrame = joint.C1;

					ballSocket.Attachment0 = att0;
					ballSocket.Attachment1 = att1;

					ballSocket.Parent = constraintsFolder;
				}
			}
		} else if (humanoid.RigType === Enum.HumanoidRigType.R15) {
			delay(0.25, () => {
				// small delay for attachments fix

				for (const [, joint] of pairs(character.GetDescendants())) {
					if (!joint.IsA("Motor6D")) continue;
					assert(joint.Part0);
					assert(joint.Part1);

					if (joint.Name === "Root") {
						const rootHinge = new Instance("HingeConstraint", constraintsFolder);
						rootHinge.Name = "RootHinge";
						rootHinge.LimitsEnabled = true;
						rootHinge.LowerAngle = 0;
						rootHinge.UpperAngle = 0;

						const att0 = new Instance("Attachment", character.WaitForChild("UpperTorso"));
						att0.Name = "RootAttachment0";
						const att1 = new Instance("Attachment", joint.Part0);
						att1.Name = "RootAttachment1";

						rootHinge.Attachment0 = att0;
						rootHinge.Attachment1 = att1;
					} else {
						const ballSocket = new Instance("BallSocketConstraint", constraintsFolder);
						ballSocket.Name = joint.Name + " Socket";
						ballSocket.Enabled = true;
						ballSocket.LimitsEnabled = true;
						ballSocket.TwistLimitsEnabled = true;

						let jointName;
						if (string.find(joint.Name, "Right")[0]) {
							jointName = string.split(joint.Name, "Right")[1];
						} else if (string.find(joint.Name, "Left")[0]) {
							jointName = string.split(joint.Name, "Left")[1];
						} else {
							jointName = joint.Name;
						}

						const jointConfig = r15ConstraintsConfig[jointName];
						ballSocket.UpperAngle = jointConfig.UpperAngle;
						ballSocket.TwistLowerAngle = jointConfig.TwistLowerAngle;
						ballSocket.TwistUpperAngle = jointConfig.TwistUpperAngle;

						const att0 = new Instance("Attachment", joint.Part0);
						att0.Name = joint.Part1.Name + " Attachment0";
						att0.CFrame = joint.C0;

						const att1 = new Instance("Attachment", joint.Part1);
						att1.Name = joint.Part1.Name + " Attachment1";
						att1.CFrame = joint.C1;

						ballSocket.Attachment0 = att0;
						ballSocket.Attachment1 = att1;
					}
				}

				humanoid.RootPart!.CanCollide = false;
				(character.WaitForChild("Head") as BasePart).CanCollide = true;
			});
		}
	}

	export function toggleJoints(character: Model, toggle: boolean) {
		for (const [, joint] of pairs(character.GetDescendants())) {
			if (!joint.IsA("Motor6D")) continue;
			joint.Enabled = toggle;
		}
	}
}

const setPlayerRagdoll = (humanoid: Humanoid, enabled: boolean) =>
	humanoid.SetAttribute(SharedRagdoll.ragdollAttributeName, enabled);

class RagdollWhenSpeedQuicklyChanges extends HostedService {
	constructor(difference: number) {
		super();

		const funcs = new Map<Player, () => void>();

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onHumanoidAdded((humanoid, _, player) => {
				let prevSpeed: number | undefined;

				const stop = this.event.loop(0, () => {
					if (!humanoid.RootPart) return;
					if (humanoid.Sit) return;

					const newspeed = humanoid.RootPart.AssemblyLinearVelocity.Magnitude;
					if (prevSpeed === undefined) {
						prevSpeed = newspeed;
						return;
					}

					const diff = math.abs(newspeed - prevSpeed);
					prevSpeed = newspeed;

					if (diff < difference) return;

					setPlayerRagdoll(humanoid, true);
				});

				funcs.set(player, stop);
				humanoid.Died.Once(stop);
			}),
		);
	}
}

class RagdollWhenFasterThan extends HostedService {
	constructor(speed: number) {
		super();

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onHumanoidAdded((humanoid) => {
				humanoid.FreeFalling.Connect(() => {
					if (
						!humanoid.RootPart ||
						humanoid.Sit ||
						humanoid.RootPart.Velocity.Magnitude < speed ||
						humanoid.GetState() !== Enum.HumanoidStateType.Freefall
					) {
						return;
					}

					setPlayerRagdoll(humanoid, true);
				});
			}),
		);
	}
}
const createRagdollSettings = (host: GameHostBuilder) => {
	return {
		ragdollWhenSpeedQuicklyChanges(difference: number) {
			host.services.registerService(RagdollWhenSpeedQuicklyChanges).withArgs([difference]);
			return this;
		},
		ragdollWhenSpeedIsMoreThan(speed: number) {
			host.services.registerService(RagdollWhenFasterThan).withArgs([speed]);
			return this;
		},
	} as const;
};

export class RagdollController extends HostedService {
	static initialize(host: GameHostBuilder, setup: (o: ReturnType<typeof createRagdollSettings>) => void): void {
		host.services.registerService(this);
		setup(createRagdollSettings(host));
	}

	constructor() {
		super();

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onHumanoidAdded((humanoid, character) => {
				humanoid.BreakJointsOnDeath = false;
				humanoid.RequiresNeck = false;

				humanoid.GetAttributeChangedSignal(SharedRagdoll.ragdollAttributeName).Connect(() => {
					RagdollModule.toggleJoints(
						character,
						humanoid.GetAttribute(SharedRagdoll.ragdollAttributeName) !== true,
					);

					if (humanoid.GetState() === Enum.HumanoidStateType.Dead) {
						return;
					}

					task.spawn(() => {
						task.wait(2);
						while (character.PrimaryPart!.AssemblyLinearVelocity.Magnitude > 10) {
							task.wait();
						}

						setPlayerRagdoll(humanoid, false);
					});
				});

				RagdollModule.createJoints(character);
				setPlayerRagdoll(humanoid, false);

				humanoid.Died.Connect(() => {
					humanoid.AutoRotate = false;
					setPlayerRagdoll(humanoid, true);
				});
			}),
		);
	}
}
