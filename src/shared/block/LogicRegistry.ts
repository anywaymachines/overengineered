import { BlockId } from "shared/BlockDataRegistry";
import { PassengerSeatBlockLogic } from "shared/block/logic/PassengerSeatBlockLogic";
import { PistonLogic } from "shared/block/logic/PistonBlockLogic";
import { RadioRecieverBlockLogic } from "shared/block/logic/RadioRecieverBlockLogic";
import { RadioTransmitterBlockLogic } from "shared/block/logic/RadioTransmitterBlockLogic";
import { ByteMakerBlockLogic } from "shared/block/logic/logic/converter/byte/ByteMakerBlockLogic";
import { ByteSplitterBlockLogic } from "shared/block/logic/logic/converter/byte/ByteSplitterBlockLogic";
import { LEDDisplayBlockLogic } from "shared/block/logic/logic/display/LEDDisplayBlockLogic";
import { LaserBlockLogic } from "shared/block/logic/logic/display/LaserBlockLogic";
import { SevenSegmentDisplayBlockLogic } from "shared/block/logic/logic/display/SevenSegmentDisplayBlockLogic";
import { RadarSectionBlockLogic } from "shared/block/logic/logic/sensor/RadarSectionBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import { BlockLogic } from "./BlockLogic";
import { BallastBlockLogic } from "./logic/BallastBlockLogic";
import { DisconnectBlockLogic } from "./logic/DisconnectBlockLogic";
import { HeliumBlockLogic } from "./logic/HeliumBlockLogic";
import { MagnetBlockLogic } from "./logic/MagnetBlockLogic";
import { MotorBlockLogic } from "./logic/MotorBlockLogic";
import { RocketEngineLogic } from "./logic/RocketEngineLogic";
import { RopeLogic } from "./logic/RopeLogic";
import { ServoMotorBlockLogic } from "./logic/ServoMotorBlockLogic";
import { SuspensionLogic } from "./logic/SuspensionLogic";
import { TNTBlockLogic } from "./logic/TNTBlockLogic";
import { VehicleSeatBlockLogic } from "./logic/VehicleSeatBlockLogic";
import { WingLogic } from "./logic/WingLogic";
import { OperationVec3CombinerBlockLogic } from "./logic/logic/converter/vector/OperationVec3CombinerBlockLogic";
import { OperationVec3SplitterBlockLogic } from "./logic/logic/converter/vector/OperationVec3SplitterBlockLogic";
import { LampBlockLogic } from "./logic/logic/display/LampBlockLogic";
import { ScreenBlockLogic } from "./logic/logic/display/ScreenBlockLogic";
import { LogicMemoryBlockLogic } from "./logic/logic/memory/LogicMemoryBlockLogic";
import { RandomAccessMemoryBlockLogic } from "./logic/logic/memory/RandomAccessMemoryBlockLogic";
import { ReadOnlyMemoryBlockLogic } from "./logic/logic/memory/ReadOnlyMemoryBlockLogic";
import { StackMemoryBlockLogic } from "./logic/logic/memory/StackMemoryBlockLogic";
import { CounterBlockLogic } from "./logic/logic/other/CounterBlockLogic";
import { DelayBlockLogic } from "./logic/logic/other/DelayBlockLogic";
import { OperationBufferBlockLogic } from "./logic/logic/other/OperationBufferBlockLogic";
import { RelayBlockLogic } from "./logic/logic/other/RelayBlockLogic";
import { AccelerometerBlockLogic } from "./logic/logic/sensor/AccelerometerBlockLogic";
import { AltimeterBlockLogic } from "./logic/logic/sensor/AltimeterBlockLogic";
import { AngleSensorBlockLogic } from "./logic/logic/sensor/AngleSensorBlockLogic";
import { KeySensorBlockLogic } from "./logic/logic/sensor/KeySensorBlockLogic";
import { LidarSensorBlockLogic } from "./logic/logic/sensor/LidarSensorBlockLogic";
import { OwnerLocatorBlockLogic } from "./logic/logic/sensor/OwnerLocatorBlockLogic";
import { SpeedometerBlockLogic } from "./logic/logic/sensor/SpeedometerBlockLogic";

export const logicRegistry = {
	wing1x1: WingLogic,
	wing1x2: WingLogic,
	wing1x3: WingLogic,
	wing1x4: WingLogic,

	vehicleseat: VehicleSeatBlockLogic,
	passengerseat: PassengerSeatBlockLogic,
	disconnectblock: DisconnectBlockLogic,

	smallrocketengine: RocketEngineLogic,
	rocketengine: RocketEngineLogic,
	motorblock: MotorBlockLogic,
	servomotorblock: ServoMotorBlockLogic,
	rope: RopeLogic,
	heliumblock: HeliumBlockLogic,
	tnt: TNTBlockLogic,
	cylindricaltnt: TNTBlockLogic,
	sphericaltnt: TNTBlockLogic,
	suspensionblock: SuspensionLogic,
	magnet: MagnetBlockLogic,

	piston: PistonLogic,
	ballast: BallastBlockLogic,

	lamp: LampBlockLogic,
	screen: ScreenBlockLogic,
	laser: LaserBlockLogic,
	leddisplay: LEDDisplayBlockLogic,
	sevensegmentdisplay: SevenSegmentDisplayBlockLogic,

	delayblock: DelayBlockLogic,
	counter: CounterBlockLogic,
	relay: RelayBlockLogic,

	radioreciever: RadioRecieverBlockLogic,
	radiotransmitter: RadioTransmitterBlockLogic,

	ownerlocator: OwnerLocatorBlockLogic,

	speedometer: SpeedometerBlockLogic,
	anglesensor: AngleSensorBlockLogic,
	keysensor: KeySensorBlockLogic,
	altimeter: AltimeterBlockLogic,
	accelerometer: AccelerometerBlockLogic,
	lidarsensor: LidarSensorBlockLogic,
	radarsection: RadarSectionBlockLogic,

	logicmemory: LogicMemoryBlockLogic,
	stackmemory: StackMemoryBlockLogic,
	randomaccessmemory: RandomAccessMemoryBlockLogic,
	readonlymemory: ReadOnlyMemoryBlockLogic,

	operationbuffer: OperationBufferBlockLogic,

	operationvec3splitter: OperationVec3SplitterBlockLogic,
	operationvec3combiner: OperationVec3CombinerBlockLogic,

	bytemaker: ByteMakerBlockLogic,
	bytesplitter: ByteSplitterBlockLogic,
} as const satisfies { readonly [k in BlockId]?: unknown };

export type LogicRegistry = Readonly<
	Record<keyof typeof logicRegistry, { new (block: PlacedBlockData): BlockLogic } | undefined>
>;
