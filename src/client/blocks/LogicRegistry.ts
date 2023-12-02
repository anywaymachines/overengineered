import BlockLogic from "client/base/BlockLogic";
import BlockRegistry from "shared/registry/BlocksRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import WingLogic from "./logic/WingLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";

export type AnyBlockLogic = { new (block: Model): BlockLogic };
export default class LogicRegistry {
	public static Blocks: Map<AbstractBlock, AnyBlockLogic> = new Map<AbstractBlock, AnyBlockLogic>();

	public static initialize() {
		this.attachLogic(BlockRegistry.VEHICLE_SEAT, VehicleSeatBlockLogic);
		this.attachLogic(BlockRegistry.DISCONNECT_BLOCK, DisconnectBlockLogic);

		// Wings
		this.attachLogic(BlockRegistry.WING1x1, WingLogic);
		this.attachLogic(BlockRegistry.WING1x2, WingLogic);
		this.attachLogic(BlockRegistry.WING1x3, WingLogic);
		this.attachLogic(BlockRegistry.WING1x4, WingLogic);

		// Engines
		this.attachLogic(BlockRegistry.SMALL_ROCKET_ENIGNE, RocketEngineLogic);
		this.attachLogic(BlockRegistry.MOTOR_BLOCK, MotorBlockLogic);
		this.attachLogic(BlockRegistry.SERVOMOTOR_BLOCK, ServoMotorBlockLogic);
	}

	private static attachLogic(block: AbstractBlock, logic: AnyBlockLogic): void {
		this.Blocks.set(block, logic);
	}
}
