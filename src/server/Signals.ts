import Signal from "@rbxts/signal";

export default class Signals {
	static BLOCK_PLACED = new Signal<() => void>();
}
