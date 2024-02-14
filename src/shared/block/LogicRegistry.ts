import { PlacedBlockData } from "shared/building/BlockManager";
import BlockLogic from "./BlockLogic";
import AnchorBlockLogic from "./logic/AnchorBlockLogic";
import DisconnectBlockLogic from "./logic/DisconnectBlockLogic";
import HeliumBlockLogic from "./logic/HeliumBlockLogic";
import MagnetBlockLogic from "./logic/MagnetBlockLogic";
import MotorBlockLogic from "./logic/MotorBlockLogic";
import RocketEngineLogic from "./logic/RocketEngineLogic";
import RopeLogic from "./logic/RopeLogic";
import ServoMotorBlockLogic from "./logic/ServoMotorBlockLogic";
import SuspensionLogic from "./logic/SuspensionLogic";
import TNTBlockLogic from "./logic/TNTBlockLogic";
import VehicleSeatBlockLogic from "./logic/VehicleSeatBlockLogic";
import WingLogic from "./logic/WingLogic";
import ConstantBlockLogic from "./logic/operations/ConstantBlockLogic";
import DelayBlockLogic from "./logic/operations/DelayBlockLogic";
import OperationAndBlockLogic from "./logic/operations/boolean/OperationAndBlockLogic";
import OperationBufferBlockLogic from "./logic/operations/boolean/OperationBufferBlockLogic";
import OperationNandBlockLogic from "./logic/operations/boolean/OperationNandBlockLogic";
import OperationNorBlockLogic from "./logic/operations/boolean/OperationNorBlockLogic";
import OperationNotBlockLogic from "./logic/operations/boolean/OperationNotBlockLogic";
import OperationOrBlockLogic from "./logic/operations/boolean/OperationOrBlockLogic";
import OperationXnorBlockLogic from "./logic/operations/boolean/OperationXnorBlockLogic";
import OperationXorBlockLogic from "./logic/operations/boolean/OperationXorBlockLogic";
import CounterBlockLogic from "./logic/operations/memory/CounterBlockLogic";
import LogicMemoryBlockLogic from "./logic/operations/memory/LogicMemoryBlockLogic";
import RandomAccessMemoryBlockLogic from "./logic/operations/memory/RandomAccessMemoryBlockLogic";
import StackMemoryBlockLogic from "./logic/operations/memory/StackMemoryBlockLogic";
import Multiplexer from "./logic/operations/number/Multiplexer";
import OperationAbsBlockLogic from "./logic/operations/number/OperationAbsBlockLogic";
import OperationAddBlockLogic from "./logic/operations/number/OperationAddBlockLogic";
import OperationClampBlockLogic from "./logic/operations/number/OperationClampBlockLogic";
import OperationDivBlockLogic from "./logic/operations/number/OperationDivBlockLogic";
import OperationEqualsBlockLogic from "./logic/operations/number/OperationEqualsBlockLogic";
import OperationGreaterThanBlockLogic from "./logic/operations/number/OperationGreaterThanBlockLogic";
import OperationModBlockLogic from "./logic/operations/number/OperationModBlockLogic";
import OperationMulBlockLogic from "./logic/operations/number/OperationMulBlockLogic";
import OperationRoundBlockLogic from "./logic/operations/number/OperationRoundBlockLogic";
import OperationSignBlockLogic from "./logic/operations/number/OperationSignBlockLogic";
import OperationSubBlockLogic from "./logic/operations/number/OperationSubBlockLogic";
import OperationDegBlockLogic from "./logic/operations/number/trigonometry/OperationDegBlockLogic";
import OperationRadBlockLogic from "./logic/operations/number/trigonometry/OperationRadBlockLogic";
import LampBlockLogic from "./logic/operations/output/LampBlockLogic";
import ScreenBlockLogic from "./logic/operations/output/ScreenBlockLogic";
import AccelerometerBlockLogic from "./logic/operations/sensors/AccelerometerBlockLogic";
import AltimeterBlockLogic from "./logic/operations/sensors/AltimeterBlockLogic";
import AngleSensorBlockLogic from "./logic/operations/sensors/AngleSensorBlockLogic";
import KeySensorBlockLogic from "./logic/operations/sensors/KeySensorBlockLogic";
import SpeedometerBlockLogic from "./logic/operations/sensors/SpeedometerBlockLogic";
import LidarSensorBlockLogic from "./logic/operations/sensors/UltrasonicSensorBlockLogic";
import OperationVec3CombinerBlockLogic from "./logic/operations/vector/OperationVec3CombinerBlockLogic";
import OperationVec3SplitterBlockLogic from "./logic/operations/vector/OperationVec3SplitterBlockLogic";

const logicRegistry = {
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
	magnet: MagnetBlockLogic,

	lamp: LampBlockLogic,
	screen: ScreenBlockLogic,

	constant: ConstantBlockLogic,
	delayblock: DelayBlockLogic,
	counter: CounterBlockLogic,

	multiplexer: Multiplexer,

	speedometer: SpeedometerBlockLogic,
	anglesensor: AngleSensorBlockLogic,
	keysensor: KeySensorBlockLogic,
	altimeter: AltimeterBlockLogic,
	accelerometer: AccelerometerBlockLogic,
	lidarsensor: LidarSensorBlockLogic,

	logicmemory: LogicMemoryBlockLogic,
	stackmemory: StackMemoryBlockLogic,
	randomaccessmemory: RandomAccessMemoryBlockLogic,

	operationbuffer: OperationBufferBlockLogic,
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
	operationmod: OperationModBlockLogic,

	operationvec3splitter: OperationVec3SplitterBlockLogic,
	operationvec3combiner: OperationVec3CombinerBlockLogic,

	operationequals: OperationEqualsBlockLogic,
	operationgreaterthan: OperationGreaterThanBlockLogic,
	operationround: OperationRoundBlockLogic,

	operationdeg: OperationDegBlockLogic,
	operationrad: OperationRadBlockLogic,

	operationclamp: OperationClampBlockLogic,
	operationabs: OperationAbsBlockLogic,
	operationsign: OperationSignBlockLogic,
} as const;
export default logicRegistry;
export type LogicRegistry = Readonly<Record<string, { new (block: PlacedBlockData): BlockLogic } | undefined>>;
