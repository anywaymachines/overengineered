import { _UnreliableRemoteEvent } from "shared/Remotes";

let invoke:
	| (<T>(
			part: BasePart,
			arg: T,
			forcePlayer: Player | "everyone",
			event: _UnreliableRemoteEvent<(part: BasePart, arg: T) => void>,
	  ) => void)
	| undefined;
export const EffectsInvoker = {
	invoke<T>(
		part: BasePart,
		arg: T,
		forcePlayer: Player | "everyone",
		event: _UnreliableRemoteEvent<(part: BasePart, arg: T) => void>,
	) {
		invoke!(part, arg, forcePlayer, event);
	},
	initialize(func: typeof invoke) {
		invoke = func;
	},
} as const;
