import { AES, Base64 } from "@rbxts/crypto";
import { HttpService } from "@rbxts/services";
import AESKeyGenerator from "shared/data/AESKeyGenerator";

export default class PlotManager {
	public static readPlotData(plot: Model): Plot {
		const encryptedPlotData = plot.GetAttribute("data") as string;
		const decryptedData = AES.Decrypt(encryptedPlotData, AESKeyGenerator.RANDOM_KEY);
		const data = HttpService.JSONDecode(decryptedData) as Plot;
		return data;
	}

	public static writePlotData(plot: Model, plotData: Plot) {
		const encryptedPlotData = AES.Encrypt(HttpService.JSONEncode(plotData), AESKeyGenerator.RANDOM_KEY);
		plot.SetAttribute("data", encryptedPlotData);
	}
}
