import { BlockManager, PlacedBlockData, PlacedBlockDataConnection } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { MaterialData } from "shared/data/MaterialData";
import { PartUtils } from "shared/utils/PartUtils";

/** Methods for editing the building */
export namespace SharedBuilding {
	export function getBlocksConnectedByLogicToMulti(plot: PlotModel, uuids: ReadonlySet<BlockUuid>) {
		const result = new Map<
			BlockUuid,
			(readonly [PlacedBlockData, BlockConnectionName, PlacedBlockDataConnection])[]
		>();
		for (const otherblock of SharedPlots.getPlotBlockDatas(plot)) {
			if (otherblock.connections === undefined) continue;

			for (const [connectionName, connection] of pairs(otherblock.connections)) {
				if (!uuids.has(connection.blockUuid)) continue;

				let ret = result.get(connection.blockUuid);
				if (!ret) {
					result.set(connection.blockUuid, (ret = []));
				}

				ret.push([otherblock, connectionName, connection] as const);
			}
		}

		return result;
	}

	/**
	 * Set the block material and color
	 * @param byBuild If true, will force update block transparency
	 */
	export function paint(
		blocks: readonly BlockModel[],
		color: Color3 | undefined,
		material: Enum.Material | undefined,
		byBuild: boolean = false,
	) {
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
				PartUtils.switchDescendantsColor(block, color);
			}
		}
	}
}
