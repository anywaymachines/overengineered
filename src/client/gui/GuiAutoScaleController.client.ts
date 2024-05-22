import { Gui } from "client/gui/Gui";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";

new ScaledScreenGui(Gui.getGameUI()).enable();
new ScaledScreenGui(Gui.getPopupUI()).enable();
