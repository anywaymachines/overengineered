import BlockLogic from "client/base/BlockLogic";
import AnchorBlockLogic from "./logic/AnchorBlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import HeliumBlockLogic from "./logic/HeliumBlockLogic";
import LampBlockLogic from "./logic/LampBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import OperationAndBlockLogic from "./logic/OperationAndBlockLogic";
import OperationNandBlockLogic from "./logic/OperationNandBlockLogic";
import OperationNorBlockLogic from "./logic/OperationNorBlockLogic";
import OperationNotBlockLogic from "./logic/OperationNotBlockLogic";
import OperationOrBlockLogic from "./logic/OperationOrBlockLogic";
import OperationXnorBlockLogic from "./logic/OperationXnorBlockLogic";
import OperationXorBlockLogic from "./logic/OperationXorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import RopeLogic from "./logic/RopeLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import SuspensionLogic from "./logic/SuspensionLogic";
import TNTBlockLogic from "./logic/TNTBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";

const logicRegistry: Readonly<Record<string, { new (block: BlockModel): BlockLogic } | undefined>> = {
	vehicleseat: VehicleSeatBlockLogic,
	disconnectblock: DisconnectBlockLogic,
	wing1x1: WingLogic,
	wing1x2: WingLogic,
	wing1x3: WingLogic,
	wing1x4: WingLogic,
	smallrocketengine: RocketEngineLogic,
	rocketengine: RocketEngineLogic,
	motorblock: MotorBlockLogic,
	servomotorblock: ServoMotorBlockLogic,
	rope: RopeLogic,
	heliumblock: HeliumBlockLogic,
	tnt: TNTBlockLogic,
	lamp: LampBlockLogic,
	suspensionblock: SuspensionLogic,
	anchorblock: AnchorBlockLogic,

	operationnot: OperationNotBlockLogic,
	operationand: OperationAndBlockLogic,
	operationnand: OperationNandBlockLogic,
	operationor: OperationOrBlockLogic,
	operationxor: OperationXorBlockLogic,
	operationxnor: OperationXnorBlockLogic,
	operationnor: OperationNorBlockLogic,
};

export default logicRegistry;
