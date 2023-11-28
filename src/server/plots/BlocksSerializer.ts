import { DataStoreService, HttpService, Players, Workspace } from "@rbxts/services";
import BuildingWrapper from "server/BuildingWrapper";
import Serializer from "shared/Serializer";
import SharedPlots from "shared/building/SharedPlots";

export type SerializedBlock = {
	id: string;
	mat: SerializedEnum;
	col: SerializedColor;
	loc: SerializedCFrame;
	config?: object;
};

export default class BlocksSerializer {
	static serialize(plot: Model): SerializedBlock[] {
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

		const data: SerializedBlock[] = [];
		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i] as Model;
			const pivot = block.GetPivot();
			const buildingCenter = plot.FindFirstChild("BuildingArea")!.FindFirstChild("BuildingAreaCenter") as Part;

			const relativeOrientation = buildingCenter.CFrame.ToObjectSpace(pivot).LookVector;
			const relativePosition = buildingCenter.CFrame.ToObjectSpace(pivot);

			const blockData: SerializedBlock = {
				id: block.GetAttribute("id") as string, // Block ID
				mat: block.GetAttribute("material") as SerializedEnum, // Material
				col: HttpService.JSONDecode(block.GetAttribute("color") as string) as SerializedColor, // Color
				loc: Serializer.CFrameSerializer.serialize(relativePosition), // Position
			};

			if (block.GetAttribute("config") !== undefined) {
				blockData["config"] = HttpService.JSONDecode(block.GetAttribute("config") as string) as object;
			}

			data.push(blockData);
		}

		return data;
	}

	static deserialize(plot: Model, data: readonly SerializedBlock[]): Model {
		const buildingCenter = plot.FindFirstChild("BuildingArea")!.FindFirstChild("BuildingAreaCenter") as Part;

		for (let i = 0; i < data.size(); i++) {
			const blockData = data[i];

			const loc = Serializer.CFrameSerializer.deserialize(blockData.loc);

			const deserializedData: PlaceBlockRequest = {
				block: blockData.id,
				color: Serializer.Color3Serializer.deserialize(blockData.col),
				material: Serializer.EnumMaterialSerializer.deserialize(blockData.mat),
				location: buildingCenter.CFrame.ToWorldSpace(loc),
			};

			const response = BuildingWrapper.placeBlock(deserializedData);
			if (response.model && blockData.config) {
				response.model.SetAttribute("config", HttpService.JSONEncode(blockData.config));
			}
		}

		return plot;
	}
}
