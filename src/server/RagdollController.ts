import { Debris } from "@rbxts/services";
import { Instances } from "shared/fixes/Instances";
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

const { isPlayerRagdolling, setPlayerRagdoll } = SharedRagdoll;

function initSounds(): RBXScriptConnection {
	const impacts = Instances.assets.WaitForChild("Effects").WaitForChild("RagdollImpact");

	function init(humanoid: Humanoid, character: Model) {
		function canHit(part: BasePart, hit: BasePart) {
			if (!part?.Parent || !hit?.Parent) return false;
			if (!hit.CanCollide) return false;
			if (hit.IsDescendantOf(character)) return false;
			if (hit.Parent?.FindFirstChildOfClass("Humanoid")) return false;

			return true;
		}

		let debounce = true;
		const debounceTime = 0.25;
		for (const part of character.GetChildren()) {
			if (!part.IsA("BasePart")) continue;

			part.Touched.Connect((hit) => {
				if (!debounce) return;
				if (!isPlayerRagdolling(humanoid)) return;
				if (part.AssemblyLinearVelocity.Magnitude < 5) return;
				if (!canHit(part, hit)) return;

				debounce = false;

				const volume = math.min(part.AssemblyLinearVelocity.Magnitude / 50, 5);
				const impact = impacts.GetChildren()[math.random(0, impacts.GetChildren().size() - 1)].Clone() as Sound;
				impact.Parent = part;
				impact.Volume = volume;
				impact.Play();

				Debris.AddItem(impact, 5);
				task.delay(debounceTime, () => (debounce = true));
			});
		}
	}

	return PlayerWatcher.onHumanoidAdded(init);
}
function initRagdollMain(): RBXScriptConnection {
	return PlayerWatcher.onHumanoidAdded((humanoid, character, player) => {
		humanoid.BreakJointsOnDeath = false;

		RagdollModule.createJoints(character);
		setPlayerRagdoll(humanoid, false);

		SharedRagdoll.subscribeToPlayerRagdollChange(humanoid, () =>
			RagdollModule.toggleJoints(character, !isPlayerRagdolling(humanoid)),
		);

		humanoid.Seated.Connect((active) => {
			if (!active) return;
			setPlayerRagdoll(humanoid, false);
		});
		humanoid.Ragdoll.Connect((active) => {
			if (!active) return;
			setPlayerRagdoll(humanoid, true);
		});
		humanoid.Died.Connect(() => {
			humanoid.AutoRotate = false;
			setPlayerRagdoll(humanoid, true);
			humanoid.UnequipTools();
		});
	});
}

export class RagdollController extends HostedService {
	constructor() {
		super();

		this.event.subscribeRegistration(initSounds);
		this.event.subscribe(SharedRagdoll.event.invoked, (player, ragdoll) => {
			const humanoid = player.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
			if (!humanoid || humanoid.Sit) return;

			setPlayerRagdoll(humanoid, ragdoll);
		});

		this.event.subscribeRegistration(initRagdollMain);
	}
}
