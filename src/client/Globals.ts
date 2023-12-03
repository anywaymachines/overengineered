import ObservableValue from "shared/event/ObservableValue";

export default class Globals {
	public static readonly instance = new Globals();

	public readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
}
