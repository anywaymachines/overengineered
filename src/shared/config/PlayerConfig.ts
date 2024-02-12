declare global {
	type DayCycleConfiguration = {
		readonly automatic: boolean;
		readonly manual: number;
	};
	type BeaconsConfiguration = {
		readonly plot: boolean;
		readonly players: boolean;
	};

	namespace PlayerConfigTypes {
		export type Bool = ConfigType<"bool", boolean>;
		export type Number = ConfigType<"number", number>;
		export type ClampedNumber = ConfigType<"clampedNumber", number> & {
			readonly min: number;
			readonly max: number;
			readonly step: number;
		};
		export type DayCycle = ConfigType<"dayCycle", DayCycleConfiguration>;
		export type Beacons = ConfigType<"beacons", BeaconsConfiguration>;

		export interface Types {
			readonly bool: Bool;
			readonly number: Number;
			readonly clampedNumber: ClampedNumber;
			readonly dayCycle: DayCycle;
			readonly beacons: Beacons;
		}

		export type Definitions = ConfigTypesToDefinition<keyof Types, Types>;
	}

	type PlayerConfig = ConfigDefinitionsToConfig<keyof PlayerConfigDefinition, PlayerConfigDefinition>;

	type PlayerConfigDefinition = typeof PlayerConfigDefinition;
}

export const PlayerConfigDefinition = {
	betterCamera: {
		displayName: "Better camera",
		type: "bool",
		config: true as boolean,
	},
	music: {
		displayName: "Music",
		type: "bool",
		config: true as boolean,
	},
	beacons: {
		displayName: "Beacons",
		type: "beacons",
		config: {
			plot: true as boolean,
			players: false as boolean,
		},
	},
	impact_destruction: {
		displayName: "Impact destruction",
		type: "bool",
		config: true as boolean,
	},
	others_gfx: {
		displayName: "Other's effects & sounds",
		type: "bool",
		config: true as boolean,
	},
	terrainFoliage: {
		displayName: "TODO: maks",
		type: "bool",
		config: true as boolean,
	},
	dayCycle: {
		displayName: "Day cycle",
		type: "dayCycle",
		config: {
			automatic: true as boolean,
			/** Hours, 0-24 */
			manual: 0 as number,
		},
	},
} as const satisfies ConfigTypesToDefinition<keyof PlayerConfigTypes.Types, PlayerConfigTypes.Types>;
