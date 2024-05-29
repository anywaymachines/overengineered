import { ClientComponent } from "client/component/ClientComponent";

export abstract class PlayMode extends ClientComponent {
	abstract getName(): PlayModes;
	abstract onSwitchToNext(mode: PlayModes | undefined): void;
	abstract onSwitchFromPrev(prev: PlayModes | undefined): void;
	onImmediateSwitchToNext(mode: PlayModes | undefined): void {}
	onImmediateSwitchFromPrev(prev: PlayModes | undefined): void {}
}
