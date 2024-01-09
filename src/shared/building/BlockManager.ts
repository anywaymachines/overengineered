import { HttpService } from "@rbxts/services";
import Serializer from "shared/Serializer";

export type PlacedBlockDataConnection = {
	/** OUTPUT block uiid */
	readonly blockUuid: BlockUuid;
	/** OUTPUT connector name */
	readonly connectionName: BlockConnectionName;
};

export type PlacedBlockData = {
	readonly instance: BlockModel;
	readonly cframe: CFrame;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly id: string;
	readonly uuid: BlockUuid;
	readonly displayName: string | undefined;

	/** Connections to the INPUT connectors */
	readonly connections: Readonly<Record<BlockConnectionName, PlacedBlockDataConnection>>;
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
			uuid: model.GetAttribute("uuid") as BlockUuid,
			displayName: model.GetAttribute("displayName") as string | undefined,
			connections: HttpService.JSONDecode(
				(model.GetAttribute("connections") as string | undefined) ?? "{}",
			) as PlacedBlockData["connections"],
		};
	}
}
