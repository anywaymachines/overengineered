import { HttpService } from "@rbxts/services";
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
			}

			if (data.color) {
				block.SetAttribute("color", HttpService.JSONEncode(Serializer.Color3Serializer.serialize(data.color)));
				PartUtils.switchDescendantsColor(block, data.color);
			}
		}

		return { success: true };
	},
} as const;
