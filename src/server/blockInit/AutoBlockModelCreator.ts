import { BlockGenerator } from "server/blockInit/BlockGenerator";
import { Objects } from "shared/fixes/objects";
import type { BlocksInitializeData } from "server/blockInit/BlocksInitializer";
import type { BlockId } from "shared/BlockDataRegistry";

interface CreateInfo {
	readonly modelTextOverride: string;
	readonly category: CategoryPath;
	readonly prefab: BlockGenerator.PrefabName;
	readonly required?: boolean;
	readonly limit?: number;
}

const prefabs = BlockGenerator.prefabNames;
const categories = {
	math: ["Logic", "Math"] as unknown as CategoryPath,
	byte: ["Logic", "Math", "Byte"] as unknown as CategoryPath,
	converterByte: ["Logic", "Converter", "Byte"] as unknown as CategoryPath,
	converterVector: ["Logic", "Converter", "Vector"] as unknown as CategoryPath,
	other: ["Logic", "Other"] as unknown as CategoryPath,
	bool: ["Logic", "Gate"] as unknown as CategoryPath,
	memory: ["Logic", "Memory"] as unknown as CategoryPath,
} as const satisfies { [k in string]: CategoryPath };

const operations = {
	constant: {
		modelTextOverride: "CONST",
		category: categories.other,
		prefab: prefabs.const,
	},

	pi: {
		modelTextOverride: "π",
		category: categories.other,
		prefab: prefabs.const,
	},
	e: {
		modelTextOverride: "e",
		category: categories.other,
		prefab: prefabs.const,
	},

	sqrt: {
		modelTextOverride: "SQRT",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	tan: {
		modelTextOverride: "TAN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	atan: {
		modelTextOverride: "ATAN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	sin: {
		modelTextOverride: "SIN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	asin: {
		modelTextOverride: "ASIN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	cos: {
		modelTextOverride: "COS",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	acos: {
		modelTextOverride: "ACOS",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	log: {
		modelTextOverride: "LOG",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	log10: {
		modelTextOverride: "LOG10",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	loge: {
		modelTextOverride: "LOG(E)",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	deg: {
		modelTextOverride: "DEG",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},
	rad: {
		modelTextOverride: "RAD",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	sign: {
		modelTextOverride: "SIGN",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	floor: {
		modelTextOverride: "FLOOR",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	ceil: {
		modelTextOverride: "CEIL",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	round: {
		modelTextOverride: "ROUND",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	abs: {
		modelTextOverride: "ABS",
		category: categories.math,
		prefab: prefabs.smallGeneric,
	},

	rand: {
		modelTextOverride: "RAND",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	clamp: {
		modelTextOverride: "CLAMP",
		category: categories.math,
		prefab: prefabs.tripleGeneric,
	},

	pow: {
		modelTextOverride: "POW",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	nsqrt: {
		modelTextOverride: "NSQRT",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	atan2: {
		modelTextOverride: "ATAN2",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	mod: {
		modelTextOverride: "MOD",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	equals: {
		modelTextOverride: "=",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	notequals: {
		modelTextOverride: "≠",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	greaterthan: {
		modelTextOverride: ">",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	greaterthanorequals: {
		modelTextOverride: "≥",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	lessthan: {
		modelTextOverride: "<",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	lessthanorequals: {
		modelTextOverride: "≤",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	add: {
		modelTextOverride: "ADD",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	sub: {
		modelTextOverride: "SUB",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	mul: {
		modelTextOverride: "MUL",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},
	div: {
		modelTextOverride: "DIV",
		category: categories.math,
		prefab: prefabs.doubleGeneric,
	},

	bytenot: {
		modelTextOverride: "BNOT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteneg: {
		modelTextOverride: "BNEG",
		category: categories.byte,
		prefab: prefabs.smallByte,
	},

	bytexor: {
		modelTextOverride: "BXOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytexnor: {
		modelTextOverride: "BXNOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteand: {
		modelTextOverride: "BAND",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytenand: {
		modelTextOverride: "BNAND",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteor: {
		modelTextOverride: "BOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytenor: {
		modelTextOverride: "BNOR",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byterotateright: {
		modelTextOverride: "ROT. RIGHT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byterotateleft: {
		modelTextOverride: "ROT. LEFT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteshiftright: {
		modelTextOverride: "Shift RIGHT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	byteshiftleft: {
		modelTextOverride: "Shift LEFT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},
	bytearithmeticshiftright: {
		modelTextOverride: "Arithmetic Shift RIGHT",
		category: categories.byte,
		prefab: prefabs.doubleByte,
	},

	xor: {
		modelTextOverride: "XOR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	xnor: {
		modelTextOverride: "XNOR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	and: {
		modelTextOverride: "AND",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	nand: {
		modelTextOverride: "NAND",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	or: {
		modelTextOverride: "OR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},
	nor: {
		modelTextOverride: "NOR",
		category: categories.bool,
		prefab: prefabs.doubleGeneric,
	},

	not: {
		modelTextOverride: "NOT",
		category: categories.bool,
		prefab: prefabs.smallGeneric,
	},

	numbertobyte: {
		modelTextOverride: "TO BYTE",
		category: categories.converterByte,
		prefab: prefabs.smallGeneric,
	},

	bytetonumber: {
		modelTextOverride: "TO NUMBER",
		category: categories.converterByte,
		prefab: prefabs.smallByte,
	},

	vec3combiner: {
		modelTextOverride: "VEC3 COMB",
		category: categories.converterVector,
		prefab: prefabs.tripleGeneric,
	},

	vec3splitter: {
		modelTextOverride: "VEC3 SPLIT",
		category: categories.converterVector,
		prefab: prefabs.tripleGeneric,
	},

	multiplexer: {
		modelTextOverride: "MUX",
		category: categories.converterVector,
		prefab: prefabs.tripleGeneric,
	},

	counter: {
		modelTextOverride: "COUNTER",
		category: categories.other,
		prefab: prefabs.x4Generic,
	},
	delayblock: {
		modelTextOverride: "DELAY",
		category: categories.other,
		prefab: prefabs.doubleGeneric,
	},
	logicmemory: {
		modelTextOverride: "MEMORY",
		category: categories.memory,
		prefab: prefabs.doubleGeneric,
	},
} as const satisfies NonGenericOperations;
export type AutoCreatedOperations = typeof operations;

type NonGenericOperations = { readonly [k in string]: CreateInfo };

export namespace AutoBlockModelCreator {
	export function create(info: BlocksInitializeData) {
		Objects.multiAwait(
			asMap(operations as NonGenericOperations).map(
				(name, data) => () => BlockGenerator.create(info, { id: name.lower() as BlockId, ...data }),
			),
		);
	}
}
