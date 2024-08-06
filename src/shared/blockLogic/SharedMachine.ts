import { RunService } from "@rbxts/services";
import { ImpactController } from "shared/block/impact/ImpactController";
import { BlockList } from "shared/blocks/Blocks";
import { VehicleSeatBlockLogic } from "shared/blocks/VehicleSeatBlock";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ObservableValue } from "shared/event/ObservableValue";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { GenericBlockLogic, PlacedBlockData2 } from "shared/blockLogic/BlockLogic";
import type { GenericBlockList } from "shared/blocks/Blocks";
import type { PlacedBlockData } from "shared/building/BlockManager";

@injectable
export class SharedMachine extends ContainerComponent<GenericBlockLogic> {
	readonly occupiedByLocalPlayer = new ObservableValue(true);
	private impactController?: ImpactController;

	constructor(
		@inject private readonly blockRegistry: BlockRegistry,
		@inject private readonly di: ReadonlyDIContainer,
	) {
		super();
	}

	/** Add blocks to the machine, initialize it and start */
	init(blocks: readonly PlacedBlockData2[]) {
		const di = this.di.beginScope();
		di.registerSingleton(this);

		for (const block of blocks) {
			const id = block.id;

			if (!this.blockRegistry.blocks.get(id)) {
				$err(`Unknown block id ${id}`);
				continue;
			}

			const logicctor = (BlockList as GenericBlockList)[id]?.logic?.ctor;
			if (!logicctor) continue;

			const logic = di.resolveForeignClass(logicctor, [block]);
			this.add(logic);
		}

		this.initialize(blocks);
		this.enable();
	}
	protected initialize(blocks: readonly PlacedBlockData[]) {
		this.initializeSpeedLimiter();
		// this.initializeBlockConnections();

		const impact = this.createImpactControllerIfNeeded(blocks);
		if (impact) {
			this.impactController = this.parent(impact);
		}
	}
	protected createImpactControllerIfNeeded(blocks: readonly PlacedBlockData[]): ImpactController | undefined {
		return this.di.resolveForeignClass(ImpactController, [blocks]);
	}

	getImpactController(): ImpactController | undefined {
		return this.impactController;
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
	// initializeBlockConnections() {
	// 	for (const inputLogic of this.getChildren()) {
	// 		if (!(inputLogic instanceof ConfigurableBlockLogic)) continue;
	// 		if (inputLogic.block.connections === undefined) continue;

	// 		for (const [connectionFrom, connection] of pairs(inputLogic.block.connections)) {
	// 			const outputLogic = this.childMap.get(connection.blockUuid);
	// 			if (!outputLogic) {
	// 				throw "No logic found for connecting block " + connection.blockUuid;
	// 			}
	// 			if (!(outputLogic instanceof ConfigurableBlockLogic)) {
	// 				throw "Connecting block is not configurable: " + connection.blockUuid;
	// 			}

	// 			const input = inputLogic.input[connectionFrom as BlockConnectionName] as BlockLogicValue<defined>;
	// 			const output = outputLogic.output[connection.connectionName] as BlockLogicValue<defined>;

	// 			output.connectTo(input);
	// 		}
	// 	}

	// 	type t = {
	// 		readonly original: BlockLogicValue<defined>;
	// 		readonly holderId: BlockUuid;
	// 		connections: readonly t[];
	// 	};

	// 	const toValue = (blockUuid: BlockUuid, logic: BlockLogicValue<defined>): t => {
	// 		return {
	// 			original: logic,
	// 			holderId: blockUuid,
	// 			connections: undefined!,
	// 		};
	// 	};

	// 	const blocksValues = new Map(
	// 		this.blocks.flatmap((b) => {
	// 			if (!(b instanceof ConfigurableBlockLogic)) {
	// 				return [];
	// 			}

	// 			return [...Objects.values(b.input), ...Objects.values(b.output)].map(
	// 				(c) => [c, toValue(b.block.uuid, c as BlockLogicValue<defined>)] as const,
	// 			);
	// 		}),
	// 	);
	// 	for (const [, t] of blocksValues) {
	// 		t.connections = t.original.connections.map((c) => blocksValues.get(c)!);
	// 	}

	// 	const grouped = BlockLogicValueGroup.group(blocksValues.values());

	// 	const mappedBlocks = new ReadonlyMap(
	// 		this.blocks
	// 			.filter((b) => b instanceof ConfigurableBlockLogic)
	// 			.map((b) => [b.block.uuid, b as ConfigurableBlockLogic<BlockConfigTypes.BothDefinitions>] as const),
	// 	);
	// 	const order = grouped.map((g) => g.map((g) => mappedBlocks.get(g.id as BlockUuid)!));

	// 	let tick = 0;
	// 	this.event.subscribe(RunService.Heartbeat, () => {
	// 		for (const group of order) {
	// 			for (const block of group) {
	// 				block.tick(tick);
	// 			}
	// 		}

	// 		tick++;
	// 	});
	// }
}
