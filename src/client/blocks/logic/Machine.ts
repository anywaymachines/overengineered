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
import { PlacedBlockData } from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import logicRegistry from "../LogicRegistry";
import VehicleSeatBlockLogic from "./VehicleSeatBlockLogic";

export default class Machine extends ComponentContainer<BlockLogic> {
	public readonly destroyed = new Signal<() => void>();
	public readonly seat: VehicleSeatBlockLogic;

	constructor(logics: readonly BlockLogic[]) {
		super();

		const seat = logics.find((l) => l instanceof VehicleSeatBlockLogic) as VehicleSeatBlockLogic | undefined;
		if (!seat) throw "No seat found";
		this.seat = seat;

		for (const logic of logics) {
			this.add(logic);
		}

		// TODO: Option OR isPVP
		if (PlayerDataStorage.config.get().impact_destruction) {
			ImpactController.initializeBlocks();
		}

		this.event.subscribe(RunService.Heartbeat, () => {
			// Angular speed limit
			const currentAngularVelocity = this.seat.vehicleSeat.AssemblyAngularVelocity;
			this.seat.vehicleSeat.AssemblyAngularVelocity = new Vector3(
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
			const currentLinearVelocity = this.seat.vehicleSeat.AssemblyLinearVelocity;
			this.seat.vehicleSeat.AssemblyLinearVelocity = new Vector3(
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

	public add<T extends BlockLogic>(instance: T) {
		instance.machine = this;
		return super.add(instance);
	}

	public destroy() {
		this.destroyed.Fire();
		super.destroy();
	}

	public static fromBlocks() {
		const plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		const blockdatas = SharedPlots.getPlotBlockDatas(plot);
		const blocksmap = new Map(blockdatas.map((b) => [b.uuid, b] as const));
		const logicmap = new Map<PlacedBlockData, BlockLogic | ConfigurableBlockLogic<BlockConfigBothDefinitions>>();
		const logics: BlockLogic[] = [];

		for (const block of blockdatas) {
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
			logicmap.set(block, logic);
			logics.push(logic);
		}

		// initialize connections
		for (const [inputBlock, inputLogic] of logicmap) {
			if (!("input" in inputLogic)) continue;

			for (const [connectionFrom, connection] of Objects.entries(inputBlock.connections)) {
				const outputBlock = blocksmap.get(connection.blockUuid);
				if (!outputBlock) {
					throw "Unknown block to connect: " + connection.blockUuid;
				}

				const outputLogic = logicmap.get(outputBlock);
				if (!outputLogic) {
					throw "No logic found for connecting block " + connection.blockUuid;
				}
				if (!("input" in outputLogic)) {
					throw "Connecting block is not configurable: " + connection.blockUuid;
				}

				outputLogic.output[connection.connectionName].autoSet(
					inputLogic.input[connectionFrom] as ObservableValue<
						ReturnType<(typeof inputLogic.input)[typeof connectionFrom]["get"]>
					>,
				);
			}
		}

		const machine = new Machine(logics);
		machine.enable();

		return machine;
	}
}
