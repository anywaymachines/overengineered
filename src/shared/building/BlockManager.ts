import { HttpService } from "@rbxts/services";
import Serializer from "shared/Serializer";
import JSON from "shared/_fixes_/Json";

export type PlacedBlockDataConnection = {
	/** OUTPUT block uiid */
	readonly blockUuid: BlockUuid;
	/** OUTPUT connector name */
	readonly connectionName: BlockConnectionName;
};

export type PlacedBlockData<T extends BlockModel = BlockModel> = {
	readonly instance: T;
	readonly cframe: CFrame;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly id: string;
	readonly uuid: BlockUuid;
	readonly displayName: string | undefined;
	readonly config: object;

	/** Connections to the INPUT connectors */
	readonly connections: Readonly<Record<BlockConnectionName, PlacedBlockDataConnection>>;
};

/** Methods for reading information about a block */
export default class BlockManager {
	static isActiveBlockPart(part: BasePart): boolean {
		if (
			part.AssemblyRootPart?.Anchored ||
			part.Anchored ||
			!this.isBlockPart(part) ||
			part.GetAttribute("Burn") === true
		)
			return false;

		return true;
	}

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
			config: JSON.deserialize<object>((model.GetAttribute("config") as string | undefined) ?? "{}"),
		};
	}
}
