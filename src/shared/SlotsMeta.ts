/** Slots storage for a single user */
export namespace SlotsMeta {
	export const autosaveSlotIndex = -1;
	export const quitSlotIndex = -2;
	const minSlot = -2;

	function defaultSlot(index: number): SlotMeta {
		const def: SlotMeta = {
			index,
			name: "Slot " + (index + 1),
			color: "FFFFFF",
			blocks: 0,
			size: 0,
			touchControls: {},
		};

		if (index === SlotsMeta.autosaveSlotIndex) {
			return {
				...def,
				name: "Autosave",
				color: "6ccfe6",
			};
		}
		if (index === SlotsMeta.quitSlotIndex) {
			return {
				...def,
				name: "Last exit",
				color: "ff6b54",
			};
		}

		return def;
	}

	export function indexOf(slots: readonly SlotMeta[], index: number): number | undefined {
		return slots.findIndex((slot) => slot.index === index);
	}
	export function get(slots: readonly SlotMeta[], index: number): SlotMeta {
		const idx = indexOf(slots, index);
		if (idx === undefined) return defaultSlot(index);

		return slots[idx] ?? defaultSlot(index);
	}
	export function set(slots: SlotMeta[], meta: SlotMeta) {
		const idx = indexOf(slots, meta.index);
		if (idx !== undefined) slots.remove(idx);

		slots.push(meta);
	}
	export function withSlot(
		slots: readonly SlotMeta[],
		index: number,
		meta: Readonly<Partial<SlotMeta>>,
	): readonly SlotMeta[] {
		const s = [...slots];
		set(s, {
			...get(s, index),
			...meta,
			index,
		});
		return s;
	}

	export function getAll(slots: readonly SlotMeta[], min: number): readonly SlotMeta[] {
		const ret: SlotMeta[] = [];
		for (let i = minSlot; i < min; i++) {
			ret.push(get(slots, i));
		}

		return ret;
	}
}
