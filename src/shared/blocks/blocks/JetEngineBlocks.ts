import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { Physics } from "shared/Physics";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";
import type { SoundEffect } from "shared/effects/SoundEffect";

const definition = {
	inputOrder: ["thrust", "strength"],
	input: {
		thrust: {
			displayName: "Thrust",
			unit: "Percentage",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: 0,
						max: 100,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "smooth",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									speed: 20,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "W", value: 100 },
								{ key: "S", value: 0 },
							],
						},
					},
				},
			},
		},
		strength: {
			displayName: "Strength",
			unit: "Percentage",
			types: {
				number: {
					config: 100,
					clamp: {
						showAsSlider: true,
						max: 100,
						min: 0,
					},
				},
			},
		},
	},
	output: {
		maxpower: {
			displayName: "Force",
			unit: "Rowtons",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type JetModel = BlockModel & {
	readonly TurbineShaft: MeshPart & {
		readonly Working: Sound;
		readonly Idle: Sound;
		readonly Start: Sound;
		readonly Shut: Sound;
		readonly HingeConstraint: HingeConstraint;
	};
	readonly TurbineBody: (UnionOperation | Part | MeshPart) & {
		readonly VectorForce: VectorForce;
		readonly BladeLocation: Attachment;
	};
	readonly ColBox: Part;
};

export type { Logic as JetBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, JetModel> {
	// Instances
	private readonly vectorForce;

	// Math
	private readonly basePower = 30_000;
	private readonly maxPower;

	constructor(
		block: InstanceBlockLogicArgs,
		@inject private readonly soundEffect: SoundEffect,
	) {
		super(definition, block);

		// const
		const maxSoundVolume = 0.5;

		// vals
		const thrust = this.initializeInputCache("thrust");

		// Instances
		const colbox = this.instance.ColBox;
		const shaft = this.instance.TurbineShaft;
		const body = this.instance.TurbineBody;
		// const hinge = shaft.HingeConstraint;

		this.vectorForce = body.VectorForce;

		// Sounds
		const wSound = shaft.Working;
		const iSound = shaft.Idle;
		const stSound = shaft.Start;
		const shSound = shaft.Shut;
		const soundStageArray = [stSound, shSound];

		// Math
		let multiplier = (colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 8;

		// The strength depends on the material
		const material = BlockManager.manager.material.get(this.instance);
		multiplier *= math.max(1, new PhysicalProperties(material).Density / 2);

		// Max power
		this.maxPower = this.basePower * multiplier;
		this.output.maxpower.set("number", this.maxPower);

		let playing: Sound = iSound;
		const stopOtherSoundAndPlayNewOne = (sound: Sound) => {
			if (playing === sound) return;

			this.soundEffect.send(this.instance.PrimaryPart!, {
				sound: playing,
				isPlaying: false,
				volume: playing.Volume,
			});

			this.soundEffect.send(this.instance.PrimaryPart!, {
				sound: sound,
				isPlaying: true,
				volume: playing.Volume,
			});

			playing = sound;
		};

		const magicThreshold = 0.2;
		const updateSound = (volume: number, currentThrust: number, previousThrust: number) => {
			const changed = currentThrust !== previousThrust;
			// update volume
			for (const s of soundStageArray) s.Volume = volume;

			if (!changed) return;
			this.soundEffect.send(this.instance.PrimaryPart!, {
				sound: iSound,
				isPlaying: true,
				volume: volume,
			});

			if (currentThrust > previousThrust) return stopOtherSoundAndPlayNewOne(stSound);
			return stopOtherSoundAndPlayNewOne(shSound);
		};

		const updateForce = (modifier: number) => {
			const gravModifier = Physics.GetAirDensityModifierOnHeight(
				Physics.LocalHeight.fromGlobal(this.instance.GetPivot().Y),
			);

			this.vectorForce.Force = new Vector3(
				this.maxPower * modifier * math.clamp(gravModifier - magicThreshold, 0, 1),
			);
		};

		let lastThrust = 0;
		let thrustPercent = 0;
		let strengthPercent = 0;
		this.onAlwaysInputs(({ thrust, strength }) => {
			//nan check
			if (typeIs(thrust, "number") && thrust !== thrust) return;

			//the code
			thrustPercent = thrust / 100;
			strengthPercent = strength / 100;

			updateForce(thrustPercent * strengthPercent);
			updateSound(thrustPercent * maxSoundVolume, thrust, lastThrust);

			lastThrust = thrust;
		});

		let rotationAccumulator = 0;
		this.event.subscribe(RunService.RenderStepped, (dt) => {
			rotationAccumulator += math.deg((thrust.get() ?? 0) * dt) % 360;
			const orn = body.BladeLocation.Orientation;
			body.BladeLocation.Orientation = new Vector3(orn.X, orn.Y, rotationAccumulator);
		});

		this.onDisable(() => {
			updateForce(0);
			updateSound(0, 0, 0);
			playing.Stop();
		});
	}
}

const search = { partialAliases: ["turbine", "engine", "military", "civil", "engine", "afterburner"] };
const logic: BlockLogicInfo = { definition, ctor: Logic };
const list: BlockBuildersWithoutIdAndDefaults = {
	jetenginecivil: {
		displayName: "Civil Jet Engine",
		description: "Engines your jet or whatever",
		logic,
		limit: 50,
		search,
	},
	jetenginemilitaryold: {
		displayName: "Military Jet Engine (Old Model)",
		description: "Long live military jet engine! ",
		logic,
		limit: 50,
		search,
	},
	jetenginemilitary: {
		displayName: "Military Jet Engine",
		description: "Engines your jet or whatever (military grade)",
		logic,
		limit: 50,
		search,
	},
};
export const JetEngineBlocks = BlockCreation.arrayFromObject(list);
