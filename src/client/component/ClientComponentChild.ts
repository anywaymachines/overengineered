import type { ClientComponentEvents } from "client/component/ClientComponentEvents";
import InputController from "client/controller/InputController";
import { ComponentChild, ReadonlyComponentChild } from "shared/component/ComponentChild";

export const ClientComponentChild = {
	createOnceBasedOnInputType: <T extends IComponent>(types: Readonly<Record<InputType, () => T>>): T => {
		return types[InputController.inputType.get()]();
	},
	registerBasedOnInputType: <T extends IComponent>(
		state: IComponent & { readonly event: ClientComponentEvents },
		types: Readonly<Record<InputType, () => T>>,
		cleanOnDisable = false,
	): ReadonlyComponentChild<T> => {
		const parent = new ComponentChild<T>(state, cleanOnDisable);
		state.event.onPrepare((inputType) => parent.set(types[inputType]()));

		return parent;
	},
} as const;
