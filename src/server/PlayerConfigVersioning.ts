import { PlayerConfigDefinition } from "shared/config/PlayerConfig";

interface PlayerConfigVersion<TCurrent> {
	version: number;
}
interface UpdatablePlayerConfigVersion<TCurrent, TPrev> extends PlayerConfigVersion<TCurrent> {
	update(prev: Partial<TPrev>): Partial<TCurrent>;
}

type Replace<T, TKey extends keyof T, TValue> = Omit<T, TKey> & { readonly [k in TKey]: TValue };

type PlayerConfigV1 = {
	readonly version: number;

	readonly betterCamera: boolean;
	readonly music: boolean;
	readonly beacons: boolean;
	readonly impact_destruction: boolean;
	readonly others_gfx: boolean;
	readonly dayCycle: DayCycleConfiguration;
};
const v1: PlayerConfigVersion<PlayerConfigV1> = {
	version: 1,
};

type PlayerConfigV2 = Replace<PlayerConfigV1, "beacons", BeaconsConfiguration>;
const v2: UpdatablePlayerConfigVersion<PlayerConfigV2, PlayerConfigV1> = {
	version: 2,

	update(prev: Partial<PlayerConfigV1>): Partial<PlayerConfigV2> {
		return {
			...prev,
			version: this.version,
			beacons: {
				plot: prev.beacons ?? true,
				players: false,
			},
		};
	},
};

type PlayerConfigV3 = PlayerConfigV2 & { readonly terrainFoliage: boolean };
const v3: UpdatablePlayerConfigVersion<PlayerConfigV3, PlayerConfigV2> = {
	version: 3,

	update(prev: Partial<PlayerConfigV2>): Partial<PlayerConfigV3> {
		return {
			...prev,
			version: this.version,
			terrainFoliage: true,
		};
	},
};

type PlayerConfigV4 = Replace<PlayerConfigV3, "betterCamera", CameraConfiguration>;
const v4: UpdatablePlayerConfigVersion<PlayerConfigV4, PlayerConfigV3> = {
	version: 4,

	update(prev: Partial<PlayerConfigV3>): Partial<PlayerConfigV4> {
		return {
			...prev,
			version: this.version,
			betterCamera: {
				improved: prev.betterCamera ?? true,
				strictFollow: true,
				playerCentered: false,
			},
		};
	},
};

// Added graphics config
type PlayerConfigV5 = PlayerConfigV4 & { graphics: GraphicsConfiguration };
const v5: UpdatablePlayerConfigVersion<PlayerConfigV5, PlayerConfigV4> = {
	version: 5,

	update(prev: Partial<PlayerConfigV4>): Partial<PlayerConfigV5> {
		return {
			...prev,
			version: this.version,
			graphics: {
				localShadows: false,
				othersShadows: false,
				othersEffects: true,
			},
		};
	},
};

// Added terrain config
type PlayerConfigV6 = PlayerConfigV5 & { terrain: Omit<TerrainConfiguration, "loadDistance"> };
const v6: UpdatablePlayerConfigVersion<PlayerConfigV6, PlayerConfigV5> = {
	version: 6,

	update(prev: Partial<PlayerConfigV5>): Partial<PlayerConfigV6> {
		return {
			...prev,
			version: this.version,
			terrain: {
				...PlayerConfigDefinition.terrain.config,
				foliage: prev.terrainFoliage ?? true,
			},
		};
	},
};

// Added terrain load distance
type PlayerConfigV7 = PlayerConfigV6 & { terrain: TerrainConfiguration };
const v7: UpdatablePlayerConfigVersion<PlayerConfigV7, PlayerConfigV6> = {
	version: 7,

	update(prev: Partial<PlayerConfigV6>): Partial<PlayerConfigV7> {
		return {
			...prev,
			version: this.version,
			terrain: {
				...PlayerConfigDefinition.terrain.config,
				...prev.terrain,
			},
		};
	},
};

// Moved others_gfx to graphics
type PlayerConfigV8 = Omit<PlayerConfigV7, "others_gfx">;
const v8: UpdatablePlayerConfigVersion<PlayerConfigV8, PlayerConfigV7> = {
	version: 8,

	update(prev: Partial<PlayerConfigV7>): Partial<PlayerConfigV8> {
		return {
			...prev,
			version: this.version,
			graphics: {
				...PlayerConfigDefinition.graphics.config,
				...prev.graphics,
				othersEffects: prev.others_gfx ?? true,
			},
		};
	},
};

// Added tutorial
type PlayerConfigV9 = PlayerConfigV8 & { readonly tutorial: TutorialConfiguration };
const v9: UpdatablePlayerConfigVersion<PlayerConfigV9, PlayerConfigV8> = {
	version: 9,

	update(prev: Partial<PlayerConfigV8>): Partial<PlayerConfigV9> {
		return {
			...prev,
			version: this.version,
			tutorial: PlayerConfigDefinition.tutorial.config,
		};
	},
};

const versions = [v1, v2, v3, v4, v5, v6, v7, v8, v9] as const;
const current = versions[versions.size() - 1] as typeof versions extends readonly [...unknown[], infer T] ? T : never;

export namespace PlayerConfigUpdater {
	export function update(config: object | { readonly version: number }) {
		const version = "version" in config ? config.version : 1;

		for (let i = version + 1; i <= current.version; i++) {
			const newver = versions.find((v) => v.version === i);
			if (!newver || !("update" in newver)) continue;

			config = newver.update(config as never);
		}

		return config as ReturnType<(typeof current)["update"]>;
	}
}
