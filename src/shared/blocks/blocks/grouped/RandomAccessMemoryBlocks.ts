import { Objects } from "engine/shared/fixes/Objects";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const randomAccessMemoryDefinition = {
	inputOrder: ["read", "write", "address", "value", "clear"],
	outputOrder: ["result", "size"],
	input: {
		read: {
			displayName: "Read",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		write: {
			displayName: "Write",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		address: {
			displayName: "Address",
			types: {
				number: {
					config: 0,
				},
			},
		},
		value: {
			displayName: "Input",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
		clear: {
			displayName: "Clear",
			types: BlockConfigDefinitions.bool,
			configHidden: true,
		},
	},
	output: {
		size: {
			displayName: "Size",
			types: ["number"],
		},
		result: {
			displayName: "Output",
			types: Objects.keys(BlockConfigDefinitions.any),
			group: "1",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

const dualPortRandomAccessMemoryBlockDefinition = {
	inputOrder: ["read", "write", "writeAddress", "readAddress", "value", "clear"],
	outputOrder: ["result", "size"],

	input: {
		read: {
			displayName: "Read",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		write: {
			displayName: "Write",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		writeAddress: {
			displayName: "Write Address",
			types: {
				number: { config: 0 },
			},
		},
		readAddress: {
			displayName: "Read Address",
			types: {
				number: { config: 0 },
			},
		},
		value: {
			displayName: "Input",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
		clear: {
			displayName: "Clear",
			types: BlockConfigDefinitions.bool,
			configHidden: true,
		},
	},
	output: {
		...randomAccessMemoryDefinition.output,
	},
} satisfies BlockLogicFullBothDefinitions;

export const size = 0xffff;

type PrimitiveKeys = keyof BlockLogicTypes.Primitives;

abstract class LogicShared<TDef extends BlockLogicFullBothDefinitions> extends BlockLogic<TDef> {
	protected readonly internalMemory: {
		[k in number]: { readonly value: unknown; readonly type: PrimitiveKeys };
	} = {};

	constructor(definition: TDef, block: BlockLogicArgs) {
		super(definition, block);
		this.output.size.set("number", 0);
		this.onk(["clear"], ({ clear, clearChanged }) => {
			if (clearChanged && clear) {
				asMap(this.internalMemory).clear();

				this.output.result.unset();
				this.output.size.set("number", 0);
			}
		});
	}

	isReady(address: number) {
		const isInRange = address <= size && address >= 0;
		if (!isInRange) {
			this.disableAndBurn();
		}

		return isInRange;
	}

	readValue(address: number) {
		if (!this.isReady(address)) return;

		const value = this.internalMemory[address];
		if (value === undefined) {
			this.output.result.unset();
			return;
		}

		this.output.result.set(value.type as "string", value.value as string);
	}

	writeValue(address: number, value: unknown, valueType: PrimitiveKeys) {
		if (!this.isReady(address)) return;

		this.internalMemory[address] = { value, type: valueType };
		this.output.size.set("number", asMap(this.internalMemory).size());
	}
}

class RandomAccessMemoryBlock extends LogicShared<typeof randomAccessMemoryDefinition> {
	constructor(block: BlockLogicArgs) {
		super(randomAccessMemoryDefinition, block);
		this.onk(["read", "write", "address", "value"], ({ read, write, address, value, valueType }) => {
			if (write) this.writeValue(address, value, valueType);
			if (read) this.readValue(address);
		});
	}
}

class DualPortRandomAccessMemoryBlock extends LogicShared<typeof dualPortRandomAccessMemoryBlockDefinition> {
	constructor(block: BlockLogicArgs) {
		super(dualPortRandomAccessMemoryBlockDefinition, block);
		this.onk(
			["read", "readAddress", "write", "writeAddress", "value"],
			({ read, readAddress, write, writeAddress, value, valueType }) => {
				if (write) this.writeValue(writeAddress, value, valueType);
				if (read) this.readValue(readAddress);
			},
		);
	}
}

export const RandomAccessMemoryBlocks = [
	{
		...BlockCreation.defaults,
		id: "randomaccessmemory",
		displayName: "RAM",
		description: `An addressed memory. Allows you to store up to ${size + 1} values`,
		search: {
			partialAliases: ["random access memory"],
		},

		logic: { definition: randomAccessMemoryDefinition, ctor: RandomAccessMemoryBlock },
	},
	{
		...BlockCreation.defaults,
		id: "dualportrandomaccessmemory",
		displayName: "DPRAM",
		description: `A dual-ported addressed memory. Allows you to store up to ${size + 1} values`,
		search: {
			partialAliases: ["dual port random access memory"],
		},
		logic: { definition: dualPortRandomAccessMemoryBlockDefinition, ctor: DualPortRandomAccessMemoryBlock },
	},
] as const satisfies BlockBuilder[];
