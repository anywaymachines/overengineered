import BlockLogic from "client/base/BlockLogic";
import BlockRegistry from "shared/registry/BlockRegistry";
import Block from "shared/registry/abstract/Block";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";

export type AnyBlockLogic = { new (block: Model): BlockLogic };
export default class LogicRegistry {
	public static Blocks: Map<Block, AnyBlockLogic> = new Map<Block, AnyBlockLogic>();

	public static initialize() {
		this.attachLogic(BlockRegistry.get("vehicleseat"), VehicleSeatBlockLogic);
		this.attachLogic(BlockRegistry.get("disconnectblock"), DisconnectBlockLogic);

		// Wings
		this.attachLogic(BlockRegistry.get("wing1x1"), WingLogic);
		this.attachLogic(BlockRegistry.get("wing1x2"), WingLogic);
		this.attachLogic(BlockRegistry.get("wing1x3"), WingLogic);
		this.attachLogic(BlockRegistry.get("wing1x4"), WingLogic);

		// Engines
		this.attachLogic(BlockRegistry.get("smallrocketengine"), RocketEngineLogic);
		this.attachLogic(BlockRegistry.get("motorblock"), MotorBlockLogic);
		this.attachLogic(BlockRegistry.get("servomotorblock"), ServoMotorBlockLogic);
	}

	private static attachLogic(block: Block, logic: AnyBlockLogic): void {
		this.Blocks.set(block, logic);
	}
}
