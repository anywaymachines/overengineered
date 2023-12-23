import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import PlayerDataStorage from "client/PlayerDataStorage";
import RobloxUnit from "shared/RobloxUnit";
import SharedPlots from "shared/building/SharedPlots";

type BeaconBillboardGui = BillboardGui & {
	Frame: GuiObject & {
		Title: TextLabel;
		Distance: TextLabel;
		ImageLabel: ImageLabel;
	};
};

export default class BeaconController {
	static readonly instance = new BeaconController();

	readonly billboard;

	constructor() {
		let plot: Model | undefined;

		while (!plot) {
			plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
			wait(0.1);
		}

		this.billboard = (
			ReplicatedStorage.Assets as unknown as { BeaconBillboardGui: BeaconBillboardGui }
		).BeaconBillboardGui.Clone();
		this.billboard.Parent = plot.WaitForChild("BuildingArea");

		RunService.Heartbeat.Connect(() => {
			if (!PlayerDataStorage.config.get().beacons) {
				this.billboard.Frame.ImageLabel.ImageTransparency = 1;
				this.billboard.Frame.Title.TextTransparency = 1;
				this.billboard.Frame.Distance.TextTransparency = 1;

				return;
			}

			const character = Players.LocalPlayer.Character;
			if (!character) return;

			const distance = RobloxUnit.Studs_To_Meters(
				(this.billboard.Parent as Part).GetPivot().Position.sub(character.GetPivot().Position).Magnitude,
			);

			const cutoffDistance = 30;
			const transparency = 1 - math.clamp((distance - cutoffDistance) / 10, 0, 1);

			this.billboard.Frame.ImageLabel.ImageTransparency = transparency;
			this.billboard.Frame.Title.TextTransparency = transparency;
			this.billboard.Frame.Distance.TextTransparency = transparency;

			let distancestr: string;
			if (distance > 1000) distancestr = `${math.floor(distance / 100) / 10} km`;
			else distancestr = `${math.floor(distance)} m`;

			this.billboard.Frame.Distance.Text = distancestr;
		});
	}
}
