import { RunService } from "@rbxts/services";
import { BlockLogicRegistry } from "shared/block/BlockLogicRegistry";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { BlockDataRegistry } from "shared/BlockDataRegistry";
import { Element } from "shared/Element";
import { AABB } from "shared/fixes/AABB";
import { Instances } from "shared/fixes/Instances";
import type { BlockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import type { BlockId } from "shared/BlockDataRegistry";
import type { BlocksInitializeData, Categories, Category } from "shared/init/BlocksInitializer";

if (RunService.IsServer()) {
	Element.create("Folder", { Name: "PlaceableAutomatic", Parent: Instances.assets });
}

export namespace BlockGenerator {
	export namespace Assertions {
		type AssertedModel = Model & { PrimaryPart: BasePart };

		function isPrimaryPartSet(block: Model): block is AssertedModel {
			return block.PrimaryPart !== undefined;
		}
		function* assertColboxIsPrimaryPartIfExists(block: AssertedModel) {
			for (const child of block.GetDescendants()) {
				if (child.Name.lower() === "colbox") {
					if (block.PrimaryPart !== child) {
						yield `Colbox in Block '${block.Name}' is not a primary part!`;
					}
				}
			}
		}
		function* assertColboxWeldedIfExists(block: AssertedModel) {
			if (block.PrimaryPart.Name.lower() !== "colbox") return;

			for (const weld of block.GetDescendants()) {
				if (!weld.IsA("WeldConstraint")) continue;

				if (weld.Part0 === block.PrimaryPart && weld.Part1 && weld.Part1 !== block.PrimaryPart) {
					return;
				}
				if (weld.Part1 === block.PrimaryPart && weld.Part0 && weld.Part0 !== block.PrimaryPart) {
					return;
				}
			}

			yield `Colbox in Block '${block.Name}' is not welded to anything!`;
		}
		function* assertValidVelds(block: AssertedModel) {
			for (const weld of block.GetDescendants()) {
				if (!weld.IsA("WeldConstraint")) continue;

				if (!weld.Part0 || !weld.Part1) {
					yield `Partial weld found in block ${block.Name} in weld parent ${weld.Parent}`;
					continue;
				}
				if (!weld.Part0.IsDescendantOf(block) || !weld.Part1.IsDescendantOf(block)) {
					yield `Outer weld reference found in block ${block.Name} in weld parent ${weld.Parent}`;
					continue;
				}
			}
		}
		function* assertSomethingAnchored(block: AssertedModel) {
			for (const part of block.GetDescendants()) {
				if (part.IsA("BasePart") && part.Anchored) {
					return;
				}
			}

			yield `No parts in block '${block.Name}' are anchored!`;
		}
		function* assertHasDataInRegistry(block: Model) {
			if (!BlockDataRegistry[block.Name.lower() as BlockId]) {
				yield `No registry data found for block ${block.Name}`;
			}
		}
		function* assertCollisionGroup(block: Model) {
			for (const child of block.GetDescendants()) {
				if (child.Parent?.Name === "WeldRegions") continue;
				if (!child.IsA("BasePart")) continue;
				if (!child.CanCollide) continue;

				if (child.CollisionGroup !== "Blocks") {
					yield `Block ${block.Name} part ${child.Name} has a wrong collision group ${child.CollisionGroup}!`;
				}
			}
		}
		function* assertNoRepeatedPartNames(block: Model) {
			const names = new Set<string>();
			for (const item of block.GetDescendants()) {
				if (!item.IsA("BasePart")) continue;

				if (names.has(item.Name)) {
					yield `Block ${block.Name} has duplicate child name ${item.Name}`;
				}

				names.add(item.Name);
			}
		}
		function checkSize(block: AssertedModel) {
			const check = (num: number, axis: "X" | "Y" | "Z") => {
				if (num % 1 === 0) return;

				if (num % 1 < 0.01) {
					$warn(`Potential floating point problem: ${block.Name}.Size.${axis} = ${num}`);
				}
			};

			let aabb = AABB.fromPart(block.PrimaryPart);
			for (const part of block.GetDescendants()) {
				if (!part.IsA("BasePart")) continue;
				if (part.Parent?.Name === "WeldRegions") continue;
				if (part.Parent?.Name === "MarkerPoints") continue;

				aabb = aabb.expanded(AABB.fromPart(part));
			}

			const size = aabb.getSize();
			check(size.X, "X");
			check(size.Y, "Y");
			check(size.Z, "Z");
		}

		export function getAllErrors(block: Model): readonly string[] {
			if (!isPrimaryPartSet(block)) {
				return [`PrimaryPart in Block '${block.Name}' is not set!`];
			}
			checkSize(block);

			return [
				...assertColboxIsPrimaryPartIfExists(block),
				...assertColboxWeldedIfExists(block),
				...assertValidVelds(block),
				...assertSomethingAnchored(block),
				...assertHasDataInRegistry(block),
				...assertCollisionGroup(block),
				...assertNoRepeatedPartNames(block),
			];
		}
	}

	const prefabs = Instances.waitForChild<Record<string, BlockModel>>(Instances.assets, "Prefabs");
	const placeableAutomatic = Instances.waitForChild<Folder & Record<BlockId, BlockModel>>(
		Instances.assets,
		"PlaceableAutomatic",
	);

	export type PrefabName = (typeof prefabNames)[keyof typeof prefabNames];
	export const prefabNames = {
		const: "ConstLogicBlockPrefab",
		smallGeneric: "GenericLogicBlockPrefab",
		doubleGeneric: "DoubleGenericLogicBlockPrefab",
		tripleGeneric: "TripleGenericLogicBlockPrefab",
		smallByte: "ByteLogicBlockPrefab",
		doubleByte: "DoubleByteLogicBlockPrefab",
	} as const satisfies { [k in string]: `${string}BlockPrefab` };

	export function cloneBlockModel(id: BlockId, prefab: PrefabName, text: string): BlockModel {
		if (RunService.IsClient()) {
			return placeableAutomatic[id];
		}

		const model = prefabs[prefab].Clone();
		model.Name = id;

		const textInstance = model.FindFirstChildWhichIsA("TextLabel", true);
		if (textInstance) {
			textInstance.Text = text;
		}

		model.Parent = placeableAutomatic;
		return model;
	}

	export function registerLogic(id: BlockId, logic: LogicCtor, def: BlockConfigTypes.BothDefinitions) {
		BlockLogicRegistry.asWritable()[id] = logic as never;
		(blockConfigRegistry as Writable<BlockConfigRegistry>)[id as keyof BlockConfigRegistry] = def;
	}

	type BlockAutoCreationData = {
		readonly id: BlockId;
		readonly modelTextOverride: string;
		readonly category: CategoryPath;
		readonly prefab: PrefabName;
		readonly logic: LogicCtor;
		readonly config: BlockConfigTypes.BothDefinitions;
		readonly required?: boolean;
		readonly limit?: number;
	};

	export function create(info: BlocksInitializeData, data: BlockAutoCreationData) {
		const id = data.id;
		$log(`Creating block ${id}`);

		const model = cloneBlockModel(id, data.prefab, data.modelTextOverride);

		const regblock = construct(id, model, data.category);
		info.blocks.set(regblock.id, regblock);

		// automatically create categories
		//some magic idk DO NOT TOUCH
		{
			let cat: Category | undefined = undefined;
			let path: CategoryPath = [];
			for (const c of data.category) {
				path = [...path, c];

				const se = (cat?.sub ?? info.categories) as Writable<Categories>;
				const newcat = (se[c] ??= { path, name: c, sub: {} });

				if (cat) {
					(cat.sub as Writable<Categories>)[c] = newcat;
				}

				cat = newcat;
			}
		}

		registerLogic(id, data.logic, data.config);
	}

	export function construct(id: BlockId, model: BlockModel, category: CategoryPath): RegistryBlock {
		if (!(id in BlockDataRegistry)) {
			throw `Block ${id} was not found in the data registry`;
		}

		const setupinfo = BlockDataRegistry[id];
		return {
			id,
			category,
			model,

			displayName: setupinfo.name,
			info: setupinfo.description,
			autoWeldShape: setupinfo.autoWeldShape,
			limit: setupinfo.limit,
			mirrorBehaviour: setupinfo.mirrorBehaviour,
			mirrorReplacementId: setupinfo.mirrorReplacementId as BlockId | undefined,
			required: setupinfo.required,
		};
	}
}
