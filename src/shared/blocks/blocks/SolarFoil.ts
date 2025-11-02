import { RunService } from "@rbxts/services";
//import { Instances } from "engine/shared/fixes/Instances";
//import { Strings } from "engine/shared/fixes/String.propmacro";
//import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
//import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
//import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		strength: {
			displayName: "Strength",
			types: {
				number: {
					config: 100,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 10,
						step: 1,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as SpeedometerBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const getLocalPos = (pos: Vector3) => this.instance.GetPivot().Rotation.ToObjectSpace(new CFrame(pos)).Position;

		const localVelocity = {
			linear: Vector3.zero,
			angular: Vector3.zero,
		};

		this.event.subscribe(RunService.PostSimulation, () => {
			if (!this.instance.PrimaryPart) {
				this.disable();
				return;
			}

			/*const l1 = getLocalPos(this.instance.PrimaryPart.AssemblyLinearVelocity);
			const l2 = getLocalPos(this.instance.PrimaryPart.AssemblyAngularVelocity);

			this.output.linearAcceleration.set("vector3", l1.sub(localVelocity.linear));
			this.output.angularAcceleration.set("vector3", l2.sub(localVelocity.angular));

			this.output.linear.set("vector3", (localVelocity.linear = l1));
			this.output.angular.set("vector3", (localVelocity.angular = l2));*/
			print("Hello i am solar foil");
		});
	}
}

export const SolarFoil = {
	...BlockCreation.defaults,
	id: "solarfoil",
	displayName: "Solar foil",
	description: "Generates movement force in sunlight outside the atmosphere and await death like my sanity.",
	search: {
		partialAliases: ["sun", "solar", "force"],
	},

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("GenericLogicBlockPrefab", "Edge Detector"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
