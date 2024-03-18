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

const versions = [v1, v2, v3, v4] as const;
const current = versions[versions.size() - 1] as typeof versions extends readonly [...unknown[], infer T] ? T : never;

export const PlayerConfigUpdater = {
	update(config: object | { readonly version: number }) {
		const version = "version" in config ? config.version : 1;

		for (let i = version + 1; i <= current.version; i++) {
			const newver = versions.find((v) => v.version === i);
			if (!newver || !("update" in newver)) continue;

			config = newver.update(config as never);
		}

		return config as ReturnType<(typeof current)["update"]>;
	},
} as const;
