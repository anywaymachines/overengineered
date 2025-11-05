import { Objects } from "engine/shared/fixes/Objects";
import { TagUtils } from "shared/utils/TagUtils";
import type { BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";

export namespace BlockAssertions {
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

	function* assertFluidForcesIsDisabled(block: AssertedModel) {
		for (const child of block.GetDescendants()) {
			if (child.IsA("BasePart") && child.EnableFluidForces === true) {
				yield `Fluid forces in part "${child.Name}" of block '${block.Name}' is enabled!`;
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

			if (!weld.Enabled) {
				yield `Disabled weld found in block ${block.Name} in weld parent ${weld.Parent}`;
			}
			if (!weld.Part0 || !weld.Part1) {
				yield `Partial weld found in block ${block.Name} in weld parent ${weld.Parent}`;
			}
			if (
				(weld.Part0 && !weld.Part0.IsDescendantOf(block)) ||
				(weld.Part1 && !weld.Part1.IsDescendantOf(block))
			) {
				yield `Outer weld reference found in block ${block.Name} in weld parent ${weld.Parent}`;
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
	function* assertNoPrimaryPartRotation(block: AssertedModel) {
		if (block.PrimaryPart.CFrame.Rotation !== CFrame.identity) {
			yield `Block ${block.Name} has a non-zero rotation in its PrimaryPart ${block.PrimaryPart.Name}`;
		}
	}
	function* assertNoBallCylinderParts(block: Model) {
		function* check(instance: Instance) {
			for (const child of instance.GetChildren()) {
				if (child.Parent?.Name === "WeldRegions") continue;

				if (child.IsA("Part")) {
					if (child.HasTag(TagUtils.allTags.BLOCK_UNSCALABLE)) continue;

					if (child.Shape === Enum.PartType.Ball || child.Shape === Enum.PartType.Cylinder) {
						yield `Block ${block.Name} part ${child.Name} shape is ${tostring(child.Shape).sub("Enum.PartType.".size() + 1)} which does not scale good. Replace with union or a mesh.`;
					}
				}
			}
		}

		for (const err of check(block)) {
			yield err;
		}
	}

	function* assertUsePartColor(block: Model) {
		for (const part of block.GetDescendants()) {
			if (part.IsA("UnionOperation") && !part.UsePartColor) {
				yield `Block ${block.Name} part ${part.Name} has UsePartColor disabled`;
			}
		}
	}
	function* assertCollisionGroup(block: Model) {
		const allowedExceptions = ["colbox", "radarview"];

		for (const child of block.GetDescendants()) {
			if (child.Parent?.Name === "WeldRegions") continue;
			if (!child.IsA("BasePart")) continue;
			if (!child.CanCollide) continue;

			// check for exceptions
			if (child.CollisionGroup !== "Blocks" && !allowedExceptions.includes(child.Name.fullLower())) {
				yield `Block ${block.Name} part ${child.Name} has a wrong collision group ${child.CollisionGroup}!`;
			}
		}
	}
	function* assertNoRepeatedPartNames(block: Model) {
		function* check(parent: Instance): Generator<string> {
			const names = new Set<string>();
			for (const child of parent.GetChildren()) {
				for (const err of check(child)) {
					yield err;
				}

				if (!child.IsA("BasePart")) continue;

				if (names.has(child.Name)) {
					yield `Block ${block.Name} has duplicate child name ${child.Name}`;
				}

				names.add(child.Name);
			}
		}

		for (const err of check(block)) {
			yield err;
		}
	}

	function getAllModelErrors(block: Model): readonly string[] {
		if (!isPrimaryPartSet(block)) {
			return [`PrimaryPart in Block '${block.Name}' is not set!`];
		}

		return [
			...assertColboxIsPrimaryPartIfExists(block),
			...assertColboxWeldedIfExists(block),
			...assertValidVelds(block),
			...assertFluidForcesIsDisabled(block),
			...assertSomethingAnchored(block),
			...assertNoPrimaryPartRotation(block),
			...assertNoBallCylinderParts(block),
			...assertUsePartColor(block),
			...assertCollisionGroup(block),
			...assertNoRepeatedPartNames(block),
		];
	}

	function* checkNoSameNamesInLogicDefinition(block: Block, defs: BlockLogicFullBothDefinitions) {
		const keys = [...Objects.keys(defs.input), ...Objects.keys(defs.output)];

		if (keys.size() !== new Set(keys).size()) {
			yield `Block ${block.id} has duplicate keys between logic input and output`;
		}
	}

	function* checkDefinitionOrder(block: Block, defs: BlockLogicFullBothDefinitions) {
		if (defs.inputOrder) {
			if (
				defs.inputOrder.any((c) => !(c in defs.input)) ||
				Objects.keys(defs.input).any((c) => !defs.inputOrder!.includes(c))
			) {
				yield `Block ${block.id} definition has invalid inputOrder`;
			}
		}

		if (defs.outputOrder) {
			if (
				defs.outputOrder.any((c) => !(c in defs.output)) ||
				Objects.keys(defs.output).any((c) => !defs.outputOrder!.includes(c))
			) {
				yield `Block ${block.id} definition has invalid outputOrder`;
			}
		}
	}

	function* checkLowercaseAlias(block: Block) {
		if (
			block.search?.aliases?.any((a) => a.fullLower() !== a) ||
			block.search?.partialAliases?.any((a) => a.fullLower() !== a)
		) {
			yield `Block ${block.id} has non-lowercase aliases ${[
				...(block.search?.aliases?.filter((a) => a.fullLower() !== a) ?? []),
				...(block.search?.partialAliases?.filter((a) => a.fullLower() !== a) ?? []),
			].join()}`;
		}
	}

	function getAllLogicErrors(block: Block, logic: Block["logic"] & defined): readonly string[] {
		return [
			...checkNoSameNamesInLogicDefinition(block, logic.definition),
			...checkDefinitionOrder(block, logic.definition),
			//
		];
	}

	export function getAllErrors(block: Block): readonly string[] {
		return [
			...getAllModelErrors(block.model),
			...(block.logic ? getAllLogicErrors(block, block.logic) : []),
			...checkLowercaseAlias(block),
		];
	}
}
