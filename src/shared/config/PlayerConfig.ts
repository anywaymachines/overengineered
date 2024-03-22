declare global {
	type DayCycleConfiguration = {
		readonly automatic: boolean;
		readonly manual: number;
	};
	type BeaconsConfiguration = {
		readonly plot: boolean;
		readonly players: boolean;
	};
	type CameraConfiguration = {
		readonly improved: boolean;
		readonly strictFollow: boolean;
		readonly playerCentered: boolean;
	};
	type GraphicsConfiguration = {
		readonly localShadows: boolean;
		readonly othersShadows: boolean;
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
		export type Camera = ConfigType<"camera", CameraConfiguration>;
		export type Graphics = ConfigType<"graphics", GraphicsConfiguration>;

		export interface Types {
			readonly bool: Bool;
			readonly number: Number;
			readonly clampedNumber: ClampedNumber;
			readonly dayCycle: DayCycle;
			readonly beacons: Beacons;
			readonly camera: Camera;
			readonly graphics: Graphics;
		}

		export type Definitions = ConfigTypesToDefinition<keyof Types, Types>;
	}

	type PlayerConfig = ConfigDefinitionsToConfig<keyof PlayerConfigDefinition, PlayerConfigDefinition>;

	type PlayerConfigDefinition = typeof PlayerConfigDefinition;
}

export const PlayerConfigDefinition = {
	betterCamera: {
		displayName: "Better camera",
		type: "camera",
		config: {
			improved: false as boolean,
			strictFollow: false as boolean,
			playerCentered: false as boolean,
		},
	},
	graphics: {
		displayName: "Graphics",
		type: "graphics",
		config: {
			localShadows: false as boolean,
			othersShadows: false as boolean,
		},
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
		displayName: "Terrain Foliage",
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
	uiScale: {
		displayName: "UI scale",
		type: "clampedNumber",
		config: 1 as number,
		min: 0.5,
		max: 1.5,
		step: 0.01,
	},
} as const satisfies ConfigTypesToDefinition<keyof PlayerConfigTypes.Types, PlayerConfigTypes.Types>;
