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
type ChangedChange = {
	readonly type: "changed";
	readonly key: keyof DiffBlock;
	readonly before: DiffBlock;
	readonly after: DiffBlock;
};

export type BuildingDiffChange = RemovedChange | AddedChange | ChangedChange;

export namespace BuildingDiffer {
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

			for (const [key, valbefore] of pairs(before)) {
				const valafter = after[key];
				if (valbefore !== valafter) {
					changes.push({ type: "changed", key, before, after });
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
