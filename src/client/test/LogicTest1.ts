import { RunService, Workspace } from "@rbxts/services";
import ComponentContainer from "client/base/ComponentContainer";
import blockConfigRegistryClient from "client/blocks/config/BlockConfigRegistryClient";
import BlockConfig from "shared/BlockConfig";
import {
	BlockConfigBothDefinitions,
	BlockConfigDefinition,
	BlockConfigDefinitions,
	BlockConfigDefinitionsToConfig,
} from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import RobloxUnit from "shared/RobloxUnit";
import Objects from "shared/_fixes_/objects";
import { PlacedBlockDataConnection } from "shared/building/BlockManager";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import Test from "./Test";

interface B<TDef extends BlockConfigDefinitions> {
	readonly uuid: BlockUuid;
	readonly config: Partial<BlockConfigDefinitionsToConfig<TDef>>;
	readonly connections: Readonly<Partial<Record<keyof TDef, PlacedBlockDataConnection>>>;
}
interface BI<TDef extends BlockConfigDefinitions> extends B<TDef> {
	readonly instance: BlockModel;
}

class BL extends ComponentContainer {}
class CBL<TDef extends BlockConfigBothDefinitions> extends BL {
	readonly enableControls = new ObservableValue(false);
	readonly input: {
		readonly [k in keyof TDef["input"]]: ReadonlyObservableValue<TDef["input"][k]["default"]>;
	};
	readonly output: {
		readonly [k in keyof TDef["output"]]: ObservableValue<TDef["output"][k]["default"]>;
	};
	readonly block: B<TDef["input"]>;

	constructor(block: B<TDef["input"]>, configDefinition: TDef) {
		super();

		this.block = block;

		const config = BlockConfig.addDefaults(block.config, configDefinition.input);
		const createInput = (key: string, definition: BlockConfigDefinition) => {
			const connected = key in block.connections;
			if (connected) {
				return blockConfigRegistryClient[definition.type].createObservable(definition as never);
			}

			const input = this.add(
				new blockConfigRegistryClient[definition.type].input(config[key] as never, definition as never),
			);

			this.event.subscribeObservable(
				this.enableControls,
				(enabled) => {
					if (enabled) input.enable();
					else input.disable();
				},
				true,
			);

			return input.value;
		};

		this.input = Objects.fromEntries(
			Objects.entries(configDefinition.input).map((d) => [d[0], createInput(d[0], d[1])] as const),
		) as typeof this.input;

		this.output = Objects.fromEntries(
			Objects.entries(configDefinition.output).map(
				(d) => [d[0], blockConfigRegistryClient[d[1].type].createObservable(d[1] as never)] as const,
			),
		) as typeof this.output;
	}
}
class BCBL<TDef extends BlockConfigBothDefinitions> extends CBL<TDef> {
	readonly block;

	constructor(block: BI<TDef["input"]>, configDefinition: TDef) {
		super(block, configDefinition);
		this.block = block;

		this.block.instance.GetPropertyChangedSignal("Parent").Connect(() => {
			if (this.block.instance.Parent) return;
			this.destroy();
		});
	}
}

class OperationVec3Combiner extends CBL<typeof blockConfigRegistry.operationvec3combiner> {
	constructor(block: B<typeof blockConfigRegistry.operationvec3combiner.input>) {
		super(block, blockConfigRegistry.operationvec3combiner);

		this.event.subscribeObservable(this.input.value_x, () => this.update());
		this.event.subscribeObservable(this.input.value_y, () => this.update());
		this.event.subscribeObservable(this.input.value_z, () => this.update());
	}

	private update() {
		const x = this.input.value_x.get();
		const y = this.input.value_y.get();
		const z = this.input.value_z.get();
		print("UPDATE combiner " + `${x} ${y} ${z}`);
		this.output.result.set(new Vector3(x, y, z));
	}
}

class OperationVec3Splitter extends CBL<typeof blockConfigRegistry.operationvec3splitter> {
	constructor(block: B<typeof blockConfigRegistry.operationvec3splitter.input>) {
		super(block, blockConfigRegistry.operationvec3splitter);
		this.event.subscribeObservable(this.input.value, () => this.update());
	}

	private update() {
		const value = this.input.value.get();
		print("UPDATE splitter " + value);
		this.output.result_x.set(value.X);
		this.output.result_y.set(value.Y);
		this.output.result_z.set(value.Z);
	}
}

class Constant extends CBL<typeof blockConfigRegistry.constant> {
	constructor(block: B<typeof blockConfigRegistry.constant.input>) {
		super(block, blockConfigRegistry.constant);
		this.event.subscribeObservable(this.input.value, () => this.update(), true);
	}

	private update() {
		this.output.result.set(this.input.value.get());
	}
}

class AltimeterBlockLogic extends BCBL<typeof blockConfigRegistry.altimeter> {
	constructor(block: BI<typeof blockConfigRegistry.altimeter.input>) {
		super(block, blockConfigRegistry.altimeter);

		const update = () => {
			this.output.result.set(RobloxUnit.Studs_To_Meters(block.instance.GetPivot().Position.Y));
		};

		this.event.subscribe(RunService.Heartbeat, update);
	}
}

class Machine extends ComponentContainer<BL> {
	private readonly childMap = new Map<BlockUuid, CBL<BlockConfigBothDefinitions>>();

	constructor() {
		super();
	}

	add<T extends BL>(instance: T) {
		super.add(instance);
		if (instance instanceof CBL) {
			this.childMap.set(instance.block.uuid, instance);
		}

		return instance;
	}

	initializeBlockConnections() {
		for (const inputLogic of this.getChildren()) {
			if (!(inputLogic instanceof CBL)) continue;

			for (const [connectionFrom, connection] of Objects.entries(inputLogic.block.connections)) {
				const outputLogic = this.childMap.get(connection.blockUuid);
				if (!outputLogic) {
					throw "No logic found for connecting block " + connection.blockUuid;
				}
				if (!(outputLogic instanceof CBL)) {
					throw "Connecting block is not configurable: " + connection.blockUuid;
				}

				outputLogic.output[connection.connectionName].autoSet(
					inputLogic.input[connectionFrom as BlockConnectionName] as ObservableValue<
						ReturnType<(typeof inputLogic.input)[BlockConnectionName]["get"]>
					>,
				);
			}
		}
	}
}

export default class LogicTest1 {
	static start() {
		print("--- test ---");
		const parent = new Instance("Folder");
		parent.Parent = Workspace;

		{
			const combiner = new OperationVec3Combiner({
				uuid: "0" as BlockUuid,
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
		}

		{
			const constant = new Constant({
				uuid: "0" as BlockUuid,
				config: { value: 2 },
				connections: {},
			});
			const combiner = new OperationVec3Combiner({
				uuid: "1" as BlockUuid,
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
		}

		{
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
		}

		{
			const constant = new Constant({
				uuid: "0" as BlockUuid,
				config: { value: 7 },
				connections: {},
			});
			const combiner = new OperationVec3Combiner({
				uuid: "1" as BlockUuid,
				config: { value_x: 1 },
				connections: {
					value_y: {
						blockUuid: "0" as BlockUuid,
						connectionName: "result" as BlockConnectionName,
					},
				},
			});
			const divider = new OperationVec3Splitter({
				uuid: "2" as BlockUuid,
				config: {},
				connections: {
					value: {
						blockUuid: "1" as BlockUuid,
						connectionName: "result" as BlockConnectionName,
					},
				},
			});

			const logics = [constant, combiner, divider];
			const machine = new Machine();
			for (const logic of logics) {
				machine.add(logic);
			}

			machine.initializeBlockConnections();
			machine.enable();
			print(divider.output.result_y.get());
			Test.ensureEquals(divider.output.result_y, 7);
			machine.destroy();
		}

		parent.Destroy();
		print("--- test end ---");
	}
}
