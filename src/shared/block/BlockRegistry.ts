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

export class BlockRegistry {
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
		categories ??= this.categories;
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
