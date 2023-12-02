import { HttpService } from "@rbxts/services";

/** Slots storage for a single user */
export default class SlotsMeta {
	public static readonly autosaveSlotIndex = -1;

	private readonly slots: SlotMeta[];

	constructor(slots?: SlotMeta[]) {
		this.slots = slots ?? [];
	}

	private defaultSlot(index: number): SlotMeta {
		if (index === SlotsMeta.autosaveSlotIndex) {
			return {
				name: "Autosave",
				color: [0, 255, 255],
				blocks: 0,
				size: 0,
			};
		}

		return {
			name: "Slot " + (index + 1),
			color: [255, 255, 255],
			blocks: 0,
			size: 0,
		};
	}

	get(index: number) {
		return this.slots[index] ?? this.defaultSlot(index);
	}
	set(index: number, meta: SlotMeta) {
		this.slots[index] = meta;
	}

	getAll(min = 0) {
		const slots: SlotMeta[] = new Array(min);
		for (let i = -1; i < min; i++) {
			slots[i] = this.slots[i] ?? this.defaultSlot(i);
		}

		return slots as readonly SlotMeta[];
	}

	toSerialized(): SerializedSlotsMeta {
		return this.slots
			.map((slot, index) => [slot, index] as const)
			.filter((slot) => slot[0] !== undefined)
			.map((slot) => ({
				...slot[0],
				index: slot[1],
			}));
	}
	static fromSerialized(serialized: SerializedSlotsMeta) {
		const slots: SlotMeta[] = [];
		serialized.forEach((slot) => {
			slots[slot.index] = { ...slot };
			delete (slots[slot.index] as { index?: number }).index;
		});

		return new SlotsMeta(slots);
	}

	serialize() {
		return HttpService.JSONEncode(this.toSerialized());
	}
	static deserialize(data: string) {
		return this.fromSerialized(HttpService.JSONDecode(data) as SerializedSlotsMeta);
	}
}
