export namespace TagUtils {
	export const allTags = {
		ANCHORED: "ANCHORED",

		IMPACT_STRONG: "ImpactProof",
		IMPACT_UNBREAKABLE: "ImpactProof",

		FIREPROOF_MATERIAL: "fireproof",
		LAVAPROOF_MATERIAL: "LAVAPROOF",
		OBSTACLEPROOF_MATERIAL: "OBSTACLEPROOF",

		TRANSPARENT_MATERIAL: "TRANSPARENT",
		STATIC_MATERIAL: "STATIC_MATERIAL",
		STATIC_COLOR: "STATIC_COLOR",

		PLAYER_LOADED: "Loaded",
		GAME_LOADED: "GameLoaded",

		BLOCK_UNSCALABLE: "UNSCALABLE",
		BLOCK_NONCOLLIDABLE: "NONCOLLIDABLE",

		SPECIAL_RADARVIEW: "RADARVIEW",
	} as const;

	const tagSet = new Set();
	for (const [k, v] of pairs(allTags)) tagSet.add(v);

	export const isASystemTag = (tag: string) => tagSet.has(tag);
}
