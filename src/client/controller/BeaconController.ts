import { Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import RobloxUnit from "shared/RobloxUnit";
import GuiController from "./GuiController";

type BeaconBillboardGui = GuiObject & {
	Title: TextLabel;
	Distance: TextLabel;
	ImageLabel: ImageLabel;
};

export default class BeaconController {
	readonly billboard;

	constructor(part: BasePart | Model, name: string) {
		this.billboard = (
			ReplicatedStorage.Assets as unknown as { BeaconBillboardGui: BeaconBillboardGui }
		).BeaconBillboardGui.Clone();
		this.billboard.Parent = part;

		const frame = this.billboard;
		frame.Position = new UDim2(0, 1, 0, 1);

		// get gui point by object point
		frame.Parent = GuiController.getGameUI();
		frame.Title.Text = name;

		RunService.RenderStepped.Connect(() => {
			if (!PlayerDataStorage.config.get().beacons) {
				this.billboard.ImageLabel.ImageTransparency = 1;
				this.billboard.Title.TextTransparency = 1;
				this.billboard.Distance.TextTransparency = 1;
				return;
			}

			const character = Players.LocalPlayer.Character;
			if (!character) return;

			const distance = RobloxUnit.Studs_To_Meters(
				part.GetPivot().Position.sub(character.GetPivot().Position).Magnitude,
			);

			const cutoffDistance = 30;
			const transparency = 1 - math.clamp((distance - cutoffDistance) / 10, 0, 1);

			this.billboard.ImageLabel.ImageTransparency = transparency;
			this.billboard.Title.TextTransparency = transparency;
			this.billboard.Distance.TextTransparency = transparency;

			let distancestr: string;
			if (distance > 1000) distancestr = `${math.floor(distance / 100) / 10} km`;
			else distancestr = `${math.floor(distance)} m`;

			this.billboard.Distance.Text = distancestr;
			const [screenPos, isVisible] = Workspace.CurrentCamera!.WorldToViewportPoint(part.GetPivot().Position);
			const screenSize = Workspace.CurrentCamera!.ViewportSize;
			const adjustableOffset = frame.AbsoluteSize.X / 2;
			let [pos_x, pos_y] = [screenPos.X, screenPos.Y];

			const halfScreenX = screenSize.X / 2;
			const halfScreenY = screenSize.Y / 2;

			if (!isVisible || pos_x > screenSize.X || pos_y > screenSize.Y || pos_x < 0 || pos_y < 0) {
				pos_x = math.clamp(
					pos_x - halfScreenX + halfScreenX,
					adjustableOffset,
					screenSize.X - adjustableOffset,
				);
				pos_y = math.clamp(
					pos_y - halfScreenY + halfScreenY,
					adjustableOffset,
					screenSize.Y - adjustableOffset,
				);

				if (screenPos.Z < 0) {
					pos_x = screenSize.X - pos_x;
					pos_y = screenSize.Y - pos_y;
				}
			}

			/*
			if (!isVisible) {
				const xmore = math.abs(halfScreenX - pos_x) > math.abs(halfScreenY - pos_y);

				if (xmore) {
					pos_y = math.clamp(pos_y, adjustableOffset, screenSize.Y - adjustableOffset);
					pos_x = pos_x > halfScreenX ? screenSize.X - adjustableOffset : adjustableOffset;
				} else {
					pos_x = math.clamp(pos_x, adjustableOffset, screenSize.X - adjustableOffset);
					pos_y = pos_y > halfScreenY ? screenSize.Y - adjustableOffset : adjustableOffset;
				}
			}
			*/
			//if (Players.LocalPlayer.Name === "samlovebutter") {
			//	print(isVisible);
			//}

			//if (pos_x > screenSize.X - adjustableOffset) pos_x = screenSize.X - adjustableOffset;
			//if (pos_x < adjustableOffset) pos_x = adjustableOffset;
			//if (pos_y > screenSize.Y - adjustableOffset) pos_y = screenSize.Y - adjustableOffset;
			//if (pos_y < adjustableOffset) pos_y = adjustableOffset;

			//if off screen then move to closes maximum
			//if(!isVisible){
			//	;
			//}

			frame.Position = new UDim2(0, pos_x, 0, pos_y);

			//const aOff = adjustableOffset * 100;
			//const offByX = screenPos.X > screenSize.X + aOff || screenPos.X < -aOff;
			//const offByY = screenPos.Y > screenSize.Y + aOff || screenPos.Y < -aOff;
			//print(isVisible);
			//if (!(offByX || offByY) || isVisible) return;
			//this.billboard.ImageLabel.ImageTransparency = 1;
			//this.billboard.Title.TextTransparency = 1;
			//this.billboard.Distance.TextTransparency = 1;
		});
	}
}
