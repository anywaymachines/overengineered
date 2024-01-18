import BlockLogic from "client/base/BlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import AnchorBlockLogic from "./logic/AnchorBlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import HeliumBlockLogic from "./logic/HeliumBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import RopeLogic from "./logic/RopeLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import SuspensionLogic from "./logic/SuspensionLogic";
import TNTBlockLogic from "./logic/TNTBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";
import ConstantBlockLogic from "./operations/ConstantBlockLogic";
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
import OperationEqualsBlockLogic from "./operations/number/OperationEqualsBlockLogic";
import OperationGreaterThanBlockLogic from "./operations/number/OperationGreaterThanBlockLogic";
import OperationMulBlockLogic from "./operations/number/OperationMulBlockLogic";
import OperationRoundBlockLogic from "./operations/number/OperationRoundBlockLogic";
import OperationSubBlockLogic from "./operations/number/OperationSubBlockLogic";
import OperationDegBlockLogic from "./operations/number/trigonometry/OperationDegBlockLogic";
import OperationRadBlockLogic from "./operations/number/trigonometry/OperationRadBlockLogic";
import LampBlockLogic from "./operations/output/LampBlockLogic";
import ScreenBlockLogic from "./operations/output/ScreenBlockLogic";
import AltimeterBlockLogic from "./operations/sensors/AltimeterBlockLogic";
import AngleSensorBlockLogic from "./operations/sensors/AngleSensorBlockLogic";
import KeySensorBlockLogic from "./operations/sensors/KeySensorBlockLogic";
import SpeedometerBlockLogic from "./operations/sensors/SpeedometerBlockLogic";
import OperationVec3CombinerBlockLogic from "./operations/vector/OperationVec3CombinerBlockLogic";
import OperationVec3SplitterBlockLogic from "./operations/vector/OperationVec3SplitterBlockLogic";

const logicRegistry: Readonly<Record<string, { new (block: PlacedBlockData): BlockLogic } | undefined>> = {
	wing1x1: WingLogic,
	wing1x2: WingLogic,
	wing1x3: WingLogic,
	wing1x4: WingLogic,
	wingrounding: WingLogic,
	wingsharpening: WingLogic,

	vehicleseat: VehicleSeatBlockLogic,
	disconnectblock: DisconnectBlockLogic,

	smallrocketengine: RocketEngineLogic,
	rocketengine: RocketEngineLogic,
	motorblock: MotorBlockLogic,
	servomotorblock: ServoMotorBlockLogic,
	rope: RopeLogic,
	heliumblock: HeliumBlockLogic,
	tnt: TNTBlockLogic,
	suspensionblock: SuspensionLogic,
	anchorblock: AnchorBlockLogic,

	lamp: LampBlockLogic,
	screen: ScreenBlockLogic,

	constant: ConstantBlockLogic,

	multiplexer: Multiplexer,

	speedometer: SpeedometerBlockLogic,
	anglesensor: AngleSensorBlockLogic,
	keysensor: KeySensorBlockLogic,
	altimeter: AltimeterBlockLogic,

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
	operationvec3splitter: OperationVec3SplitterBlockLogic,
	operationvec3combiner: OperationVec3CombinerBlockLogic,

	operationequals: OperationEqualsBlockLogic,
	operationgreaterthan: OperationGreaterThanBlockLogic,
	operationround: OperationRoundBlockLogic,

	operationdeg: OperationDegBlockLogic,
	operationrad: OperationRadBlockLogic,
};

export default logicRegistry;
