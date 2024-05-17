import { RunService } from "@rbxts/services";
import { BlockDataRegistry, BlockId } from "shared/BlockDataRegistry";
import { Element } from "shared/Element";
import { BlockLogicRegistry } from "shared/block/BlockLogicRegistry";
import { BlockConfigRegistry, blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { AABB } from "shared/fixes/AABB";
import { Instances } from "shared/fixes/Instances";
import { BlocksInitializeData } from "shared/init/BlocksInitializer";

if (RunService.IsServer()) {
	Element.create("Folder", { Name: "PlaceableAutomatic", Parent: Instances.assets });
}

export namespace BlockGenerator {
	export namespace Assertions {
		type AssertedModel = Model & { PrimaryPart: BasePart };

		function assertPrimaryPartSet(block: Model): asserts block is AssertedModel {
			if (!block.PrimaryPart) {
				throw `PrimaryPart in Block '${block.Name}' is not set!`;
			}
		}
		function assertColboxIsPrimaryPartIfExists(block: AssertedModel) {
			for (const child of block.GetDescendants()) {
				if (child.Name.lower() === "colbox") {
					if (block.PrimaryPart !== child) {
						throw `Colbox in Block '${block.Name}' is not a primary part!`;
					}
				}
			}
		}
		function assertColboxWeldedIfExists(block: AssertedModel) {
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

			throw `Colbox in Block '${block.Name}' is not welded to anything!`;
		}
		function assertValidVelds(block: AssertedModel) {
			for (const weld of block.GetDescendants()) {
				if (!weld.IsA("WeldConstraint")) continue;

				if (!weld.Part0 || !weld.Part1) {
					throw `Partial weld found in block ${block.Name} in weld parent ${weld.Parent}`;
				}
				if (!weld.Part0.IsDescendantOf(block) || !weld.Part1.IsDescendantOf(block)) {
					throw `Outer weld reference found in block ${block.Name} in weld parent ${weld.Parent}`;
				}
			}
		}
		function assertSomethingAnchored(block: AssertedModel) {
			for (const part of block.GetDescendants()) {
				if (part.IsA("BasePart") && part.Anchored) {
					return;
				}
			}

			throw `No parts in block '${block.Name}' are anchored!`;
		}
		function assertHasDataInRegistry(block: Model) {
			if (!BlockDataRegistry[block.Name.lower() as BlockId]) {
				throw `No registry data found for block ${block.Name}`;
			}
		}
		function assertSize(block: AssertedModel) {
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
		function assertCollisionGroup(block: Model) {
			for (const child of block.GetDescendants()) {
				if (child.Parent?.Name === "WeldRegions") continue;
				if (!child.IsA("BasePart")) continue;
				if (!child.CanCollide) continue;

				if (child.CollisionGroup !== "Blocks") {
					throw `Block ${block.Name} part ${child.Name} has a wrong collision group ${child.CollisionGroup}!`;
				}
			}
		}

		export function checkAll(block: Model) {
			assertPrimaryPartSet(block);
			assertColboxIsPrimaryPartIfExists(block);
			assertColboxWeldedIfExists(block);
			assertValidVelds(block);
			assertSomethingAnchored(block);
			assertHasDataInRegistry(block);
			assertSize(block);
			assertCollisionGroup(block);
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
		readonly category: readonly string[];
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
		Assertions.checkAll(model);

		const regblock = construct(id, model, data.category[data.category.size() - 1] as CategoryName);
		info.blocks.set(regblock.id, regblock);

		// automatically create categories
		//some magic idk DO NOT TOUCH
		{
			let cat: (typeof info.categories)[CategoryName] | undefined = undefined;
			for (const c of data.category) {
				const se = (cat?.sub ?? info.categories) as Writable<typeof info.categories>;
				if (!se[c as CategoryName]) {
					se[c as CategoryName] = { name: c as CategoryName, sub: {} };
				}

				const newcat = se[c as CategoryName];
				if (cat) {
					(cat.sub as Writable<typeof cat.sub>)[c as CategoryName] = newcat;
				}

				cat = newcat;
			}
		}

		registerLogic(id, data.logic, data.config);
	}

	export function construct(id: BlockId, model: BlockModel, category: CategoryName): RegistryBlock {
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
