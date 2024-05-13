import { BlockId } from "shared/BlockDataRegistry";
import { Serializer } from "shared/Serializer";
import { JSON, JsonSerializablePrimitive } from "shared/fixes/Json";

/** Connections to the INPUT connectors */
export type PlacedBlockLogicConnections = {
	readonly [k in BlockConnectionName]: PlacedBlockDataConnection;
};
export type PlacedBlockDataConnection = {
	/** OUTPUT block uiid */
	readonly blockUuid: BlockUuid;
	/** OUTPUT connector name */
	readonly connectionName: BlockConnectionName;
};

export type PlacedBlockConfig = {
	readonly [k in string]: JsonSerializablePrimitive & defined;
};

export type PlacedBlockData<T extends BlockModel = BlockModel> = {
	readonly instance: T;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly id: BlockId;
	readonly uuid: BlockUuid;
	readonly config: PlacedBlockConfig | undefined;
	readonly connections: PlacedBlockLogicConnections | undefined;
};
declare global {
	type BlockData<T extends BlockModel = BlockModel> = PlacedBlockData<T>;
}

interface Manager<T> {
	readonly set: (block: BlockModel, value: T) => void;
	readonly get: (block: BlockModel) => T & defined;
}

/** Methods for reading information about a block */
export namespace BlockManager {
	export function isActiveBlockPart(part: Instance): part is BasePart & { Anchored: true } {
		if (!isBlockPart(part) || !part.IsA("BasePart") || part.AssemblyRootPart?.Anchored || part.Anchored) {
			return false;
		}

		return true;
	}

	export function isBlockModel(part: Instance | undefined): part is BlockModel {
		return part !== undefined && part.IsA("Model") && part.Parent?.Name === "Blocks";
	}

	export function isBlockPart(part: Instance | undefined): boolean {
		return tryGetBlockModelByPart(part) !== undefined;
	}

	export function tryGetBlockModelByPart(part: Instance | undefined): BlockModel | undefined {
		let parent = part;
		while (parent) {
			if (isBlockModel(parent)) {
				return parent;
			}

			parent = parent.Parent;
		}
	}
	export function getBlockDataByPart(part: BasePart): PlacedBlockData | undefined {
		const block = tryGetBlockModelByPart(part);
		return block && getBlockDataByBlockModel(block);
	}

	export const manager: { readonly [k in Exclude<keyof PlacedBlockData, "instance">]: Manager<PlacedBlockData[k]> } =
		{
			id: {
				set: (block, value) => block.SetAttribute("id", value),
				get: (block) => block.GetAttribute("id") as BlockId,
			},
			uuid: {
				set: (block, value) => block.SetAttribute("uuid", value),
				get: (block) => block.GetAttribute("uuid") as BlockUuid,
			},

			material: {
				set: (block, value) =>
					block.SetAttribute("material", Serializer.EnumMaterialSerializer.serialize(value)),
				get: (block) =>
					Serializer.EnumMaterialSerializer.deserialize(block.GetAttribute("material") as SerializedEnum),
			},
			color: {
				set: (block, value) => block.SetAttribute("color", value),
				get: (block) => block.GetAttribute("color") as Color3,
			},

			config: {
				set: (block, value: PlacedBlockConfig | undefined) =>
					block.SetAttribute("config", value ? JSON.serialize(value) : undefined),
				get: (block) => {
					const attribute = block.GetAttribute("config") as string | undefined;
					if (attribute === undefined) return attribute ?? {};
					return JSON.deserialize<PlacedBlockConfig>(attribute);
				},
			},
			connections: {
				set: (block, value: PlacedBlockLogicConnections | undefined) =>
					block.SetAttribute("connections", value !== undefined ? JSON.serialize(value) : undefined),
				get: (block) => {
					const attribute = block.GetAttribute("connections") as string | undefined;
					if (attribute === undefined) return attribute ?? {};
					return JSON.deserialize<PlacedBlockLogicConnections>(attribute);
				},
			},
		};

	export function getBlockDataByBlockModel(model: BlockModel): PlacedBlockData {
		return {
			instance: model,
			id: manager.id.get(model),
			color: manager.color.get(model),
			material: manager.material.get(model),
			uuid: manager.uuid.get(model),
			connections: manager.connections.get(model) ?? {},
			config: manager.config.get(model) ?? {},
		};
	}
}
