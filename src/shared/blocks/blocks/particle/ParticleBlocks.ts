import { RunService } from "@rbxts/services";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type {
	BlockLogicFullBothDefinitions,
	BlockLogicFullInputDef,
	InstanceBlockLogicArgs,
} from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const defaultParticleID = "14198353638";

namespace ParticleEmitter {
	const definition = {
		input: {
			particle: {
				displayName: "Configured particle",
				types: {
					particle: {
						config: {
							particleID: defaultParticleID,
						},
					},
				},
				configHidden: true,
			},
			enabled: {
				displayName: "Enabled",
				types: {
					bool: {
						config: true,
					},
				},
			},
			emit: {
				// this was added
				displayName: "Emit",
				types: {
					bool: {
						config: false,
					},
				},
			},
		},
		output: {},
	} satisfies BlockLogicFullBothDefinitions;

	type particleEmitter = BlockModel & {
		Body: {
			ParticleEmitter: ParticleEmitter;
		};
	};

	type UpdateData = t.Infer<typeof updateDataType>;
	const updateDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
		properties: t.any.as<BlockLogicTypes.ParticleValue>(),
	});

	type EmitData = t.Infer<typeof emitDataType>;
	const emitDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
	});

	type EnableData = t.Infer<typeof enableDataType>;
	const enableDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
		enabled: t.boolean,
	});

	const updateParametersFunc = ({ properties, block }: UpdateData) => {
		const emitter = block.Body.ParticleEmitter;
		emitter.Texture = `rbxassetid://${properties.particleID}`;
		if (properties.rate) emitter.Rate = properties.rate;
		if (properties.flipbookLayout)
			emitter.FlipbookLayout = Enum.ParticleFlipbookLayout[properties.flipbookLayout as never];
		if (properties.speed) emitter.Speed = new NumberRange(properties.speed);
		if (properties.acceleration) emitter.Acceleration = properties.acceleration;
		if (properties.color) emitter.Color = new ColorSequence(properties.color);
		if (properties.lifetime)
			emitter.Lifetime = new NumberRange(properties.lifetime * 0.95, properties.lifetime * 1.05);
		if (properties.rotation) emitter.Rotation = new NumberRange(properties.rotation);
		if (properties.rotationSpeed) emitter.RotSpeed = new NumberRange(properties.rotationSpeed);
		if (properties.squash) emitter.Squash = new NumberSequence(properties.squash);
		if (properties.transparency) emitter.Transparency = new NumberSequence(properties.transparency);
		if (properties.spreadAngle)
			emitter.SpreadAngle = new Vector2(properties.spreadAngle.X, properties.spreadAngle.Y);
		if (properties.velocityInheritance) emitter.VelocityInheritance = properties.velocityInheritance;
		if (properties.lockedToPart) emitter.LockedToPart = properties.lockedToPart;
		if (properties.orientation) emitter.Orientation = Enum.ParticleOrientation[properties.orientation as never];
		if (properties.brightness) emitter.Brightness = properties.brightness;
		if (properties.timeScale) emitter.TimeScale = properties.timeScale;
		if (properties.size) emitter.Size = new NumberSequence(properties.size);
		if (properties.drag) emitter.Drag = properties.drag;

		if (properties.emissionDirection)
			emitter.EmissionDirection = Enum.NormalId[properties.emissionDirection as never];
		if (properties.shape) emitter.Shape = Enum.ParticleEmitterShape[properties.shape as never];
		if (properties.shapeInOut) emitter.ShapeInOut = Enum.ParticleEmitterShapeInOut[properties.shapeInOut as never];
		if (properties.shapeStyle) emitter.ShapeStyle = Enum.ParticleEmitterShapeStyle[properties.shapeStyle as never];
	};

	const emitState = ({ block }: EmitData) => {
		const emitter = block.Body.ParticleEmitter;
		emitter.Emit(1);
	};

	const enableState = ({ block, enabled }: EnableData) => {
		const emitter = block.Body.ParticleEmitter;
		emitter.Enabled = enabled;
	};

	export class Logic extends InstanceBlockLogic<typeof definition, particleEmitter> {
		static readonly events = {
			updateParameters: new BlockSynchronizer<UpdateData>(
				"particle_update",
				updateDataType,
				updateParametersFunc,
			),
			emit: new BlockSynchronizer<EmitData>("particle_emit", emitDataType, emitState),
			enable: new BlockSynchronizer<EnableData>("particle_enable", enableDataType, enableState),
		} as const;

		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			const emitNode = this.initializeInputCache("emit");

			this.event.subscribe(RunService.Heartbeat, () => {
				if (!updateNextTick) return;
				updateNextTick = false;
				if (emitNode.get()) Logic.events.emit.send({ block: this.instance });
			});

			let updateNextTick = false;
			this.onTicc(() => (updateNextTick = true));

			this.onk(["enabled"], ({ enabled }) =>
				Logic.events.enable.sendOrBurn(
					{
						block: this.instance,
						enabled,
					},
					this,
				),
			);

			this.onk(["particle"], ({ particle }) =>
				Logic.events.updateParameters.sendOrBurn(
					{
						block: this.instance,
						properties: particle,
					},
					this,
				),
			);

			this.onDisable(() => {
				Logic.events.enable.sendOrBurn({ block: this.instance, enabled: false }, this);
			});
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: "particleemitter",
		displayName: "Particle Emitter",
		description: `Spawns various prepared particles.`,

		limit: 20,

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace ParticleCreator {
	const cnum = (config: number) => ({ number: { config } });
	const cnumrange = (config: number, min: number, max: number) => ({
		number: {
			config,
			clamp: {
				min,
				max,
				step: 0.01,
				showAsSlider: true,
			},
		},
	});
	const defaultNum = cnum(0);
	const defaultBool = { bool: { config: false } };
	const defaultVec = { vector3: { config: Vector3.zero } };
	const defaultNumRange = cnumrange(0, 0, 1);

	const stringIdType = {
		string: {
			config: defaultParticleID,
		},
	};

	const inpCreate = (displayName: string, description: string, types: BlockLogicFullInputDef["types"]) => ({
		displayName,
		description,
		types,
	});

	const enumOptionGenerate = (base: string, options: string[]) => {
		const res: Record<string, { displayName: string }> = {};
		for (const v of options) res[v] = { displayName: `${base} ${v}` };
		return res;
	};

	const definition = {
		inputOrder: [
			"particleID",
			"color",
			"size",
			"speed",
			"rate",
			"lifetime",
			"rotation",
			"rotationSpeed",
			"transparency",
			"orientation",
			"squash",
			"acceleration",
			"spreadAngle",
			"velocityInheritance",
			"flipbookLayout",
			"brightness",
			"drag",
			"timeScale",
			"lockedToPart",
			"emissionDirection",
			"shape",
			"shapeInOut",
			"shapeStyle",
		] as const satisfies (keyof BlockLogicTypes.ParticleValue | "particleID")[],
		input: {
			particleID: inpCreate("Particle", "ID of the particle.", stringIdType),
			rotation: inpCreate("Rotation", "The rotation. Speaks for itself", defaultNum),
			rotationSpeed: inpCreate("Rotation Speed", "How fast your particles will rotate", defaultNum),
			transparency: inpCreate("Transparency", "It's like opaque-ness but the other way around", defaultNumRange),
			color: inpCreate("Color", "The color of the spawned particles", { color: { config: Colors.white } }),
			squash: inpCreate("Squash", "How squashed will the particles be", defaultNum),
			lifetime: inpCreate("Lifetime", "How long will your particle exist until despawning", cnum(5)),
			acceleration: inpCreate("Acceleration", "The acceleration of the spawned partice", defaultVec),
			speed: inpCreate("Particle Speed", "The speed. Ka-Chau.", cnum(2)),
			rate: inpCreate("Spawn Rate", "How often the particles will spawn", cnum(5)),
			brightness: inpCreate("Brightness", "How bright the particle's texture is", cnum(1)),
			size: inpCreate("Size", "The size of the partice", cnum(1)),
			drag: inpCreate("Drag", "How fast the particle will decelerate", defaultNum),
			velocityInheritance: inpCreate("Velocity Inheritance", "", defaultNum),
			timeScale: inpCreate("Time Scale", "The speed of animation of the particle.", cnumrange(1, 0, 1)),
			spreadAngle: inpCreate(
				"Spread Angle",
				"The direction particles will spread. Z-axis isn't used.",
				defaultVec,
			),
			lockedToPart: inpCreate(
				"Locked To Part",
				"Determines if the particle gets affected by the spawner's movement",
				defaultBool,
			),
			flipbookLayout: inpCreate("Flipbook Layout", "idk ask the internet", {
				enum: {
					config: "None",
					elements: {
						None: { displayName: "None" },
						Grid2x2: { displayName: "Grid 2x2" },
						Grid4x4: { displayName: "Grid 4x4" },
						Grid8x8: { displayName: "Grid 8x8" },
					},
					elementOrder: ["None", "Grid2x2", "Grid4x4", "Grid8x8"],
				},
			}),
			orientation: inpCreate("Orientation", "Which way the paricle will be facing", {
				enum: {
					config: "FacingCamera",
					elements: {
						FacingCamera: { displayName: "Facing Camera" },
						FacingCameraWorldUp: { displayName: "Facing Camera World Up" },
						VelocityParallel: { displayName: "Velocity Parallel" },
						VelocityPerpendicular: { displayName: "Velocity Perpendicular" },
					},
					elementOrder: ["FacingCamera", "FacingCameraWorldUp", "VelocityParallel", "VelocityPerpendicular"],
				},
			}),
			emissionDirection: inpCreate("Emission Direction", "Which way the paricle will be facing", {
				enum: {
					config: "Top",
					elements: enumOptionGenerate("Emissions facing", [
						"Top",
						"Bottom",
						"Front",
						"Back",
						"Left",
						"Right",
					]),
					elementOrder: ["Top", "Bottom", "Front", "Back", "Left", "Right"],
				},
			}),
			shape: inpCreate("Emission Shape", "Kinda hard to explain. Check it out yourself.", {
				enum: {
					config: "Box",
					elements: enumOptionGenerate("Shape -", ["Box", "Cylinder", "Disc", "Sphere"]),
					elementOrder: ["Box", "Cylinder", "Disc", "Sphere"],
				},
			}),
			shapeInOut: inpCreate("Shape In/Out", "Determines if the particle will be emitted inwards or outwards", {
				enum: {
					config: "Outward",
					elements: enumOptionGenerate("Emits ", ["InAndOut", "Inward", "Outward"]),
					elementOrder: ["InAndOut", "Inward", "Outward"],
				},
			}),
			shapeStyle: inpCreate("Shape style", "Determines how particles will spread around", {
				enum: {
					config: "Volume",
					elements: enumOptionGenerate("Follow", ["Volume", "Surface"]),
					elementOrder: ["Volume", "Surface"],
				},
			}),
		} satisfies { [k in keyof BlockLogicTypes.ParticleValue]: BlockLogicFullInputDef },
		output: {
			output: {
				displayName: "Output particle",
				types: ["particle"],
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	class Logic extends InstanceBlockLogic<typeof definition> {
		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			this.on((arg) => {
				const res = {} as Record<string, unknown>;
				for (const [k, v] of pairs(this.definition.input)) {
					res[k] = arg[k];
				}
				this.output.output.set("particle", res as BlockLogicTypes.ParticleValue);
			});
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: `particlecreator`,
		displayName: `Particle Creator`,
		description: `Creates the particle. Pass the result of the configuration to ${ParticleEmitter.Block.displayName}!`,

		logic: { definition, ctor: Logic },
	};
}

export type ParticleEmitterBlockLogic = typeof ParticleEmitter.Logic;
export const ParticleBlocks: readonly BlockBuilder[] = [ParticleCreator.Block, ParticleEmitter.Block];
