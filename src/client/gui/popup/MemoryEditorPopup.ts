import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { ByteTextBoxControl } from "client/gui/controls/ByteTextBoxControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { TextPopup } from "client/gui/popup/TextPopup";
import { LogControl } from "client/gui/static/LogControl";
import { Colors } from "shared/Colors";
import { TransformService } from "shared/component/TransformService";
import { VectorUtils } from "shared/utils/VectorUtils";

export type MemoryEditorPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly AddressTextBox: TextBox;
	readonly ImportButton: TextButton;
	readonly ClearButton: TextButton;
	readonly Content: MemoryEditorRecordsDefinition;
};

export type MemoryEditorRecordDefinition = Frame & {
	readonly b0: TextBox;
	readonly b1: TextBox;
	readonly b2: TextBox;
	readonly b3: TextBox;
	readonly b4: TextBox;
	readonly b5: TextBox;
	readonly b6: TextBox;
	readonly b7: TextBox;
	readonly b8: TextBox;
	readonly b9: TextBox;
	readonly b10: TextBox;
	readonly b11: TextBox;
	readonly b12: TextBox;
	readonly b13: TextBox;
	readonly b14: TextBox;
	readonly b15: TextBox;
	readonly AddressLabel: TextLabel;
	readonly AsciiLabel: TextLabel;
};

export type MemoryEditorRecordsDefinition = ScrollingFrame & {
	Template: MemoryEditorRecordDefinition;
};

class MemoryEditorRow extends Control<MemoryEditorRecordDefinition, ByteTextBoxControl> {
	constructor(
		gui: MemoryEditorRecordDefinition,
		private readonly popup: MemoryEditorPopup,
		private readonly row: number,
		recolorPreviousUntil: (index: number) => void,
	) {
		super(gui);

		// Address
		this.gui.AddressLabel.Text = popup.numberToHex(row * 16);

		this.updateAsciiLabel();

		for (let i = 0; i < 16; i++) {
			// Get [i] byte TextBox
			const tb = this.gui.WaitForChild(`b${i}`) as TextBox;

			// Color gray if no data
			tb.TextColor3 = popup.data[row * 16 + i] !== undefined ? Colors.white : Color3.fromRGB(180, 180, 180);

			const idx = i;
			const control = this.add(new ByteTextBoxControl(tb));
			control.value.set(popup.data[row * 16 + i] ?? 0);
			control.submitted.Connect((value) => {
				tb.TextColor3 = Colors.white;

				for (let j = 0; j < row * 16 + i; j++) {
					popup.data[j] ??= 0;
				}

				popup.data[row * 16 + i] = value;
				recolorPreviousUntil(row * 16 + idx);
				this.updateAsciiLabel();
			});
		}
	}

	private updateAsciiLabel() {
		let str = "";
		for (let i = 0; i < 16; i++) {
			const c = this.popup.data[this.row * 16 + i] ?? 0;
			str += c >= 32 && c <= 126 ? string.char(c) : ".";
		}

		this.gui.AsciiLabel.Text = str;
	}

	updateColor(index: number) {
		this.getChildren()[index].instance.TextColor3 =
			this.popup.data[this.row * 16 + index] !== undefined ? Colors.white : Color3.fromRGB(180, 180, 180);
	}
}

class MemoryEditorRows extends Control<MemoryEditorRecordsDefinition> {
	private readonly template;
	private readonly rows;

	rowCursor = 0;
	readonly contentSize = 128;

	getContentSection() {
		return this.contentSize / 4;
	}

	constructor(
		gui: MemoryEditorRecordsDefinition,
		readonly popup: MemoryEditorPopup,
	) {
		super(gui);

		this.template = this.asTemplate(this.gui.Template, false);
		this.gui.Template.Visible = false;

		this.rows = new Control<GuiObject, MemoryEditorRow>(this.gui);
		this.add(this.rows);

		// Dynamic scroll
		this.gui.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
			const onStart = VectorUtils.roundVector2(this.gui.CanvasPosition).Y === 0;
			const onEnd =
				VectorUtils.roundVector2(this.gui.AbsoluteCanvasSize.sub(this.gui.CanvasPosition)).Y ===
				VectorUtils.roundVector2(this.gui.AbsoluteSize).Y;

			if (onStart) {
				loadBehind();
			} else if (onEnd) {
				loadBelow();
			}
		});

		const loadBehind = () => {
			if (this.rowCursor <= 0) return;
			this.rowCursor -= this.getContentSection();
			if (this.rowCursor < 0) this.rowCursor = 0;

			this.spawnRows();

			// Scroll
			this.gui.CanvasPosition = this.gui.CanvasPosition.add(
				new Vector2(0, this.gui.Template.Size.Y.Offset * this.getContentSection() * popup.getScale()),
			);
		};

		const loadBelow = () => {
			if (this.rowCursor >= this.popup.bytesLimit / 16) return;
			if (this.rows.getChildren().size() < this.contentSize) return;
			this.rowCursor += this.getContentSection();

			this.spawnRows();

			// Scroll
			this.gui.CanvasPosition = this.gui.CanvasPosition.sub(
				new Vector2(0, this.gui.Template.Size.Y.Offset * this.getContentSection() * popup.getScale()),
			);
		};

		this.spawnRows();
	}

	spawnRows() {
		this.rows.clear();

		for (let i = 0; i < this.contentSize; i++) {
			const row = i + this.rowCursor;
			if (row >= this.popup.bytesLimit / 16) break;

			const children = this.rows.getChildren();
			this.rows.add(
				new MemoryEditorRow(this.template(), this.popup, row, (index) => {
					for (let i = 0; i < math.ceil(index / 16) + 2; i++) {
						for (let j = 0; j < 16; j++) {
							children[i].updateColor(j);
						}
					}
				}),
			);
		}
	}
}

export class MemoryEditorPopup extends Popup<MemoryEditorPopupDefinition> {
	static showPopup(bytesLimit: number, data: number[], callback: (data: number[]) => void) {
		const popup = new MemoryEditorPopup(
			Gui.getGameUI<{
				Popup: {
					MemoryEditor: MemoryEditorPopupDefinition;
				};
			}>().Popup.MemoryEditor.Clone(),
			bytesLimit,
			data,
			callback,
		);

		popup.show();
	}

	constructor(
		gui: MemoryEditorPopupDefinition,
		readonly bytesLimit: number,
		readonly data: number[],
		callback: (data: number[]) => void,
	) {
		super(gui);

		if (bytesLimit % 128 !== 0) {
			$err(`Bytes limit must be a multiple of ${bytesLimit}`);
			this.hide();
			callback(data);
			return;
		}

		const rows = this.add(new MemoryEditorRows(this.gui.Content, this));

		// Update AddressTextBox on scroll
		this.gui.Content.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
			const currentRow =
				rows.rowCursor +
				math.round(
					this.gui.Content.CanvasPosition.Y /
						(this.gui.Content.Template.Size.Y.Offset * this.parentScreen.getScale()),
				);

			this.gui.AddressTextBox.Text = this.numberToHex(currentRow * 16);
		});

		// Close button
		this.add(
			new ButtonControl(this.gui.Heading.CloseButton, () => {
				this.hide();
				callback(data);
			}),
		);

		// Clear data button
		this.add(
			new ButtonControl(this.gui.ClearButton, () => {
				ConfirmPopup.showPopup(
					"Clear memory store?",
					"It will be impossible to undo this action",
					() => {
						data.clear();
						rows.spawnRows();
					},
					() => {},
				);
			}),
		);

		// Import hex button
		this.add(
			new ButtonControl(this.gui.ImportButton, () => {
				TextPopup.showPopup(
					"IMPORT",
					"00 01 02 03 04 ...",
					(text) => {
						const spacelessText = string.gsub(string.gsub(text, "%s+", "")[0], "\n", "")[0];

						if (spacelessText.size() % 2 !== 0 || string.match(text, "^[0-9a-fA-F%s]+$")[0] === undefined) {
							LogControl.instance.addLine("Invalid data format!", Colors.red);
							return;
						}

						if (spacelessText.size() / 2 > this.bytesLimit) {
							LogControl.instance.addLine("Too long!", Colors.red);
							return;
						}

						data.clear();
						for (const [value] of spacelessText.gmatch("%S%S")) {
							data.push(tonumber(value, 16)!);
						}

						rows.spawnRows();

						LogControl.instance.addLine("Import successful!");
					},
					() => {},
				);
			}),
		);

		const addressTextBox = new TextBoxControl(this.gui.AddressTextBox);
		addressTextBox.text.set(this.numberToHex(0));
		addressTextBox.submitted.Connect((value) => {
			if (value === "") {
				rows.rowCursor = 0;
				rows.spawnRows();
				addressTextBox.text.set(this.numberToHex(0));
				return;
			}

			const rawRowHEX = string.match(value, "^0x(%x+)$")[0] ?? string.match(value, "^(%x+)$")[0];

			if (rawRowHEX !== undefined) {
				const byte = (tonumber(rawRowHEX, 16) ?? 0) + 1;
				const row = byte / 16;
				const cursorRow =
					math.floor((row + rows.getContentSection() / 2) / rows.getContentSection()) *
					rows.getContentSection();

				rows.rowCursor = cursorRow;
				rows.spawnRows();

				// Scroll
				const scale = this.parentScreen.getScale();
				this.gui.Content.CanvasPosition = new Vector2(
					0,
					this.gui.Content.Template.Size.Y.Offset * math.abs(cursorRow - row) * scale,
				);

				return;
			}

			LogControl.instance.addLine("Invalid address format!", Colors.red);
		});
		this.add(addressTextBox);
	}

	show() {
		super.show();
		TransformService.run(this.instance, (transform) => transform.slideIn("top", 50, { duration: 0.2 }));
	}

	getScale() {
		return this.parentScreen.getScale();
	}

	numberToHex(value: number) {
		return string.format(`0x%0${string.format("%X", this.bytesLimit).size()}X`, value);
	}
}
