import { Players, RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";
import PlayerDataStorage from "client/PlayerDataStorage";
import BlockLogic from "client/base/BlockLogic";
import ComponentContainer from "client/base/ComponentContainer";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import ImpactController from "client/controller/ImpactController";
import { BlockConfigBothDefinitions } from "shared/BlockConfigDefinitionRegistry";
import GameDefinitions from "shared/GameDefinitions";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Objects from "shared/_fixes_/objects";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import logicRegistry from "../LogicRegistry";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";

export default class Machine extends ComponentContainer<BlockLogic> {
	readonly occupiedByLocalPlayer = new ObservableValue(true);
	readonly destroyed = new Signal<() => void>();
	private readonly childMap = new Map<BlockUuid, ConfigurableBlockLogic<BlockConfigBothDefinitions>>();

	constructor() {
		super();
	}

	add<T extends BlockLogic>(instance: T) {
		super.add(instance);
		if (instance instanceof ConfigurableBlockLogic) {
			this.childMap.set(instance.block.uuid, instance);

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

				outputLogic.output[connection.connectionName].autoSet(
					inputLogic.input[connectionFrom as BlockConnectionName] as ObservableValue<
						ReturnType<(typeof inputLogic.input)[BlockConnectionName]["get"]>
					>,
				);
			}
		}
	}

	static fromBlocks() {
		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const machine = new Machine();

		for (const block of SharedPlots.getPlotBlockDatas(plot)) {
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
			machine.add(logic);
		}

		machine.initializeSpeedLimiter();
		machine.initializeBlockConnections();
		if (PlayerDataStorage.config.get().impact_destruction) {
			ImpactController.initializeBlocks();
		}

		machine.enable();
		return machine;
	}
}
