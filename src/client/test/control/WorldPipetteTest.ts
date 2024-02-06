import Control from "client/gui/Control";
import { Element } from "client/gui/Element";
import BlockPipetteButton from "client/gui/controls/BlockPipetteButton";
import { ControlTest } from "client/test/control/ControlTest";
import BlockManager from "shared/building/BlockManager";

export const WorldPipetteTest: ControlTest = {
	createTests() {
		const newpipettebtn = (text: string) => {
			return Element.create("TextButton", {
				Size: new UDim2(0, 200, 0, 30),
				Text: text,
			});
		};

		const list = new Control(
			Element.create(
				"Frame",
				{ Size: new UDim2(0, 200, 1, 0), Transparency: 1 },
				{ list: Element.create("UIListLayout", {}) },
			),
		);

		const megaPipette = list.add(new BlockPipetteButton(newpipettebtn("MEGA PIPETTE")));
		megaPipette.onSelect.Connect((part) => {
			if (part.IsA("BasePart")) {
				(megaPipette.getGui() as TextButton).Text = `${part.Material.Name} #${part.Color.ToHex().upper()}`;
			} else {
				const data = BlockManager.getBlockDataByBlockModel(part);
				(megaPipette.getGui() as TextButton).Text =
					`${data.id} ${data.material.Name} #${data.color.ToHex().upper()}`;
			}

			return true;
		});

		const blockIdPipette = newpipettebtn("BLOCK ID PIPETTE");
		list.add(BlockPipetteButton.forBlockId(blockIdPipette, (id) => (blockIdPipette.Text = id)));

		const materialPipette = newpipettebtn("MATERIAL PIPETTE");
		list.add(BlockPipetteButton.forMaterial(materialPipette, (material) => (materialPipette.Text = material.Name)));

		const colorPipette = newpipettebtn("COLOR PIPETTE");
		list.add(
			BlockPipetteButton.forColor(colorPipette, (color) => (colorPipette.Text = "#" + color.ToHex().upper())),
		);

		return [["Pipettes", list]];
	},
};
