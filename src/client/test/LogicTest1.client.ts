import { Players, RunService, Workspace } from "@rbxts/services";
import { BlockLogicData } from "client/base/BlockLogic";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Machine from "client/blocks/logic/Machine";
import { BlockConfigBothDefinitions } from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import RobloxUnit from "shared/RobloxUnit";
import Objects from "shared/_fixes_/objects";
import Test from "./Test";

class OperationVec3Combiner extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationvec3combiner> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.operationvec3combiner.input>) {
		super(block, blockConfigRegistry.operationvec3combiner);

		this.input.value_x.subscribe(() => this.update());
		this.input.value_y.subscribe(() => this.update());
		this.input.value_z.subscribe(() => this.update());
	}

	private update() {
		const x = this.input.value_x.get();
		const y = this.input.value_y.get();
		const z = this.input.value_z.get();
		this.output.result.set(new Vector3(x, y, z));
	}
}

class OperationVec3Splitter extends ConfigurableBlockLogic<typeof blockConfigRegistry.operationvec3splitter> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.operationvec3splitter.input>) {
		super(block, blockConfigRegistry.operationvec3splitter);
		this.input.value.subscribe(() => this.update());
	}

	private update() {
		const value = this.input.value.get();
		this.output.result_x.set(value.X);
		this.output.result_y.set(value.Y);
		this.output.result_z.set(value.Z);
	}
}

class Constant extends ConfigurableBlockLogic<typeof blockConfigRegistry.constant> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.constant.input>) {
		super(block, blockConfigRegistry.constant);
		this.input.value.subscribe(() => this.update(), true);
	}

	private update() {
		this.output.result.set(this.input.value.get());
	}
}

class AltimeterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.altimeter> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.altimeter.input>) {
		super(block, blockConfigRegistry.altimeter);

		const update = () => {
			this.output.result.set(RobloxUnit.Studs_To_Meters(block.instance.GetPivot().Position.Y));
		};

		this.event.subscribe(RunService.Heartbeat, update);
	}
}

//

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
		const combiner = new OperationVec3Combiner({
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
		const combiner = new OperationVec3Combiner({
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
		const constant = new Constant({
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value: 2 },
			connections: {},
		});
		const combiner = new OperationVec3Combiner({
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
		const constant = new Constant({
			uuid: "0" as BlockUuid,
			instance: new Instance("Model") as BlockModel,
			config: { value: 7 },
			connections: {},
		});
		const combiner = new OperationVec3Combiner({
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
		const splitter = new OperationVec3Splitter({
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
