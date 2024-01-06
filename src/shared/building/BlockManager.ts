import { HttpService } from "@rbxts/services";
import Serializer from "shared/Serializer";

export type PlacedBlockData = {
	instance: BlockModel;
	cframe: CFrame;
	color: Color3;
	material: Enum.Material;
	id: string;
	uuid: string | undefined;
	displayName: string | undefined;
};

export default class BlockManager {
	static isBlockPart(part: BasePart): part is BasePart & { Parent: BlockModel } {
		const isBlockPart =
			part && part.Parent && part.Parent.IsA("Model") && (part.Parent as Model).GetAttribute("id") !== undefined;
		return isBlockPart!;
	}

	static getBlockDataByPart(part: BasePart): PlacedBlockData | undefined {
		if (this.isBlockPart(part)) {
			return this.getBlockDataByBlockModel(part.Parent);
		}

		return;
	}

	static getBlockDataByBlockModel(model: BlockModel): PlacedBlockData {
		return {
			instance: model,
			id: model.GetAttribute("id") as string,
			cframe: model.GetPivot(),
			color: Serializer.Color3Serializer.deserialize(
				HttpService.JSONDecode(model.GetAttribute("color") as string) as SerializedColor,
			),
			material: Serializer.EnumMaterialSerializer.deserialize(model.GetAttribute("material") as number),
			uuid: model.GetAttribute("uuid") as string | undefined,
			displayName: model.GetAttribute("displayName") as string | undefined,
		};
	}
}
