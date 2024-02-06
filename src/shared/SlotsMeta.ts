/** Slots storage for a single user */
export default class SlotsMeta {
	public static readonly autosaveSlotIndex = -1;

	private static defaultSlot(index: number): SlotMeta {
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
				color: "55aaff",
			};
		}

		return def;
	}

	static indexOf(slots: readonly SlotMeta[], index: number): number | undefined {
		return slots.findIndex((slot) => slot.index === index);
	}
	static get(slots: readonly SlotMeta[], index: number): SlotMeta {
		const idx = this.indexOf(slots, index);
		if (idx === undefined) return this.defaultSlot(index);

		return slots[idx] ?? this.defaultSlot(index);
	}
	static set(slots: SlotMeta[], meta: SlotMeta) {
		const idx = this.indexOf(slots, meta.index);
		if (idx !== undefined) slots.remove(idx);

		slots.push(meta);
	}
	static with(slots: readonly SlotMeta[], index: number, meta: Readonly<Partial<SlotMeta>>): readonly SlotMeta[] {
		const s = [...slots];
		this.set(s, {
			...this.get(s, index),
			...meta,
			index,
		});
		return s;
	}

	static getAll(slots: readonly SlotMeta[], min: number): readonly SlotMeta[] {
		const ret: SlotMeta[] = [];
		for (let i = -1; i < min; i++) {
			ret.push(this.get(slots, i));
		}

		return ret;
	}
}
