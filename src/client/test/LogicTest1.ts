import { Workspace } from "@rbxts/services";
import Machine from "client/blocks/Machine";
import RobloxUnit from "shared/RobloxUnit";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import ConstantBlockLogic from "shared/block/logic/operations/ConstantBlockLogic";
import AltimeterBlockLogic from "shared/block/logic/operations/sensors/AltimeterBlockLogic";
import OperationVec3CombinerBlockLogic from "shared/block/logic/operations/vector/OperationVec3CombinerBlockLogic";
import OperationVec3SplitterBlockLogic from "shared/block/logic/operations/vector/OperationVec3SplitterBlockLogic";
import Objects from "shared/fixes/objects";
import { Assert } from "./Assert";

const parent = new Instance("Folder");
parent.Parent = Workspace;

const subChanged = (block: ConfigurableBlockLogic<BlockConfigTypes.BothDefinitions>, blockname?: string) => {
	for (const [name, input] of Objects.pairs(block.input)) {
		input.subscribe((value, prev) => print(`[in ${blockname + " "}${name}] ${prev} -> ${value}`));
	}
	for (const [name, output] of Objects.pairs(block.output)) {
		output.subscribe((value, prev) => print(`[ou ${blockname + " "}${name}] ${prev} -> ${value}`));
	}
};

export const LogicTests = {
	altimeter() {
		const altimeterInstance = new Instance("Model") as BlockModel;
		altimeterInstance.PivotTo(new CFrame(0, 5, 0));
		altimeterInstance.Parent = parent;

		const altimeter = new AltimeterBlockLogic({
			id: "id",
			instance: altimeterInstance,
			uuid: "0" as BlockUuid,
			config: {},
			connections: {},
		});
		const combiner = new OperationVec3CombinerBlockLogic({
			id: "id",
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
		Assert.equals(altimeterInstance.GetPivot().Y, 5);
		Assert.equals(combiner.output.result, new Vector3(1, RobloxUnit.Studs_To_Meters(5), 0));
		machine.destroy();
	},
	size1() {
		const combiner = new OperationVec3CombinerBlockLogic({
			id: "id",
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
		Assert.equals(combiner.output.result, new Vector3(1, 0, 0));
		machine.destroy();
	},
	size2() {
		const constant = new ConstantBlockLogic({
			id: "id",
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value: { type: "number", value: 2 } },
			connections: {},
		});
		const combiner = new OperationVec3CombinerBlockLogic({
			id: "id",
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
		Assert.equals(combiner.output.result, new Vector3(1, 2, 0));
		machine.destroy();
	},
	size3() {
		const constant = new ConstantBlockLogic({
			id: "id",
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value: { type: "number", value: 7 } },
			connections: {},
		});
		const combiner = new OperationVec3CombinerBlockLogic({
			id: "id",
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
			id: "id",
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
		Assert.equals(splitter.output.result_y, 7);
		machine.destroy();
	},
};
