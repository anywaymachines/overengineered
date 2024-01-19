import Control from "client/base/Control";

export default interface GroupableControl extends Control {
	groupWith(controls: readonly GroupableControl[]): Control;
}
