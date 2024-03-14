import BlockManager from "shared/building/BlockManager";
import MaterialData from "shared/data/MaterialData";
import PartUtils from "shared/utils/PartUtils";

declare global {
	type BlockList = readonly BlockModel[] | PlotModel;
}

/** Methods for editing the building */
export const SharedBuilding = {
	isFullPlot: (blocks: BlockList): blocks is PlotModel => typeIs(blocks, "Instance"),
	isBlocks: (blocks: BlockList): blocks is readonly BlockModel[] => !SharedBuilding.isFullPlot(blocks),
	isEmpty: (blocks: BlockList): blocks is readonly [] => SharedBuilding.isBlocks(blocks) && blocks.size() === 0,
	getBlockList: (blocks: BlockList): readonly BlockModel[] =>
		SharedBuilding.isBlocks(blocks) ? blocks : blocks.Blocks.GetChildren(undefined),

	/**
	 * Set the block material and color
	 * @param byBuild If true, will force update block transparency
	 */
	paint: (
		blocks: readonly BlockModel[],
		color: Color3 | undefined,
		material: Enum.Material | undefined,
		byBuild: boolean = false,
	) => {
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
	},
} as const;
