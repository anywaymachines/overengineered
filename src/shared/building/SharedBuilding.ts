import { HttpService } from "@rbxts/services";
import MaterialData from "shared/data/MaterialData";
import Serializer from "shared/Serializer";
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
	paint: (data: PaintRequest, byBuild: boolean = false): Response => {
		const blocks = "blocks" in data ? data.blocks : data.plot.Blocks.GetChildren(undefined);
		for (const block of blocks) {
			if (data.material) {
				block.SetAttribute("material", Serializer.EnumMaterialSerializer.serialize(data.material));
				PartUtils.switchDescendantsMaterial(block, data.material);

				// Make glass material transparent
				if (data.material === Enum.Material.Glass) {
					PartUtils.switchDescendantsTransparency(block, 0.3);
				} else if (!byBuild) {
					PartUtils.switchDescendantsTransparency(block, 0);
				}

				// Custom physical properties
				const customPhysProp = MaterialData.Properties[data.material.Name] ?? MaterialData.Properties.Default;

				PartUtils.applyToAllDescendantsOfType("BasePart", block, (part) => {
					if (!byBuild || !part.CustomPhysicalProperties) {
						const currentPhysProp = !byBuild
							? new PhysicalProperties(data.material!)
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

			if (data.color) {
				block.SetAttribute("color", HttpService.JSONEncode(Serializer.Color3Serializer.serialize(data.color)));
				PartUtils.switchDescendantsColor(block, data.color);
			}
		}

		return { success: true };
	},
} as const;
