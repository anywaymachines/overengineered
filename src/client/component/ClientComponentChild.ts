import type { ClientComponentEvents } from "client/component/ClientComponentEvents";
import { ComponentChild } from "shared/component/ComponentChild";

export const ClientComponentChild = {
	registerBasedOnInputType: <T extends IComponent>(
		state: IComponent & { readonly event: ClientComponentEvents },
		types: Readonly<Record<InputType, () => T>>,
		cleanOnDisable = false,
	) => {
		const parent = new ComponentChild<T>(state, cleanOnDisable);
		state.event.onPrepare((inputType) => parent.set(types[inputType]()));

		return parent;
	},
} as const;
