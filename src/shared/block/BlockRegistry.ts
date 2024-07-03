import type { Categories, Category } from "server/blockInit/BlocksInitializer";
import type { BlockMirrorBehaviour } from "shared/BlockDataRegistry";

declare global {
	type RegistryBlock = {
		readonly id: BlockId;
		readonly displayName: string;
		readonly info: string;
		readonly model: BlockModel;
		readonly category: CategoryPath;
		readonly required: boolean | undefined;
		readonly limit: number | undefined;
		readonly mirrorBehaviour: BlockMirrorBehaviour | undefined;
		readonly mirrorReplacementId: BlockId | undefined;

		readonly markerPositions: { readonly [name in BlockConnectionName]?: Vector3 };

		/** @server */
		readonly weldColliders: Model | undefined;
	};
}

export class BlockRegistry {
	readonly blocks: ReadonlyMap<BlockId, RegistryBlock>;
	readonly sorted: readonly RegistryBlock[];
	readonly required: readonly RegistryBlock[];
	readonly categories: Categories;

	constructor(blocks: readonly RegistryBlock[], newcategories: Categories) {
		this.blocks = blocks.mapToMap((b) => $tuple(b.id, b));
		this.sorted = [...blocks].sort((left, right) => left.id < right.id);
		this.required = this.sorted.filter((b) => b.required);
		this.categories = newcategories;
	}

	getCategoryByPath(path: CategoryPath): Category | undefined {
		let cat: Category | undefined = undefined;
		for (const part of path) {
			if (!cat) {
				cat = this.categories[part];
				continue;
			}

			cat = cat.sub[part];
			if (!cat) {
				return undefined;
			}
		}

		return cat;
	}

	getCategoryDescendands(category: Category): Category[] {
		const get = (category: Category): Category[] => asMap(category.sub).flatmap((k, v) => [v, ...get(v)]);
		return get(category);
	}

	getBlocksByCategory(path: CategoryPath): RegistryBlock[] {
		const sequenceEquals = <T>(left: readonly T[], right: readonly T[]): boolean => {
			if (left.size() !== right.size()) {
				return false;
			}

			for (let i = 0; i < left.size(); i++) {
				if (left[i] !== right[i]) {
					return false;
				}
			}

			return true;
		};

		const ret: RegistryBlock[] = [];
		for (const block of this.sorted) {
			if (block.category === path) {
				ret.push(block);
			} else if (sequenceEquals(block.category, path)) {
				path = block.category;
				ret.push(block);
			}
		}

		return ret;
	}
	getBlocksByCategoryRecursive(path: CategoryPath): RegistryBlock[] {
		const category = this.getCategoryByPath(path);
		if (!category) return [];

		const all = [category, ...this.getCategoryDescendands(category)];
		return all.flatmap((c) => this.getBlocksByCategory(c.path));
	}
}
