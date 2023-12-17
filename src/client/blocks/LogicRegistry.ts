import BlockLogic from "client/base/BlockLogic";
import Objects from "shared/_fixes_/objects";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import HeliumBlockLogic from "./logic/HeliumBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import RopeLogic from "./logic/RopeLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import TNTBlockLogic from "./logic/TNTBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";

type BlockLogicCtor = { new (block: Model): BlockLogic };
type BlockConfigCtor = BlockLogicCtor & { getConfigDefinition(): ConfigTypesToDefinition<ConfigValueTypes> };

const logicRegistry: Readonly<Record<string, BlockLogicCtor | undefined>> = {
	vehicleseat: VehicleSeatBlockLogic,
	disconnectblock: DisconnectBlockLogic,
	wing1x1: WingLogic,
	wing1x2: WingLogic,
	wing1x3: WingLogic,
	wing1x4: WingLogic,
	smallrocketengine: RocketEngineLogic,
	motorblock: MotorBlockLogic,
	servomotorblock: ServoMotorBlockLogic,
	rope: RopeLogic,
	heliumblock: HeliumBlockLogic,
	tnt: TNTBlockLogic,
};

export const blockConfigRegistry = Objects.fromEntries(
	Objects.entries(logicRegistry)
		.map((e) => [e[0], e[1] as BlockConfigCtor] as const)
		.filter((e) => "getConfigDefinition" in e[1])
		.map((e) => [e[0], e[1].getConfigDefinition()] as const),
);

export default logicRegistry;
