import { RunService } from "@rbxts/services";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { ContainerComponent } from "shared/component/ContainerComponent";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import BlockLogic from "./BlockLogic";
import ConfigurableBlockLogic from "./ConfigurableBlockLogic";
import logicRegistry, { LogicRegistry } from "./LogicRegistry";
import ImpactController from "./impact/ImpactController";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";

export default class SharedMachine extends ContainerComponent {
	readonly blocks: BlockLogic[] = [];
	readonly occupiedByLocalPlayer = new ObservableValue(true);
	private readonly childMap = new Map<BlockUuid, ConfigurableBlockLogic<BlockConfigTypes.BothDefinitions>>();

	constructor() {
		super();

		this.children.onAdded.Connect((child) => {
			if (child instanceof BlockLogic) {
				(this.blocks as Writable<typeof this.blocks>).push(child);
			}

			if (child instanceof ConfigurableBlockLogic) {
				this.childMap.set(child.block.uuid, child);
				this.event.subscribeObservable(
					this.occupiedByLocalPlayer,
					(occupied) => child.enableControls.set(occupied),
					true,
				);

				if (child instanceof VehicleSeatBlockLogic) {
					this.event.subscribeObservable(
						child.occupiedByLocalPlayer,
						(occupied) => this.occupiedByLocalPlayer.set(occupied),
						true,
					);
				}
			}
		});
	}

	/** Add blocks to the machine, initialize it and start */
	init(blocks: readonly PlacedBlockData[]) {
		for (const block of blocks) {
			const id = block.id;

			if (!blockRegistry.get(id)) {
				Logger.error(`Unknown block id ${id}`);
				continue;
			}

			const ctor = (logicRegistry as unknown as LogicRegistry)[id as keyof LogicRegistry];
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
			if (inputLogic.block.connections === undefined) continue;

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

				outputLogic.getEvent().subscribeObservable(output, (value) => input.set(value), true);
			}
		}
	}
}
