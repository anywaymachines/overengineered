import { RunService } from "@rbxts/services";
import { C2S2CRemoteFunction } from "engine/shared/event/PERemoteEvent";
import { BlockAssertions } from "shared/blocks/BlockAssertions";
import { TagUtils } from "shared/utils/TagUtils";
import type { BlockBuilder } from "shared/blocks/Block";

export namespace BlockListBuilder {
	type RemoteBlock = Pick<Block, Exclude<keyof Block, keyof BlockBuilder>>;
	/** @server */
	let serverBuiltBlocks: { readonly [k in string]: RemoteBlock } | undefined;
	const fetchRemoteBlocks = new C2S2CRemoteFunction<
		undefined,
		Response<{ readonly blocks: { readonly [k in string]: RemoteBlock } }>
	>("b_fetchBlocks");
	if (RunService.IsServer()) {
		fetchRemoteBlocks.subscribe(() => {
			if (!serverBuiltBlocks) {
				return { success: false, message: "Not initialized yet" };
			}

			return { success: true, blocks: serverBuiltBlocks };
		});
	}

	export function buildBlockList(builders: readonly BlockBuilder[], di: DIContainer): BlockList {
		const endings = [".", "!", "?", " "];
		const process = (block: BlockBuilder): BlockBuilder => {
			if (!endings.includes(block.description.sub(block.description.size()))) {
				return {
					...block,
					description: block.description + ".",
				};
			}

			return block;
		};
		builders = builders.map(process);

		if (RunService.IsServer()) {
			const colbox = new Instance("Part") as Part & { readonly WeldConstraint: WeldConstraint };
			colbox.CanCollide = false;
			colbox.CanQuery = false;
			colbox.Anchored = true;
			colbox.Massless = true;
			colbox.CollisionGroup = "ColBoxExclusive";
			colbox.EnableFluidForces = false;

			const weld = new Instance("WeldConstraint");
			weld.Parent = colbox;

			serverBuiltBlocks = asObject(
				builders.mapToMap((b) => {
					const model = b.modelSource.model(b);
					const category = b.modelSource.category(b, model);
					const markerPositions = b.markerPositionsSource(b, model);
					const weldRegions = b.weldRegionsSource(b, model);

					const markers = model.FindFirstChild("moduleMarkers")?.GetChildren();
					if (markers) for (const m of markers) (m as BasePart).CollisionGroup = "WeaponMarker";

					// add colboxes to single-part blocks for radar performance
					const instncs = model?.GetChildren().filter((v) => !v.IsA("Folder"));
					if (instncs.size() === 1) {
						const cb = colbox.Clone();
						cb.Name = "Colbox";
						cb.Size = (instncs[0] as BasePart).Size;
						cb.Parent = model;
						cb.Position = model.PrimaryPart!.Position;
						cb.WeldConstraint.Part0 = cb;
						cb.WeldConstraint.Part1 = model.PrimaryPart;
						cb.WeldConstraint.Enabled = true;
						cb.Transparency = 1;

						model.PrimaryPart = cb;
					}

					// colbox collision autofix
					const cb = model.PrimaryPart;
					if (cb?.Name.fullLower() === "colbox") {
						cb.CanCollide = false;
						cb.CanQuery = false;
					}

					return $tuple(b.id, {
						model,
						category,
						markerPositions,
						weldRegions,
					});
				}),
			);

			for (const [id, block] of pairs(serverBuiltBlocks)) {
				for (const part of block.model.GetDescendants()) {
					if (!part.IsA("BasePart")) continue;

					if (part.Transparency === 1) {
						part.AddTag(TagUtils.allTags.TRANSPARENT_MATERIAL);
					}

					if (!part.CanCollide) {
						part.AddTag(TagUtils.allTags.BLOCK_NONCOLLIDABLE);
					}
				}
			}
		}

		let remoteBlocks: typeof serverBuiltBlocks;
		if (RunService.IsClient()) {
			const result = fetchRemoteBlocks.send();
			if (!result.success) {
				// TODO: retry or something
				throw result.message;
			}

			remoteBlocks = result.blocks;
		} else {
			remoteBlocks = serverBuiltBlocks;
		}

		if (!remoteBlocks) {
			throw "No server built blocks present";
		}

		const blocks = asObject(
			builders
				.filter((b) => b.id in remoteBlocks)
				.mapToMap((b) =>
					$tuple(b.id, {
						...b,
						id: b.id,
						...remoteBlocks[b.id],
					} satisfies Block),
				),
		);

		if (RunService.IsStudio() && RunService.IsServer()) {
			const errors: { readonly id: string; readonly errors: readonly string[] }[] = [];
			for (const [id, block] of asMap(blocks)) {
				const blockErrors = BlockAssertions.getAllErrors(block);
				if (blockErrors.size() !== 0) {
					errors.push({ id, errors: [...new Set(blockErrors)] });
				}
			}
			if (errors.size() !== 0) {
				throw `Found block errors:\n${errors.map(({ id, errors }) => `${id}:\n${errors.map((e) => `    ${e}`).join("\n")}`).join("\n\n")}`;
			}
		}

		const sorted = asMap(blocks)
			.values()
			.sort((left, right) => left.id < right.id);

		return { blocks, sorted };
	}
}
