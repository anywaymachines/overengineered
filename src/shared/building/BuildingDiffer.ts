import type { LatestSerializedBlock } from "shared/building/BlocksSerializer";

export type DiffBlock = Replace<LatestSerializedBlock, "uuid", string>;

type RemovedChange = {
	readonly type: "removed";
	readonly uuid: DiffBlock["uuid"];
};
type AddedChange = {
	readonly type: "added";
	readonly block: DiffBlock;
};
type ConfigChangedChange = {
	readonly type: "configChanged";
	readonly uuid: DiffBlock["uuid"];
	readonly key: string;
	readonly value: object | Partial<BlockConfigTypes.Types[keyof BlockConfigTypes.Types]["config"]> | undefined;
};

export type BuildingDiffChange = RemovedChange | AddedChange | ConfigChangedChange;

export namespace BuildingDiffer {
	function deepEquals(left: object, right: object): boolean {
		for (const [kl] of pairs(left)) {
			if (!(kl in right)) {
				return false;
			}

			if (!valueEquals(left[kl], right[kl])) {
				return false;
			}
		}
		for (const [kr] of pairs(right)) {
			if (!(kr in left)) {
				return false;
			}
		}

		return true;
	}
	export function valueEquals(left: unknown, right: unknown): boolean {
		if (typeOf(left) !== typeOf(right)) {
			return false;
		}

		if (typeIs(left, "table")) {
			assert(typeIs(right, "table"));
			return deepEquals(left, right);
		}

		return left === right;
	}

	export function diff(before: readonly DiffBlock[], after: readonly DiffBlock[]): BuildingDiffChange[] {
		const beforeMap = before.mapToMap((block) => $tuple(block.uuid, block));
		const afterMap = after.mapToMap((block) => $tuple(block.uuid, block));

		const changes: BuildingDiffChange[] = [];
		for (const [uuid, before] of beforeMap) {
			const after = afterMap.get(uuid);
			if (!after) {
				changes.push({ type: "removed", uuid: before.uuid });
				continue;
			}

			{
				const cfgbefore = before.config ?? {};
				const cfgafter = after.config ?? {};

				for (const [key, vbefore] of pairs(cfgbefore)) {
					if (!(key in cfgafter)) {
						changes.push({ type: "configChanged", uuid, key, value: undefined });
						continue;
					}

					const vafter = cfgafter[key];
					if (!valueEquals(vbefore, vafter)) {
						changes.push({ type: "configChanged", uuid, key, value: vafter });
						continue;
					}
				}
				for (const [key, vafter] of pairs(cfgafter)) {
					if (!(key in cfgbefore)) {
						changes.push({ type: "configChanged", uuid, key, value: vafter });
						continue;
					}
				}
			}
		}

		for (const [uuid, after] of afterMap) {
			const before = beforeMap.get(uuid);
			if (!before) {
				changes.push({ type: "added", block: after });
				continue;
			}
		}

		return changes;
	}
}
