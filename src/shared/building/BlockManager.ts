import { HttpService } from "@rbxts/services";
import Serializer from "shared/Serializer";
import JSON from "shared/fixes/Json";

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
	readonly config: object;

	/** Connections to the INPUT connectors */
	readonly connections: Readonly<Record<BlockConnectionName, PlacedBlockDataConnection>>;
};
declare global {
	type BlockData<T extends BlockModel = BlockModel> = PlacedBlockData<T>;
}

/** Methods for reading information about a block */
export default class BlockManager {
	static isActiveBlockPart(part: Instance): boolean {
		if (!this.isBlockPart(part) || part.AssemblyRootPart?.Anchored || part.Anchored || part.HasTag("Burn"))
			return false;

		return true;
	}

	static isBlockPart(part: Instance | undefined): part is BasePart & { Parent: BlockModel } {
		if (
			!part ||
			!part.Parent ||
			!part.Parent.IsA("Model") ||
			(part.Parent as Model).GetAttribute("id") === undefined
		)
			return false;
		return true;
	}

	static getBlockDataByPart(part: BasePart): PlacedBlockData | undefined {
		if (this.isBlockPart(part)) {
			return this.getBlockDataByBlockModel(part.Parent);
		}

		return;
	}

	static getIdByModel(model: BlockModel): string {
		return model.GetAttribute("id") as string;
	}
	static getUuidByModel(model: BlockModel): BlockUuid {
		return model.GetAttribute("uuid") as BlockUuid;
	}
	static getBlockDataByBlockModel(model: BlockModel): PlacedBlockData {
		return {
			instance: model,
			id: this.getIdByModel(model),
			cframe: model.GetPivot(),
			color: Serializer.Color3Serializer.deserialize(
				HttpService.JSONDecode(model.GetAttribute("color") as string) as SerializedColor,
			),
			material: Serializer.EnumMaterialSerializer.deserialize(model.GetAttribute("material") as number),
			uuid: this.getUuidByModel(model),
			connections: HttpService.JSONDecode(
				(model.GetAttribute("connections") as string | undefined) ?? "{}",
			) as PlacedBlockData["connections"],
			config: JSON.deserialize<object>((model.GetAttribute("config") as string | undefined) ?? "{}"),
		};
	}
}
