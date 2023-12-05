import { HttpService } from "@rbxts/services";
import { blockRegistry } from "shared/BlockRegistry";
import MaterialPhysicalProperties from "shared/MaterialPhysicalProperties";
import Serializer from "shared/Serializer";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";
import BuildingWelder from "./BuildingWelder";

export default class BuildingWrapper {
	public static placeBlock(data: PlaceBlockRequest) {
		const plot = SharedPlots.getPlotByPosition(data.location.Position) as Model;
		if (!plot) {
			return {
				success: false,
				message: "Plot not found",
			};
		}

		const block = blockRegistry.get(data.block)!;

		// Create a new instance of the building model
		const model = block.model.Clone();
		model.SetAttribute("id", data.block);

		model.PivotTo(data.location);
		model.Parent = plot.FindFirstChild("Blocks");

		// Set material & color
		model.SetAttribute("material", Serializer.EnumMaterialSerializer.serialize(data.material));
		model.SetAttribute("color", HttpService.JSONEncode(Serializer.Color3Serializer.serialize(data.color)));
		PartUtils.switchDescendantsMaterial(model, data.material);
		PartUtils.switchDescendantsColor(model, data.color);

		// Make transparent glass material
		if (data.material === Enum.Material.Glass) {
			PartUtils.switchDescendantsTransparency(model, 0.3);
		}

		// Custom physical properties
		const customPhysProp =
			MaterialPhysicalProperties.Properties[data.material.Name] ?? MaterialPhysicalProperties.Properties.Default;

		PartUtils.applyToAllParts(model, (part) => {
			const currentPhysProp = part.CurrentPhysicalProperties;
			part.CustomPhysicalProperties = new PhysicalProperties(
				customPhysProp.Density ?? currentPhysProp.Density,
				customPhysProp.Friction ?? currentPhysProp.Friction,
				customPhysProp.Elasticity ?? currentPhysProp.Elasticity,
				customPhysProp.FrictionWeight ?? currentPhysProp.FrictionWeight,
				customPhysProp.ElasticityWeight ?? currentPhysProp.ElasticityWeight,
			);
		});

		// Weld block
		BuildingWelder.weld(model);

		return { success: true, model: model };
	}

	public static updateConfig(data: ConfigUpdateRequest) {
		const dataTag = data.block.GetAttribute("config") as string | undefined;
		const currentData = HttpService.JSONDecode(dataTag ?? "{}") as { [key: string]: string };
		currentData[data.data.key] = data.data.value;
		data.block.SetAttribute("config", HttpService.JSONEncode(currentData));

		return { success: true };
	}
}
