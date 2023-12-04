import BlockLogic from "client/base/BlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";

const logicRegistry: Readonly<Record<string, { new (block: Model): BlockLogic } | undefined>> = {
	vehicleseat: VehicleSeatBlockLogic,
	disconnectblock: DisconnectBlockLogic,
	wing1x1: WingLogic,
	wing1x2: WingLogic,
	wing1x3: WingLogic,
	wing1x4: WingLogic,
	smallrocketengine: RocketEngineLogic,
	motorblock: MotorBlockLogic,
	servomotorblock: ServoMotorBlockLogic,
};

export default logicRegistry;
