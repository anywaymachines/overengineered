import { HttpService } from "@rbxts/services";
import MaterialPhysicalProperties from "shared/MaterialPhysicalProperties";
import Serializer from "shared/Serializer";
import PartUtils from "shared/utils/PartUtils";

export const SharedBuilding = {
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
				const customPhysProp =
					MaterialPhysicalProperties.Properties[data.material.Name] ??
					MaterialPhysicalProperties.Properties.Default;

				PartUtils.applyToAllDescendantsOfType("BasePart", block, (part) => {
					if (!part.CustomPhysicalProperties) {
						const currentPhysProp = part.CurrentPhysicalProperties;
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
