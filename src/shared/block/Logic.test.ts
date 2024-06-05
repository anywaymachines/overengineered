import { Workspace } from "@rbxts/services";
import type { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";

export namespace _Tests {
	const parent = new Instance("Folder");
	parent.Parent = Workspace;

	function subChanged(block: ConfigurableBlockLogic<BlockConfigTypes.BothDefinitions>, blockname?: string) {
		for (const [name, input] of pairs(block.input)) {
			input.subscribe((value, prev) => print(`[in ${blockname + " "}${name}] ${prev} -> ${value}`));
		}
		for (const [name, output] of pairs(block.output)) {
			output.subscribe((value, prev) => print(`[ou ${blockname + " "}${name}] ${prev} -> ${value}`));
		}
	}

	export namespace LogicTests {
		// export function size2() {
		// 	const constant = new ConstantBlockLogic({
		// 		id: "id",
		// 		uuid: "0" as BlockUuid,
		// 		instance: new Instance("Model") as BlockModel,
		// 		config: { value: { type: "number", value: 2 } },
		// 		connections: {},
		// 	});
		// 	const combiner = new OperationVec3CombinerBlockLogic({
		// 		id: "id",
		// 		uuid: "1" as BlockUuid,
		// 		instance: new Instance("Model") as BlockModel,
		// 		config: { value_x: 1 },
		// 		connections: {
		// 			value_y: {
		// 				blockUuid: "0" as BlockUuid,
		// 				connectionName: "result" as BlockConnectionName,
		// 			},
		// 		},
		// 	});
		// 	const logics = [constant, combiner];
		// 	const machine = new SharedMachine();
		// 	for (const logic of logics) {
		// 		machine.add(logic);
		// 	}
		// 	machine.initializeBlockConnections();
		// 	machine.enable();
		// 	Assert.equals(combiner.output.result, new Vector3(1, 2, 0));
		// 	machine.destroy();
		// }
		// export function size3() {
		// 	const constant = new ConstantBlockLogic({
		// 		id: "id",
		// 		uuid: "0" as BlockUuid,
		// 		instance: new Instance("Model") as BlockModel,
		// 		config: { value: { type: "number", value: 7 } },
		// 		connections: {},
		// 	});
		// 	const combiner = new OperationVec3CombinerBlockLogic({
		// 		id: "id",
		// 		uuid: "1" as BlockUuid,
		// 		instance: new Instance("Model") as BlockModel,
		// 		config: { value_x: 1 },
		// 		connections: {
		// 			value_y: {
		// 				blockUuid: "0" as BlockUuid,
		// 				connectionName: "result" as BlockConnectionName,
		// 			},
		// 		},
		// 	});
		// 	const splitter = new OperationVec3SplitterBlockLogic({
		// 		id: "id",
		// 		uuid: "2" as BlockUuid,
		// 		instance: new Instance("Model") as BlockModel,
		// 		config: {},
		// 		connections: {
		// 			value: {
		// 				blockUuid: "1" as BlockUuid,
		// 				connectionName: "result" as BlockConnectionName,
		// 			},
		// 		},
		// 	});
		// 	subChanged(constant, "constant");
		// 	subChanged(combiner, "combiner");
		// 	subChanged(splitter, "splitter");
		// 	const logics = [constant, combiner, splitter];
		// 	const machine = new SharedMachine();
		// 	for (const logic of logics) {
		// 		machine.add(logic);
		// 	}
		// 	machine.initializeBlockConnections();
		// 	machine.enable();
		// 	Assert.equals(splitter.output.result_y, 7);
		// 	machine.destroy();
		// }
	}
}
