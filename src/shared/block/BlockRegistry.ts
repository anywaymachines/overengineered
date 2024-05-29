import { Objects } from "shared/fixes/objects";
import type { AutoWeldColliderBlockShape, BlockMirrorBehaviour } from "shared/BlockDataRegistry";

declare global {
	type RegistryBlock = {
		readonly id: BlockId;
		readonly displayName: string;
		readonly info: string;
		readonly model: BlockModel;
		readonly category: CategoryName;
		readonly required: boolean | undefined;
		readonly limit: number | undefined;
		readonly autoWeldShape: AutoWeldColliderBlockShape | undefined;
		readonly mirrorBehaviour: BlockMirrorBehaviour | undefined;
		readonly mirrorReplacementId: BlockId | undefined;
	};

	type CategoryName = string & { readonly ___nominal: "CategoryName" };
}

type Category = {
	readonly name: CategoryName;
	readonly sub: Categories;
};
type Categories = Readonly<Record<CategoryName, Category>>;

namespace Editable {
	export const blocks = new Map<BlockId, RegistryBlock>();
	export const sorted: RegistryBlock[] = [];
	export const required: RegistryBlock[] = [];

	export const categories: { [k in CategoryName]: Category } = {};

	export function add(newblocks: RegistryBlock[], newcategories: {}) {
		for (const block of newblocks) {
			blocks.set(block.id, block);
		}

		sorted.clear();
		for (const block of blocks.map((_, v) => v).sort((left, right) => left.id < right.id)) {
			sorted.push(block);
		}

		required.clear();
		for (const block of sorted) {
			if (!block.required) continue;
			required.push(block);
		}

		Objects.assign(categories, newcategories);
	}
}

export namespace BlockRegistry {
	/** The map of blocks */
	export const map: ReadonlyMap<string, RegistryBlock> = Editable.blocks;

	/** All blocks, sorted by id */
	export const sorted: readonly RegistryBlock[] = Editable.sorted;

	/** Blocks that have `required` set to `true` */
	export const required: readonly RegistryBlock[] = Editable.required;

	/** The map of block categories */
	export const categories: { readonly [k in CategoryName]: Category } = Editable.categories;

	/** Get the full path of the category
	 * @example getCategoryPath(categories, 'Math') => ['Logic', 'Math']
	 */
	export function getCategoryPath(key: string, categories?: Categories): CategoryName[] | undefined {
		categories ??= BlockRegistry.categories;
		for (const [category] of pairs(categories)) {
			if (category === key) {
				return [category];
			}

			const subPath = getCategoryPath(key, categories[category].sub);
			if (subPath) {
				return [category, ...subPath];
			}
		}
	}

	export function editable(): { add(this: void, newblocks: RegistryBlock[], categories: {}): void } {
		return Editable;
	}
}

export class BlockRegistryC {
	readonly blocks: ReadonlyMap<BlockId, RegistryBlock>;
	readonly sorted: readonly RegistryBlock[];
	readonly required: readonly RegistryBlock[];
	readonly categories: { readonly [k in CategoryName]: Category };

	constructor(blocks: readonly RegistryBlock[], newcategories: {}) {
		this.blocks = new Map(blocks.map((b) => [b.id, b] as const));
		this.sorted = [...blocks].sort((left, right) => left.id < right.id);
		this.required = this.sorted.filter((b) => b.required);
		this.categories = newcategories;
	}

	/** Get the full path of the category
	 * @example getCategoryPath(categories, 'Math') => ['Logic', 'Math']
	 */
	getCategoryPath(key: string, categories?: Categories): CategoryName[] | undefined {
		categories ??= BlockRegistry.categories;
		for (const [category] of pairs(categories)) {
			if (category === key) {
				return [category];
			}

			const subPath = this.getCategoryPath(key, categories[category].sub);
			if (subPath) {
				return [category, ...subPath];
			}
		}
	}
}
