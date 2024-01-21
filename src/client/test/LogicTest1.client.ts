import { Players, Workspace } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Machine from "client/blocks/logic/Machine";
import ConstantBlockLogic from "client/blocks/operations/ConstantBlockLogic";
import AltimeterBlockLogic from "client/blocks/operations/sensors/AltimeterBlockLogic";
import OperationVec3CombinerBlockLogic from "client/blocks/operations/vector/OperationVec3CombinerBlockLogic";
import OperationVec3SplitterBlockLogic from "client/blocks/operations/vector/OperationVec3SplitterBlockLogic";
import { BlockConfigBothDefinitions } from "shared/BlockConfigDefinitionRegistry";
import RobloxUnit from "shared/RobloxUnit";
import Objects from "shared/_fixes_/objects";
import Test from "./Test";

const parent = new Instance("Folder");
parent.Parent = Workspace;

const subChanged = (block: ConfigurableBlockLogic<BlockConfigBothDefinitions>, blockname?: string) => {
	for (const [name, input] of Objects.pairs(block.input)) {
		input.subscribe((value, prev) => print(`[in ${blockname + " "}${name}] ${prev} -> ${value}`));
	}
	for (const [name, output] of Objects.pairs(block.output)) {
		output.subscribe((value, prev) => print(`[ou ${blockname + " "}${name}] ${prev} -> ${value}`));
	}
};

const LogicTest1 = {
	altimeter() {
		const altimeterInstance = new Instance("Model") as BlockModel;
		altimeterInstance.PivotTo(new CFrame(0, 5, 0));
		altimeterInstance.Parent = parent;

		const altimeter = new AltimeterBlockLogic({
			instance: altimeterInstance,
			uuid: "0" as BlockUuid,
			config: {},
			connections: {},
		});
		const combiner = new OperationVec3CombinerBlockLogic({
			uuid: "1" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value_x: 1 },
			connections: {
				value_y: {
					blockUuid: "0" as BlockUuid,
					connectionName: "result" as BlockConnectionName,
				},
			},
		});

		const logics = [altimeter, combiner];
		const machine = new Machine();
		for (const logic of logics) {
			machine.add(logic);
		}

		machine.initializeBlockConnections();
		machine.enable();

		task.wait();
		task.wait();
		Test.ensureEquals(altimeterInstance.GetPivot().Y, 5);
		Test.ensureEquals(combiner.output.result, new Vector3(1, RobloxUnit.Studs_To_Meters(5), 0));
		machine.destroy();
	},
	size1() {
		const combiner = new OperationVec3CombinerBlockLogic({
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value_x: 1 },
			connections: {},
		});

		const logics = [combiner];
		const machine = new Machine();
		for (const logic of logics) {
			machine.add(logic);
		}

		machine.initializeBlockConnections();
		machine.enable();
		Test.ensureEquals(combiner.output.result, new Vector3(1, 0, 0));
		machine.destroy();
	},
	size2() {
		const constant = new ConstantBlockLogic({
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value: 2 },
			connections: {},
		});
		const combiner = new OperationVec3CombinerBlockLogic({
			uuid: "1" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value_x: 1 },
			connections: {
				value_y: {
					blockUuid: "0" as BlockUuid,
					connectionName: "result" as BlockConnectionName,
				},
			},
		});

		const logics = [constant, combiner];
		const machine = new Machine();
		for (const logic of logics) {
			machine.add(logic);
		}

		machine.initializeBlockConnections();
		machine.enable();
		Test.ensureEquals(combiner.output.result, new Vector3(1, 2, 0));
		machine.destroy();
	},
	size3() {
		const constant = new ConstantBlockLogic({
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value: 7 },
			connections: {},
		});
		const combiner = new OperationVec3CombinerBlockLogic({
			uuid: "1" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value_x: 1 },
			connections: {
				value_y: {
					blockUuid: "0" as BlockUuid,
					connectionName: "result" as BlockConnectionName,
				},
			},
		});
		const splitter = new OperationVec3SplitterBlockLogic({
			uuid: "2" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: {},
			connections: {
				value: {
					blockUuid: "1" as BlockUuid,
					connectionName: "result" as BlockConnectionName,
				},
			},
		});

		subChanged(constant, "constant");
		subChanged(combiner, "combiner");
		subChanged(splitter, "splitter");

		const logics = [constant, combiner, splitter];
		const machine = new Machine();
		for (const logic of logics) {
			machine.add(logic);
		}

		machine.initializeBlockConnections();
		machine.enable();
		Test.ensureEquals(splitter.output.result_y, 7);
		machine.destroy();
	},
};

const test = true;
if (Players.LocalPlayer.Name === "i3ymm" && test) {
	print("--- test ---");
	for (const [name, test] of pairs(LogicTest1)) {
		print(`--- Running ${name} ---`);

		try {
			test();
		} catch (err) {
			throw "Error in test " + name + ": " + err;
		}
	}

	print("--- test end ---");
}

parent.Destroy();
