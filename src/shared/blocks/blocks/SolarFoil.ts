import { RunService, Workspace, Lighting } from "@rbxts/services";
//import { Instances } from "engine/shared/fixes/Instances";
//import { Strings } from "engine/shared/fixes/String.propmacro";
//import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
//import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
//import { BlockManager } from "shared/building/BlockManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type {
	BlockLogicFullBothDefinitions,
	GenericBlockLogic,
	InstanceBlockLogicArgs,
} from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const FORCE_MULTIPLIER = -20.5; // F = -ρ * A * v * CL, ~~ -(5 * 5.3 * 4)
const HEIGHT_FACTOR_EXPONENT = 2; // for h = 1 - (y/H)^exp
const MIN_HORIZONTAL_SPEED = 30; // Minimum horizontal speed for full lift (studs/sec) - lower for easier gliding

const definition = {
	input: {
		enabled: {
			displayName: "Strength",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
		strength: {
			displayName: "Strength",
			types: {
				number: {
					config: 100,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
						step: 1,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type WingBlock = BlockModel & {
	WingSurface:
		| BasePart
		| (UnionOperation & {
				VectorForce: VectorForce;
		  });
};

export type { Logic as SolarFoilLogic };
class Logic extends InstanceBlockLogic<typeof definition, WingBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
		this.onkFirstInputs(["enabled"], ({ enabled }) => {
			if (!enabled) {
				this.instance.WingSurface.EnableFluidForces = false;
				this.disable();
				return;
			}

			// Create force constraints
			const attachment = new Instance("Attachment", this.instance.WingSurface);
			const vectorForce = new Instance("VectorForce", this.instance.WingSurface);
			vectorForce.RelativeTo = Enum.ActuatorRelativeTo.Attachment0;
			vectorForce.Attachment0 = attachment;

			// Set up wing material properties
			const density = math.max(0.7, new PhysicalProperties(this.instance.WingSurface.Material).Density / 2);
			this.instance.WingSurface.CustomPhysicalProperties = new PhysicalProperties(density, 0.3, 0.5, 1, 1);

			// Calculate wing surface area and dimensions
			const wing = this.instance.WingSurface;
			const wingArea = wing.Size.X * wing.Size.Z;

			// Calculate effective surface vector based on wing type
			let effectiveSurface: Vector3;
			if (wing.IsA("WedgePart")) {
				// Wedge wings: area acts as lift, divided by 2 for balance
				const thickness = wing.Size.X;
				effectiveSurface = new Vector3(wingArea, thickness, thickness).div(2);
			} else {
				// Regular wings: area acts perpendicular to wing surface
				const thickness = wing.Size.Y;
				effectiveSurface = new Vector3(thickness, wingArea, thickness);
			}

			this.event.subscribe(RunService.Heartbeat, () => {
				if (!this.instance.FindFirstChild("WingSurface")) {
					return;
				}

				const wing = this.instance.WingSurface;

				// Step 1: Calculate effective velocity including rotation
				// Linear velocity component
				const linearVelocity = Lighting.GetSunDirection()
					.mul(math.clamp(Lighting.GetSunDirection().Y, 0, 1))
					.mul(10);

				// Angular velocity contribution: v = ω × r (cross product)
				// where r is the vector from center of mass to wing position
				const angularVelocity = Vector3.zero;
				const relativePosition = wing.Position.sub(wing.AssemblyCenterOfMass);
				const rotationalVelocity = angularVelocity.Cross(relativePosition);

				// Total effective velocity
				const effectiveVelocity = linearVelocity.add(rotationalVelocity);

				// Step 2: Calculate horizontal speed for lift scaling
				const horizontalVelocity = new Vector3(effectiveVelocity.X, 0, effectiveVelocity.Z);
				const horizontalSpeed = horizontalVelocity.Magnitude;

				// Gradual lift dropoff using smoothstep curve
				// Provides smooth transition from 0 to full lift
				const speedRatio = math.min(horizontalSpeed / MIN_HORIZONTAL_SPEED, 1);
				const speedFactor = speedRatio * speedRatio * (3 - 2 * speedRatio); // Smoothstep interpolation

				// Step 3: Convert to local space
				const relativeVelocity = wing.CFrame.PointToObjectSpace(wing.Position.add(effectiveVelocity));

				// Step 4: Reduce horizontal drag to prevent speed loss during gliding
				// Only apply force multiplier to vertical component (Y) for lift
				// Reduce horizontal components (X, Z) to minimize drag
				const HORIZONTAL_DRAG_REDUCTION = 0.01; // Reduce horizontal drag by 99%
				const adjustedVelocity = new Vector3(
					relativeVelocity.X * HORIZONTAL_DRAG_REDUCTION,
					relativeVelocity.Y, // Full vertical component for lift
					relativeVelocity.Z * HORIZONTAL_DRAG_REDUCTION,
				);

				// Step 5: Apply force multiplier to adjusted velocity
				const velocityForce = adjustedVelocity.mul(FORCE_MULTIPLIER);

				// Step 6: Calculate lift force based on effective surface
				const liftForce = effectiveSurface.mul(velocityForce);

				// Step 7: Scale lift by speed factor (less lift at low speeds)
				const scaledLiftForce = liftForce.mul(speedFactor);

				// Step 8: Average with previous force for stability
				const averagedForce = scaledLiftForce.add(vectorForce.Force).div(2);

				// Step 9: Apply height factor (force density increases with altitude)
				const heightFactor = math.clamp(
					math.pow(
						(wing.Position.Y - GameDefinitions.HEIGHT_OFFSET) / GameEnvironment.ZeroAirHeight,
						HEIGHT_FACTOR_EXPONENT,
					),
					0,
					1,
				);

				// Step 10: Apply final force
				const finalForce = averagedForce.mul(heightFactor).mul(0.1);

				vectorForce.Enabled = finalForce.Magnitude > Workspace.Gravity * wing.Mass;
				vectorForce.Force = finalForce;
			});
		});
	}

	initializeInputs(config: PlacedBlockConfig, allBlocks: ReadonlyMap<BlockUuid, GenericBlockLogic>): void {
		super.initializeInputs(config, allBlocks);
	}
}

export const SolarFoil = {
	...BlockCreation.defaults,
	id: "solarfoil",
	displayName: "Solar foil",
	description: "Generates movement force in sunlight outside the atmosphere and spin *forever like my sanity.",
	search: {
		partialAliases: ["sun", "solar", "force"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
