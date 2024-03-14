import Serializer from "shared/Serializer";
import JSON, { JsonSerializablePrimitive } from "shared/fixes/Json";

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
	readonly [k in string]: JsonSerializablePrimitive;
};

export type PlacedBlockData<T extends BlockModel = BlockModel> = {
	readonly instance: T;
	readonly color: Color3;
	readonly material: Enum.Material;
	readonly id: string;
	readonly uuid: BlockUuid;
	readonly config: PlacedBlockConfig; // TODO: set to undefined
	readonly connections: PlacedBlockLogicConnections; // TODO: set to undefined
};
declare global {
	type BlockData<T extends BlockModel = BlockModel> = PlacedBlockData<T>;
}

interface Manager<T> {
	readonly set: (block: BlockModel, value: T) => void;
	readonly get: (block: BlockModel) => T;
}

/** Methods for reading information about a block */
export default class BlockManager {
	static isActiveBlockPart(part: Instance): boolean {
		if (!this.isBlockPart(part) || part.AssemblyRootPart?.Anchored || part.Anchored /*|| part.HasTag("Burn")*/)
			return false;

		return true;
	}

	static isBlockModel(part: Instance | undefined): part is BlockModel {
		return part !== undefined && part.Parent?.Name === "Blocks";
	}

	static isBlockPart(part: Instance | undefined): part is BasePart & { Parent: BlockModel } {
		if (
			!part ||
			!part.Parent ||
			!part.Parent.IsA("Model") ||
			this.manager.id.get(part.Parent as BlockModel) === undefined
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

	static readonly manager = {
		id: {
			set: (block, value) => block.SetAttribute("id", value),
			get: (block) => block.GetAttribute("id") as string,
		},
		uuid: {
			set: (block, value) => block.SetAttribute("uuid", value),
			get: (block) => block.GetAttribute("uuid") as BlockUuid,
		},

		material: {
			set: (block, value) => block.SetAttribute("material", Serializer.EnumMaterialSerializer.serialize(value)),
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
	} as const satisfies { [k in Exclude<keyof PlacedBlockData, "instance">]: Manager<PlacedBlockData[k]> };

	static getBlockDataByBlockModel(model: BlockModel): PlacedBlockData {
		return {
			instance: model,
			id: this.manager.id.get(model),
			color: this.manager.color.get(model),
			material: this.manager.material.get(model),
			uuid: this.manager.uuid.get(model),
			connections: this.manager.connections.get(model) ?? {},
			config: this.manager.config.get(model) ?? {},
		};
	}
}
