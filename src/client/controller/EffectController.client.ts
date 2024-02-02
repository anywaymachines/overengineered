import { Players } from "@rbxts/services";
import Effects from "shared/effects/Effects";
import { EffectsInvoker } from "shared/effects/EffectsInvoker";
import Objects from "shared/fixes/objects";

for (const [_, effect] of Objects.pairs(Effects)) {
	effect.event.OnClientEvent.Connect((part, arg) => spawn(() => effect.justCreate(part, arg as never)));
}

EffectsInvoker.initialize((part, arg, forcePlayer, event) => {
	if (forcePlayer !== Players.LocalPlayer && forcePlayer !== "everyone") return;
	event.FireServer(part, arg);
});
