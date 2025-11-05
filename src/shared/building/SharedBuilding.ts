import { Instances } from "engine/shared/fixes/Instances";
import { BlockManager } from "shared/building/BlockManager";
import { MaterialData } from "shared/data/MaterialData";
import { PartUtils } from "shared/utils/PartUtils";
import { TagUtils } from "shared/utils/TagUtils";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

/** Methods for editing the building */
export namespace SharedBuilding {
	export function getBlocksConnectedByLogicToMulti(
		blocks: readonly PlacedBlockData[],
		uuids: ReadonlySet<BlockUuid>,
	) {
		const result = new Map<
			BlockUuid,
			(readonly [PlacedBlockData, BlockConnectionName, BlockLogicTypes.WireValue])[]
		>();
		for (const otherblock of blocks) {
			if (!otherblock.config) continue;

			for (const [connectionName, cfg] of pairs(otherblock.config)) {
				if (cfg.type !== "wire") continue;
				const connection = cfg.config;

				if (!uuids.has(connection.blockUuid)) continue;

				let ret = result.get(connection.blockUuid);
				if (!ret) {
					result.set(connection.blockUuid, (ret = []));
				}

				ret.push([otherblock, connectionName as BlockConnectionName, connection] as const);
			}
		}

		return result;
	}

	export function calculateScale(block: Model, original: Model): Vector3 {
		return block.PrimaryPart!.Size.div(original.PrimaryPart!.Size);
	}

	export function scale(block: BlockModel, originalModel: BlockModel, scale: Vector3 | undefined) {
		scale ??= Vector3.one;

		const origModelCenter = originalModel.GetPivot();
		const blockCenter = block.GetPivot();

		const update = (instance: Instance, origInstance: Instance) => {
			// assuming no duplicate instance names on a single layer

			for (const origChild of origInstance.GetChildren()) {
				const name = origChild.Name;
				const child = instance.WaitForChild(name);

				if (child.IsA("Attachment") && origChild.IsA("Attachment")) {
					child.Position = origChild.Position.mul(
						(origChild.Parent! as BasePart).CFrame.Rotation.mul(scale).Abs(),
					);
				} else if (child.IsA("BasePart") && origChild.IsA("BasePart")) {
					child.Size = origChild.Size.mul(origChild.CFrame.Rotation.Inverse().mul(scale).Abs());

					const offset = origModelCenter.ToObjectSpace(origChild.CFrame);
					child.Position = blockCenter.ToWorldSpace(new CFrame(offset.Position.mul(scale))).Position;
				}

				update(child, origChild);
			}
		};

		update(block, originalModel);
	}

	/**
	 * Set the block material and color
	 * @param byBuild If true, will force update block transparency
	 */
	export function paint(
		blocks: readonly BlockModel[],
		color: Color4 | undefined,
		material: Enum.Material | undefined,
		byBuild: boolean = false,
	) {
		// fix for blocks with parts that already have CustomPhysicalProperties set having different properties after placing vs after painting
		byBuild = false;

		for (const block of blocks) {
			if (material) {
				BlockManager.manager.material.set(block, material);
				PartUtils.switchDescendantsMaterial(block, material);

				// Make glass material transparent
				if (material === Enum.Material.Glass) {
					PartUtils.switchDescendantsTransparency(block, 0.3);
				} else if (!byBuild) {
					PartUtils.switchDescendantsTransparency(block, 0);
				}

				// Custom physical properties
				const customPhysProp = MaterialData.Properties[material.Name] ?? MaterialData.Properties.Default;

				PartUtils.applyToAllDescendantsOfType("BasePart", block, (part) => {
					if (!byBuild || !part.CustomPhysicalProperties) {
						const currentPhysProp = !byBuild
							? new PhysicalProperties(material!)
							: part.CurrentPhysicalProperties;

						part.CustomPhysicalProperties = new PhysicalProperties(
							customPhysProp.Density ?? currentPhysProp.Density,
							customPhysProp.Friction ?? currentPhysProp.Friction,
							customPhysProp.Elasticity ?? currentPhysProp.Elasticity,
							customPhysProp.FrictionWeight ?? currentPhysProp.FrictionWeight,
							customPhysProp.ElasticityWeight ?? currentPhysProp.ElasticityWeight,
						);
					}
				});
			}

			if (color) {
				BlockManager.manager.color.set(block, color);
				PartUtils.switchDescendantsColor(block, color.color);

				if (material === Enum.Material.Glass && color.alpha >= 0.99) {
					PartUtils.switchDescendantsTransparency(block, 0.3);
				} else if (!byBuild) {
					PartUtils.switchDescendantsTransparency(block, 1 - color.alpha);
				}
			}
		}
	}

	export function recollide(block: BlockModel, enabled: boolean) {
		PartUtils.applyToAllDescendantsOfType("BasePart", block, (p) => {
			if (p.HasTag(TagUtils.allTags.BLOCK_NONCOLLIDABLE)) return;
			p.CanCollide = enabled;
		});
	}

	export function findWeld(part1: Instance, part2: Instance) {
		for (const weld of part1.GetChildren()) {
			if (!weld.IsA("WeldConstraint")) continue;

			if ((weld.Part0 === part1 && weld.Part1 === part2) || (weld.Part0 === part2 && weld.Part1 === part1)) {
				return weld;
			}
		}
		for (const weld of part2.GetChildren()) {
			if (!weld.IsA("WeldConstraint")) continue;

			if ((weld.Part0 === part1 && weld.Part1 === part2) || (weld.Part0 === part2 && weld.Part1 === part1)) {
				return weld;
			}
		}
	}
	export function applyWelds(block: BlockModel, plot: ReadonlyPlot, welds: BlockWelds) {
		const wi = (...data: readonly unknown[]) => warn("[ignorable]", ...data);

		for (const data of welds) {
			const thisPart = Instances.findChild(block, ...data.thisPart);
			if (!thisPart) {
				wi(" Skipping welding update: Can't find this part", block, data.thisPart.join("."));
				continue;
			}

			const otherBlock = plot.tryGetBlock(data.otherUuid);
			if (!otherBlock) {
				wi(" Skipping welding update: Can't find other block", data.otherUuid);
				continue;
			}

			const otherPart = Instances.findChild(otherBlock, ...data.otherPart);
			if (!otherPart) {
				wi(" Skipping welding update: Can't find other part", data.otherUuid, data.otherPart.join("."));
				continue;
			}

			const weld = SharedBuilding.findWeld(thisPart, otherPart);
			if (!weld) {
				wi(" Skipping welding update: Can't find weld between", block, thisPart, ">", otherBlock, otherPart);
				continue;
			}

			weld.Enabled = data.welded;
		}
	}
}
