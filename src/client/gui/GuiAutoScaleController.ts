import { Gui } from "client/gui/Gui";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class GuiAutoScaleController extends HostedService {
	constructor(@inject playerData: PlayerDataStorage) {
		super();

		const scale = playerData.config.createBased((c) => c.uiScale);
		ScaledScreenGui.initializeGlobalScale(scale);

		this.parent(new ScaledScreenGui(Gui.getGameUI()));
		this.parent(new ScaledScreenGui(Gui.getPopupUI()));
	}
}
