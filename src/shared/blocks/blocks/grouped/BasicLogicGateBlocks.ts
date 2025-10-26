import { Players } from "@rbxts/services";
import { t } from "engine/shared/t";
import { BlockLogic, CalculatableBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type {
	AllInputKeysToObject,
	AllOutputKeysToObject,
	BlockLogicArgs,
	BlockLogicFullBothDefinitions,
	BlockLogicInputDef,
	BlockLogicOutputDef,
	BlockLogicOutputDefs,
	BlockLogicTickContext,
	InstanceBlockLogicArgs,
} from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { LogicValueStorageContainer } from "shared/blockLogic/BlockLogicValueStorage";
import type { BlockBuilder, BlockCategoryPath, BlockModelSource } from "shared/blocks/Block";

const autoModel = (prefab: BlockCreation.Model.PrefabName, text: string, category: BlockCategoryPath) => {
	return {
		model: BlockCreation.Model.fAutoCreated(prefab, text),
		category: () => category,
	} satisfies BlockModelSource;
};
const defs = {
	bool1_bool: {
		input: {
			value: {
				displayName: "Value",
				types: BlockConfigDefinitions.bool,
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
	bool2_bool: {
		inputOrder: ["value1", "value2"],
		input: {
			value1: {
				displayName: "Value 1",
				types: BlockConfigDefinitions.bool,
			},
			value2: {
				displayName: "Value 2",
				types: BlockConfigDefinitions.bool,
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
} as const satisfies { readonly [k in string]: BlockLogicFullBothDefinitions };

namespace And {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === false || value2 === false) {
						return this.output.result.set("bool", false);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", value1 && value2);
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "and",
		displayName: "AND Gate",
		description: "Returns true when both inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "AND", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Or {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === true || value2 === true) {
						return this.output.result.set("bool", true);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", value1 || value2);
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "or",
		displayName: "OR Gate",
		description: "Returns true when either input is true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "OR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Nand {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === false || value2 === false) {
						return this.output.result.set("bool", true);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", !(value1 && value2));
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "nand",
		displayName: "NAND Gate",
		description: "Returns true while any input is false",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NAND", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Nor {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === true || value2 === true) {
						return this.output.result.set("bool", false);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", !(value1 || value2));
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "nor",
		displayName: "NOR Gate",
		description: "Returns true when none of the inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Xor {
	const definition = defs.bool2_bool;

	class Logic extends CalculatableBlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);
		}

		protected override calculate(
			{ value1, value2 }: AllInputKeysToObject<(typeof definition)["input"]>,
			ctx: BlockLogicTickContext,
		): AllOutputKeysToObject<(typeof definition)["output"]> | BlockLogicValueResults {
			return { result: { type: "bool", value: value1 !== value2 } };
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "xor",
		displayName: "XOR Gate",
		description: "Returns true when only one of the inputs is true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Xnor {
	const definition = defs.bool2_bool;

	class Logic extends CalculatableBlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);
		}

		protected override calculate(
			{ value1, value2 }: AllInputKeysToObject<(typeof definition)["input"]>,
			ctx: BlockLogicTickContext,
		): AllOutputKeysToObject<(typeof definition)["output"]> | BlockLogicValueResults {
			return { result: { type: "bool", value: !(value1 !== value2) } };
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "xnor",
		displayName: "XNOR Gate",
		description: "Returns true when both of the inputs are the same",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XNOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Not {
	const definition = defs.bool1_bool;

	class Logic extends CalculatableBlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);
		}

		protected override calculate(
			{ value }: AllInputKeysToObject<(typeof definition)["input"]>,
			ctx: BlockLogicTickContext,
		): AllOutputKeysToObject<(typeof definition)["output"]> | BlockLogicValueResults {
			return { result: { type: "bool", value: !value } };
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "not",
		displayName: "NOT Gate",
		description: "Returns true when input is false, and vice versa",
		modelSource: autoModel("GenericLogicBlockPrefab", "NOT", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Mux {
	const definitionMuxSmall = {
		inputOrder: ["value", "falsevalue", "truevalue"] as const,
		input: {
			value: {
				displayName: "State/Index",
				types: {
					number: {
						config: 0,
					},
					byte: {
						config: 0,
					},
					bool: {
						config: false,
					},
				},
			},
			truevalue: {
				displayName: "True Input",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			falsevalue: {
				displayName: "False Input",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: {
			result: {
				displayName: "Output",
				types: asMap(BlockConfigDefinitions.any).keys(),
				group: "1",
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	const definitionMuxBig = {
		inputOrder: ["value", "value1", "value2", "value3", "value4", "value5", "value6", "value7", "value8"] as const,
		input: {
			value: {
				displayName: "State/Index",
				types: {
					number: {
						config: 0,
					},
					byte: {
						config: 0,
					},
					bool: {
						config: false,
					},
				},
			},
			value1: {
				displayName: "Input 1",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value2: {
				displayName: "Input 2",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value3: {
				displayName: "Input 3",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value4: {
				displayName: "Input 4",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value5: {
				displayName: "Input 5",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value6: {
				displayName: "Input 6",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value7: {
				displayName: "Input 7",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			value8: {
				displayName: "Input 8",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: {
			result: {
				displayName: "Output",
				types: asMap(BlockConfigDefinitions.any).keys(),
				group: "1",
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	const activeColor = Color3.fromRGB(0, 255, 255);
	// const activeColor = Color3.fromRGB(0, 255, 0);
	const baseColor = Color3.fromRGB(59, 59, 59);
	const neonMaterial = Enum.Material.Neon;
	const baseMaterial = Enum.Material.Glass;

	const update = ({ lamps, index, color, sender, locallyEnabled }: UpdateData) => {
		if (sender === Players.LocalPlayer && !locallyEnabled) return;
		if (!lamps) return;

		for (let i = 0; i < lamps.size(); i++) {
			const part = lamps[i];
			if (i === index) {
				part.Color = color;
				part.Material = neonMaterial;
				continue;
			}

			part.Color = baseColor;
			part.Material = baseMaterial;
		}
	};

	const updateEventType = t.interface({
		sender: t.instance("Player"),
		block: t.instance("Model").nominal("blockModel").as<BlockModel>(),
		lamps: t.array(t.instance("BasePart")),
		index: t.number,
		color: t.color,
		locallyEnabled: t.boolean,
	});
	type UpdateData = t.Infer<typeof updateEventType>;

	const events = {
		update: new BlockSynchronizer("mux_lamp_update", updateEventType, update),
	} as const;

	type muxLamp = BasePart & {
		lamp: BasePart;
	};

	const muxValue = (
		result: LogicValueStorageContainer<BlockLogicTypes.IdListOfType<typeof BlockConfigDefinitions.any>>,
		index: number,
		values: [unknown, type: string | undefined][],
	) => {
		const len = values.size();
		if (len === 0) return;
		index = math.clamp(index, 0, len - 1);

		//set value
		if (!values[index]) {
			result.unset();
			return;
		}

		const [v, t] = values[index];
		if (v === undefined || t === undefined) {
			result.unset();
			return;
		}

		result.set(t as never, v as never);
	};

	type muxDefinitionTypes = typeof definitionMuxBig;
	class LogicMux extends BlockLogic<muxDefinitionTypes> {
		constructor(def: typeof definitionMuxBig, block: BlockLogicArgs, playerSettings?: PlayerDataStorage) {
			super(def, block);

			const allMuxLampInstances = this.instance?.FindFirstChild("Leds") as
				| (Folder & Record<`${number}`, muxLamp>)
				| undefined;
			if (!allMuxLampInstances) throw "Vas?";

			const muxLamps: BasePart[] = [];
			allMuxLampInstances.GetChildren().forEach((v) => {
				const i = tonumber(v.Name)!;
				muxLamps[i] = (v as muxLamp).lamp;
			});
			const inp: [string, `${string}Type`][] = [];
			for (const k of this.definition.inputOrder) {
				if (k === "value") continue;
				inp.push([k, `${k}Type`]);
			}

			this.onkRecalcInputsAny(this.definition.inputOrder, (inputs) => {
				if (inputs.value === undefined) return;
				let value = inputs.value;
				if (inputs.valueType === "bool") value = value ? 1 : 0;
				else value = math.floor(value as number);

				//set color
				if (!muxLamps.isEmpty() && inputs.valueChanged) {
					events.update.sendOrBurn(
						{
							sender: Players.LocalPlayer,
							block: this.instance!,
							lamps: muxLamps,
							index: value as number,
							color: activeColor,
							locallyEnabled: playerSettings?.config.get().graphics.logicEffects ?? true,
						},
						this,
					);
				}

				muxValue(
					this.output.result,
					value,
					inp.map((v) => [inputs[v[0] as never], inputs[v[1] as never]]),
				);
			});
		}
	}

	@injectable
	class BigMux extends LogicMux {
		constructor(block: BlockLogicArgs, @tryInject playerDataStorage?: PlayerDataStorage) {
			super(definitionMuxBig, block, playerDataStorage);
		}
	}
	@injectable
	class SmallMux extends LogicMux {
		constructor(block: BlockLogicArgs, @tryInject playerDataStorage?: PlayerDataStorage) {
			super(definitionMuxSmall as never, block, playerDataStorage);
		}
	}

	export const blocks = [
		{
			...BlockCreation.defaults,
			id: "multiplexer",
			displayName: "Multiplexer",
			description: "Outputs values depending on 'State' input",
			search: {
				aliases: ["mux", "if"],
			},

			logic: { definition: definitionMuxSmall, ctor: SmallMux, events },
		},
		{
			...BlockCreation.defaults,
			id: "bigmultiplexer",
			displayName: "Multiplexer x8",
			description: "Outputs values depending on 'State' input",
			search: {
				aliases: ["mux", "if"],
			},

			logic: { definition: definitionMuxBig, ctor: BigMux, events },
		},
	] as const satisfies BlockBuilder[];
}

namespace Demux {
	const definitionDemuxSmall = {
		inputOrder: ["value", "input", "defval"],
		outputOrder: ["falsevalue", "truevalue"],
		input: {
			value: {
				displayName: "State/Index",
				types: {
					number: {
						config: 0,
					},
					byte: {
						config: 0,
					},
					bool: {
						config: false,
					},
				},
			},

			input: {
				displayName: "Input",
				types: BlockConfigDefinitions.any,
				group: "1",
			},

			defval: {
				displayName: "Default",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: {
			truevalue: {
				displayName: "True Output",
				types: asMap(BlockConfigDefinitions.any).keys(),
				group: "1",
			},
			falsevalue: {
				displayName: "False Output",
				types: asMap(BlockConfigDefinitions.any).keys(),
				group: "1",
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	const demuxBigOutputs: Writable<BlockLogicOutputDefs> = {};
	for (let i = 1; i <= 8; i++) {
		demuxBigOutputs[`value${i}`] = {
			displayName: `Output ${i}`,
			types: asMap(BlockConfigDefinitions.any).keys(),
			group: "1",
		};
	}

	const definitionDemuxBig = {
		inputOrder: ["value", "input", "defval"],
		outputOrder: ["value1", "value2", "value3", "value4", "value5", "value6", "value7", "value8"],
		input: {
			value: {
				displayName: "State/Index",
				types: {
					number: {
						config: 0,
					},
					byte: {
						config: 0,
					},
					bool: {
						config: false,
					},
				},
			},

			input: {
				displayName: "Input",
				types: BlockConfigDefinitions.any,
				group: "1",
			},

			defval: {
				displayName: "Default",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: demuxBigOutputs,
	} satisfies BlockLogicFullBothDefinitions;

	const activeColor = Color3.fromRGB(0, 255, 0);
	const baseColor = Color3.fromRGB(59, 59, 59);
	const neonMaterial = Enum.Material.Neon;
	const baseMaterial = Enum.Material.Glass;

	const update = ({ lamps, index, color, sender, locallyEnabled }: UpdateData) => {
		if (sender === Players.LocalPlayer && !locallyEnabled) return;
		if (!lamps) return;

		for (let i = 0; i < lamps.size(); i++) {
			const part = lamps[i];
			if (i === index) {
				part.Color = color;
				part.Material = neonMaterial;
				continue;
			}

			part.Color = baseColor;
			part.Material = baseMaterial;
		}
	};

	const updateEventType = t.interface({
		sender: t.instance("Player"),
		block: t.instance("Model").nominal("blockModel").as<BlockModel>(),
		lamps: t.array(t.instance("BasePart")),
		index: t.number,
		color: t.color,
		locallyEnabled: t.boolean,
	});
	type UpdateData = t.Infer<typeof updateEventType>;

	const events = {
		update: new BlockSynchronizer("demux_lamp_update", updateEventType, update),
	} as const;

	type muxLamp = BasePart & {
		lamp: BasePart;
	};

	abstract class LogicDemux extends BlockLogic<typeof definitionDemuxBig> {
		constructor(def: typeof definitionDemuxBig, block: BlockLogicArgs, playerSettings?: PlayerDataStorage) {
			super(def, block);
			const allMuxLampInstances = this.instance?.FindFirstChild("Leds") as
				| (Folder & Record<`${number}`, muxLamp>)
				| undefined;
			if (!allMuxLampInstances) throw "Vas?";

			const muxLamps: BasePart[] = [];
			allMuxLampInstances.GetChildren().forEach((v) => {
				const i = tonumber(v.Name)!;
				muxLamps[i] = (v as muxLamp).lamp;
			});

			const outputs = this.definition.outputOrder.map((v) => this.output[v as keyof typeof this.output]);

			const demuxValue = (
				index: number,
				value: unknown,
				outputType: BlockLogicTypes.IdListOfType<typeof BlockConfigDefinitions.any>,
				defval?: unknown,
			) => {
				const len = outputs.size();
				if (len === 0) return;
				index = math.clamp(index, 0, len - 1);

				//set value
				for (let i = 0; i !== len; i++) {
					const out = outputs[i];
					if (i !== index || value === undefined) {
						if (defval) {
							out.set(outputType, defval as typeof outputType);
						} else {
							out.unset();
						}
						continue;
					}
					out.set(outputType, value as typeof outputType);
				}
			};

			this.onkRecalcInputsAny(
				["value", "input", "defval"],
				({ value, valueType, valueChanged, input, inputType, defval }) => {
					if (value === undefined) return;
					if (valueType === "bool") value = value ? 1 : 0;
					else value = math.floor(value as number);

					if (!muxLamps.isEmpty() && valueChanged) {
						events.update.sendOrBurn(
							{
								sender: Players.LocalPlayer,
								block: this.instance!,
								lamps: muxLamps,
								index: value as number,
								color: activeColor,
								locallyEnabled: playerSettings?.config.get().graphics.logicEffects ?? true,
							},
							this,
						);
					}

					demuxValue(value, input, inputType!, defval);
				},
			);
		}
	}

	@injectable
	class BigDemux extends LogicDemux {
		constructor(block: BlockLogicArgs, @tryInject playerDataStorage?: PlayerDataStorage) {
			super(definitionDemuxBig, block, playerDataStorage);
		}
	}
	@injectable
	class SmallDemux extends LogicDemux {
		constructor(block: BlockLogicArgs, @tryInject playerDataStorage?: PlayerDataStorage) {
			super(definitionDemuxSmall, block, playerDataStorage);
		}
	}

	export const blocks = [
		{
			...BlockCreation.defaults,
			id: "demultiplexer",
			displayName: "Demultiplexer",
			description:
				"Selects output depending on 'State/Index' input, non-indexed outputs are set to default or AVAILATER if unset",
			search: {
				aliases: ["mux", "demux"],
			},

			logic: { definition: definitionDemuxSmall, ctor: SmallDemux, events },
		},
		{
			...BlockCreation.defaults,
			id: "bigdemultiplexer",
			displayName: "Demultiplexer x8",
			description:
				"Selects output depending on 'State/Index' input, non-indexed outputs are set to default or AVAILATER if unset",
			search: {
				aliases: ["mux", "demux"],
			},

			logic: { definition: definitionDemuxBig, ctor: BigDemux, events },
		},
	] as const satisfies BlockBuilder[];
}

namespace ShiftRegisterOutput {
	const possibleTypes = asMap(BlockConfigDefinitions.any).keys();
	const outputsGenerator = (outputsAmount: number) => {
		const res: Partial<Record<`output${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}`, BlockLogicOutputDef>> = {};
		for (let i = 0; i < outputsAmount; i++) {
			res[`output${i as 0}`] = {
				displayName: `Output ${i}`,
				types: possibleTypes,
				group: "1",
			};
		}
		return res;
	};

	const outputAmount = 8;
	const outps = outputsGenerator(outputAmount);
	const definition = {
		inputOrder: ["shift", "lockOutput", "inputValue"],
		outputOrder: [...new Array(outputAmount, "output").map((v, i) => v + i), "extender"],
		input: {
			shift: {
				displayName: "Shift",
				types: BlockConfigDefinitions.bool,
			},
			lockOutput: {
				displayName: "Lock Outputs",
				types: {
					bool: {
						config: false,
					},
				},
			},
			inputValue: {
				displayName: "Input",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: {
			...(outps as { [x: string]: BlockLogicOutputDef }),
			extender: {
				displayName: `Extender Output`,
				types: possibleTypes,
				group: "1",
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			const values: (string | number | boolean | Vector3 | Color3 | BlockLogicTypes.SoundValue)[] = [];

			const shift = this.initializeInputCache("shift");
			const lockOutput = this.initializeInputCache("lockOutput");
			const val = this.initializeInputCache("inputValue");

			const updateOutputs = () => {
				const arr_len = values.size();
				const len = math.min(arr_len, outputAmount);
				if (!lockOutput.get()) {
					for (let i = 0; i < len; i++) this.output[`output${i}` as "extender"].set(val.getType(), values[i]);
				}

				if (arr_len > outputAmount) this.output.extender.set(val.getType(), values[outputAmount]);
			};

			this.onk(["lockOutput"], ({ lockOutput }) => {
				if (lockOutput) return;
				updateOutputs();
			});

			// we do shiftin' here
			this.onTicc(() => {
				if (!shift.get()) return;
				values.unshift(val.get());

				updateOutputs();

				if (values.size() > outputAmount) values.pop();
			});
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "shiftregisteroutput",
		displayName: "Shift Register (Output)",
		description: "Shifts input values while 'Shift' input is active. Can be connected serially to extends inputs",
		search: {
			aliases: ["extend", "bit"],
		},

		logic: { definition: definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace ShiftRegisterInput {
	const inputsGenerator = (outputsAmount: number) => {
		const res: Partial<Record<`input${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}`, BlockLogicInputDef>> = {};
		for (let i = 0; i < outputsAmount; i++) {
			res[`input${i as 0}`] = {
				displayName: `input ${i}`,
				types: BlockConfigDefinitions.any,
				group: "1",
			};
		}

		return res as Required<typeof res>;
	};

	const inputAmount = 8;
	const inpts = inputsGenerator(inputAmount);

	const definition = {
		inputOrder: ["shift", "lockInputs", ...new Array(inputAmount, "input").map((v, i) => v + i), "extender"],
		outputOrder: ["output"],
		input: {
			shift: {
				displayName: "Shift",
				types: BlockConfigDefinitions.bool,
			},
			lockInputs: {
				displayName: "Lock Inputs",
				types: {
					bool: {
						config: false,
					},
				},
			},
			...inpts,
			extender: {
				displayName: `Extender Input`,
				tooltip: `Not affected by the 'lock' input signal`,
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: {
			output: {
				displayName: `Extender Output`,
				types: asMap(BlockConfigDefinitions.any).keys(),
				group: "1",
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			type t = BlockLogicTypes.IdListOfType<typeof BlockConfigDefinitions.any> | undefined;
			type t2 = string | number | boolean | Vector3 | Color3 | BlockLogicTypes.SoundValue;
			// init values here

			const filler = {};
			//fill array with crap because lua arrays can't store nils
			const values: (t2 | typeof filler)[] = new Array(inputAmount, filler);
			const shift = this.initializeInputCache("shift");
			const lockInputs = this.initializeInputCache("lockInputs");

			this.onkRecalcInputsAny([...asMap(inpts).keys(), "extender"], (data) => {
				//get first type
				let ttt: t;
				for (let i = 0; i < inputAmount; i++) {
					if (ttt) break;
					ttt = data[`input${i as 0}Type`] as t;
				}
				ttt ??= data.extenderType;

				if (!lockInputs.get()) {
					for (let i = 0; i < inputAmount; i++) values[i] = (data[`input${i as 0}`] ?? filler) as t2;
					values[inputAmount] = (data.extender ?? filler) as t2;
				}

				//shift values here
				if (!ttt) return;
				if (!shift.get()) return;

				const v = values.shift();

				if (!v || v === filler) return;
				this.output.output.set(ttt, v as t2);
			});
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "shiftregisterinput",
		displayName: "Shift Register (Input)",
		description: "Shifts input values while 'Shift' input is active. Can be connected serially to extends inputs",
		search: {
			aliases: ["extend", "bit", "input"],
		},

		logic: { definition: definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

export const BasicLogicGateBlocks: readonly BlockBuilder[] = [
	And.block,
	Or.block,
	Nand.block,
	Nor.block,
	Xor.block,
	Xnor.block,
	Not.block,
	...Mux.blocks,
	...Demux.blocks,
	ShiftRegisterOutput.block,
	ShiftRegisterInput.block,
];
