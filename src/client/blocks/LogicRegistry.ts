import BlockLogic from "client/base/BlockLogic";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";

export type AnyBlockLogic = { new (block: Model): BlockLogic };
export default class LogicRegistry {
	public static Blocks: Map<AbstractBlock, AnyBlockLogic> = new Map<AbstractBlock, AnyBlockLogic>();

	public static initialize() {
		this.attachLogic(BlockRegistry.VEHICLE_SEAT, VehicleSeatBlockLogic);
		this.attachLogic(BlockRegistry.DISCONNECT_BLOCK, DisconnectBlockLogic);
	}

	private static attachLogic(block: AbstractBlock, logic: AnyBlockLogic): void {
		this.Blocks.set(block, logic);
	}
}
