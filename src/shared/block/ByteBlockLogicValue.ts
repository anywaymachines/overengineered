import { BlockLogicValue } from "shared/block/BlockLogicValue";
import { NumberObservableValue } from "shared/event/NumberObservableValue";

export class ByteBlockLogicValue extends BlockLogicValue<BlockConfigTypes.Byte["config"]> {
	protected processValue(value: BlockConfigTypes.Byte["config"]): BlockConfigTypes.Byte["config"] {
		if (value === undefined) return value;
		return { type: "byte", value: NumberObservableValue.clamp(value.value, 0, 255, 1) };
	}
}
