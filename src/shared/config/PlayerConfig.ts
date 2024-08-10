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
		readonly fov: number;
	};
	type GraphicsConfiguration = {
		readonly localShadows: boolean;
		readonly othersShadows: boolean;
		readonly othersEffects: boolean;
	};

	type VisualsSelectionBox = {
		readonly borderColor: Color3;
		readonly borderTransparency: number;
		readonly borderThickness: number;
		readonly surfaceColor: Color3;
		readonly surfaceTransparency: number;
	};
	type VisualsConfiguration = {
		readonly selection: VisualsSelectionBox;
		readonly multiSelection: VisualsSelectionBox;
	};

	type TerrainConfiguration = {
		readonly kind: "Classic" | "Triangle" | "Flat" | "Water";
		readonly resolution: number;
		readonly foliage: boolean;
		readonly loadDistance: number;
		readonly water: boolean;
		readonly snowOnly: boolean;
		readonly triangleAddSandBelowSeaLevel: boolean;
	};
	type TutorialConfiguration = {
		readonly basics: boolean;
	};
	type RagdollConfiguration = {
		readonly autoFall: boolean;
		readonly triggerByKey: boolean;
		readonly triggerKey: KeyCode;
		readonly autoRecovery: boolean;
	};

	namespace PlayerConfigTypes {
		export type Bool = ConfigType<"bool", boolean>;
		export type Key = ConfigType<"key", KeyCode>;
		export type Number = ConfigType<"number", number>;
		export type Color = ConfigType<"color", Color3>;
		export type Dropdown<T extends string = string> = ConfigType<"dropdown", T> & {
			readonly items: readonly T[];
		};
		export type ClampedNumber = ConfigType<"clampedNumber", number> & {
			readonly min: number;
			readonly max: number;
			readonly step: number;
		};
		export type DayCycle = ConfigType<"dayCycle", DayCycleConfiguration>;
		export type Beacons = ConfigType<"beacons", BeaconsConfiguration>;
		export type Camera = ConfigType<"camera", CameraConfiguration>;
		export type Graphics = ConfigType<"graphics", GraphicsConfiguration>;
		export type Visuals = ConfigType<"visuals", VisualsConfiguration>;
		export type Terrain = ConfigType<"terrain", TerrainConfiguration>;
		export type Tutorial = ConfigType<"tutorial", TutorialConfiguration>;
		export type Ragdoll = ConfigType<"ragdoll", RagdollConfiguration>;

		export interface Types {
			readonly bool: Bool;
			readonly number: Number;
			readonly color: Color;
			readonly key: Key;
			readonly dropdown: Dropdown;
			readonly clampedNumber: ClampedNumber;
			readonly dayCycle: DayCycle;
			readonly beacons: Beacons;
			readonly camera: Camera;
			readonly graphics: Graphics;
			readonly visuals: Visuals;
			readonly terrain: Terrain;
			readonly tutorial: Tutorial;
			readonly ragdoll: Ragdoll;
		}

		export type Definitions = ConfigTypesToDefinition<keyof Types, Types>;
	}

	type PlayerConfig = ConfigDefinitionsToConfig<keyof PlayerConfigDefinition, PlayerConfigDefinition>;

	type PlayerConfigDefinition = typeof PlayerConfigDefinition;
}

export const PlayerConfigDefinition = {
	betterCamera: {
		displayName: "Camera",
		type: "camera",
		config: {
			improved: true as boolean,
			strictFollow: false as boolean,
			playerCentered: true as boolean,
			fov: 70 as number,
		},
	},
	graphics: {
		displayName: "Graphics",
		type: "graphics",
		config: {
			localShadows: true as boolean,
			othersShadows: true as boolean,
			othersEffects: true as boolean,
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
	dayCycle: {
		displayName: "Day cycle",
		type: "dayCycle",
		config: {
			automatic: false as boolean,
			/** Hours, 0-24 */
			manual: 14 as number,
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
	terrain: {
		displayName: "Terrain",
		type: "terrain",
		config: {
			kind: "Classic" as TerrainConfiguration["kind"],
			resolution: 8 as number,
			foliage: true as boolean,
			loadDistance: 24 as number,
			water: false as boolean,
			snowOnly: false as boolean,
			triangleAddSandBelowSeaLevel: false as boolean,
		},
	},
	tutorial: {
		displayName: "Tutorial",
		type: "tutorial",
		config: {
			basics: false as boolean,
		},
	},
	ragdoll: {
		displayName: "Ragdoll",
		type: "ragdoll",
		config: {
			autoFall: true,
			triggerByKey: false,
			triggerKey: "X",
			autoRecovery: true,
		},
	},
	visuals: {
		displayName: "Visuals",
		type: "visuals",
		config: {
			selection: {
				borderColor: Color3.fromRGB(13, 105, 172),
				borderTransparency: 0,
				borderThickness: 0.05,
				surfaceColor: Color3.fromRGB(13, 105, 172),
				surfaceTransparency: 1,
			},
			multiSelection: {
				borderColor: Color3.fromRGB(0, 127, 255),
				borderTransparency: 0,
				borderThickness: 0.05,
				surfaceColor: Color3.fromRGB(0, 127, 255),
				surfaceTransparency: 1,
			},
		},
	},
} as const satisfies ConfigTypesToDefinition<keyof PlayerConfigTypes.Types, PlayerConfigTypes.Types>;
