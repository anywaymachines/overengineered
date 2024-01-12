import BlockLogic from "client/base/BlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import AnchorBlockLogic from "./logic/AnchorBlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import HeliumBlockLogic from "./logic/HeliumBlockLogic";
import LampBlockLogic from "./logic/LampBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import RopeLogic from "./logic/RopeLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import SuspensionLogic from "./logic/SuspensionLogic";
import TNTBlockLogic from "./logic/TNTBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";
import OperationAndBlockLogic from "./operations/boolean/OperationAndBlockLogic";
import OperationNandBlockLogic from "./operations/boolean/OperationNandBlockLogic";
import OperationNorBlockLogic from "./operations/boolean/OperationNorBlockLogic";
import OperationNotBlockLogic from "./operations/boolean/OperationNotBlockLogic";
import OperationOrBlockLogic from "./operations/boolean/OperationOrBlockLogic";
import OperationXnorBlockLogic from "./operations/boolean/OperationXnorBlockLogic";
import OperationXorBlockLogic from "./operations/boolean/OperationXorBlockLogic";
import Multiplexer from "./operations/number/Multiplexer";
import OperationAddBlockLogic from "./operations/number/OperationAddBlockLogic";
import OperationDivBlockLogic from "./operations/number/OperationDivBlockLogic";
import OperationMulBlockLogic from "./operations/number/OperationMulBlockLogic";
import OperationSubBlockLogic from "./operations/number/OperationSubBlockLogic";

const logicRegistry: Readonly<Record<string, { new (block: PlacedBlockData): BlockLogic } | undefined>> = {
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

	multiplexer: Multiplexer,

	operationnot: OperationNotBlockLogic,
	operationand: OperationAndBlockLogic,
	operationnand: OperationNandBlockLogic,
	operationor: OperationOrBlockLogic,
	operationxor: OperationXorBlockLogic,
	operationxnor: OperationXnorBlockLogic,
	operationnor: OperationNorBlockLogic,

	operationadd: OperationAddBlockLogic,
	operationdiv: OperationDivBlockLogic,
	operationsub: OperationSubBlockLogic,
	operationmul: OperationMulBlockLogic,
};

export default logicRegistry;
