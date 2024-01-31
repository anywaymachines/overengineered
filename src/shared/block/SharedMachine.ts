import { RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { BlockConfigBothDefinitions } from "shared/BlockConfigDefinitionRegistry";
import GameDefinitions from "shared/GameDefinitions";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Objects from "shared/_fixes_/objects";
import { PlacedBlockData } from "shared/building/BlockManager";
import SharedComponentBase from "shared/component/SharedComponentBase";
import SharedComponentContainer from "shared/component/SharedComponentContainer";
import ObservableValue from "shared/event/ObservableValue";
import BlockLogic from "./BlockLogic";
import ConfigurableBlockLogic from "./ConfigurableBlockLogic";
import ImpactController from "./ImpactController";
import logicRegistry from "./LogicRegistry";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";

export default class SharedMachine extends SharedComponentContainer {
	readonly blocks: BlockLogic[] = [];
	readonly occupiedByLocalPlayer = new ObservableValue(true);
	readonly destroyed = new Signal<() => void>();
	private readonly childMap = new Map<BlockUuid, ConfigurableBlockLogic<BlockConfigBothDefinitions>>();

	/** Add blocks to the machine, initialize it and start */
	init(blocks: readonly PlacedBlockData[]) {
		for (const block of blocks) {
			const id = block.id;

			if (!blockRegistry.get(id)) {
				Logger.error(`Unknown block id ${id}`);
				continue;
			}

			const ctor = logicRegistry[id];
			if (!ctor) {
				continue;
			}

			const logic = new ctor(block);
			this.add(logic);
		}

		this.initialize(blocks);
		this.enable();
	}
	protected initialize(blocks: readonly PlacedBlockData[]) {
		this.initializeSpeedLimiter();
		this.initializeBlockConnections();
		this.initializeDestructionIfNeeded(blocks);
	}
	protected initializeDestructionIfNeeded(blocks: readonly PlacedBlockData[]) {
		ImpactController.initializeBlocks(blocks);
	}

	add<T extends SharedComponentBase>(instance: T) {
		super.add(instance);

		if (instance instanceof BlockLogic) {
			(this.blocks as Writable<typeof this.blocks>).push(instance);
		}

		if (instance instanceof ConfigurableBlockLogic) {
			this.childMap.set(instance.block.uuid, instance);
			this.event.subscribeObservable(
				this.occupiedByLocalPlayer,
				(occupied) => instance.enableControls.set(occupied),
				true,
			);

			if (instance instanceof VehicleSeatBlockLogic) {
				this.event.subscribeObservable(
					instance.occupiedByLocalPlayer,
					(occupied) => this.occupiedByLocalPlayer.set(occupied),
					true,
				);
			}
		}

		return instance;
	}

	destroy() {
		this.destroyed.Fire();
		super.destroy();
	}

	initializeSpeedLimiter() {
		const seat = this.getChildren().find((c) => c instanceof VehicleSeatBlockLogic) as
			| VehicleSeatBlockLogic
			| undefined;
		if (!seat) throw "No vehicle seat";

		this.event.subscribe(RunService.Heartbeat, () => {
			// Angular speed limit
			const currentAngularVelocity = seat.vehicleSeat.AssemblyAngularVelocity;
			seat.vehicleSeat.AssemblyAngularVelocity = new Vector3(
				math.clamp(
					currentAngularVelocity.X,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
				math.clamp(
					currentAngularVelocity.Y,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
				math.clamp(
					currentAngularVelocity.Z,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
			);

			// Linear speed limit
			const currentLinearVelocity = seat.vehicleSeat.AssemblyLinearVelocity;
			seat.vehicleSeat.AssemblyLinearVelocity = new Vector3(
				math.clamp(
					currentLinearVelocity.X,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
				math.clamp(
					currentLinearVelocity.Y,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
				math.clamp(
					currentLinearVelocity.Z,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
			);
		});
	}
	initializeBlockConnections() {
		for (const inputLogic of this.getChildren()) {
			if (!(inputLogic instanceof ConfigurableBlockLogic)) continue;

			for (const [connectionFrom, connection] of Objects.pairs(inputLogic.block.connections)) {
				const outputLogic = this.childMap.get(connection.blockUuid);
				if (!outputLogic) {
					throw "No logic found for connecting block " + connection.blockUuid;
				}
				if (!(outputLogic instanceof ConfigurableBlockLogic)) {
					throw "Connecting block is not configurable: " + connection.blockUuid;
				}

				const input = inputLogic.input[connectionFrom as BlockConnectionName] as ObservableValue<
					ReturnType<(typeof inputLogic.input)[BlockConnectionName]["get"]>
				>;
				const output = outputLogic.output[connection.connectionName];

				outputLogic.event.subscribeObservable(output, (value) => input.set(value), true);
			}
		}
	}
}
