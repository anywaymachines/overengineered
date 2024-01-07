import NumberObservableValue from "shared/event/NumberObservableValue";
import ConfigLogicValueBase from "./ConfigLogicValueBase";

export default class NumberConfigLogicValue extends ConfigLogicValueBase<number> {
	constructor(defaultValue: number, min: number, max: number, step: number) {
		super(new NumberObservableValue(defaultValue, min, max, step));
	}
}
