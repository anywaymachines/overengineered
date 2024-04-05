/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { Lighting, Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { LocalPlayerController } from "./controller/LocalPlayerController";
import { Gui } from "./gui/Gui";

export class Atmosphere {
	private static camera = Workspace.CurrentCamera!;

	private static atmosphereModel: Model;
	private static atmosphere: Part;
	private static distantSurface: Part;
	private static surfaceMesh: FileMesh;
	private static mesh: FileMesh;
	private static sky: Sky;
	private static earth: Part;
	private static earthMesh: FileMesh;
	private static earthTexture: Decal;
	private static earthTerminator: Part;
	private static earthTerminator2: Part;
	private static earthTerminatorMesh: FileMesh;
	private static earthTerminatorMesh2: FileMesh;
	private static earthTerminatorTexture: Decal;
	private static earthTerminatorTexture2: Decal;

	private static atmosphereApparentHeight: number;
	private static fogEndRatio: number;
	private static earthPositionEquation: number;
	private static earthMeshEquation: number;
	private static earthTransparency: number;
	private static showTerminator: number;
	private static horizonElevationSunsetDifference: number;
	private static horizonElevationSunsetDifference10: number;
	private static sunR: number;
	private static sunG: number;
	private static sunB: number;
	private static sunOffsetX: number;
	private static sunOffsetZ: number;
	private static initialTime: number;
	private static initialGL: number;
	private static lightEmissionEquation: number;
	private static extinctionTransparencyEquation: number;
	private static extinctionSunsetTransparencyEquation: number;
	private static extinctionColorEquation: Color3;
	private static extinctionWidthEquation: number;
	private static extinctionOrientationEquation: number;
	private static outdoorAmbientBrightnessEquation: number;
	private static sunBrightness: number;
	private static airglowTransparency: number;
	private static earthTerminatorX: number;
	private static earthTerminatorY: number;

	private static extinction: Model & {
		AtmosphericExtinction1: Part & {
			Attachment1a: Attachment;
			Attachment2b: Attachment;
			Attachment3a: Attachment;
			Attachment4b: Attachment;
			Attachment5a: Attachment;
			Attachment6b: Attachment;
			Attachment7a: Attachment;
			Attachment8b: Attachment;
		};
		AtmosphericExtinction2: Part & {
			Attachment1b: Attachment;
			Attachment2a: Attachment;
			Attachment3b: Attachment;
			Attachment4a: Attachment;
			Attachment5b: Attachment;
			Attachment6a: Attachment;
			Attachment7b: Attachment;
			Attachment8a: Attachment;

			Beam1: Beam;
			Beam2: Beam;
			Beam3: Beam;
			Beam4: Beam;
			Beam5: Beam;
			Beam6: Beam;
			Beam7: Beam;
			Beam8: Beam;
			Beam9: Beam;
			Beam10: Beam;
			Beam11: Beam;
			Beam12: Beam;
		};
	};
	private static extinctionSunset: typeof this.extinction;
	private static AirglowLayer: Part;
	private static AirglowMesh: FileMesh;
	private static BottomAtmosphere: Part;
	private static BottomAtmosphereMesh: FileMesh;
	private static Sun3D: Part & {
		Mesh: FileMesh;
		SunsetLight: BillboardGui & {
			Light: ImageLabel;
		};
	};
	private static BottomAtmosphereDarkness: Decal;

	private static readonly settings = {
		altitudeOffset: 0,
		atmosphereColor: Color3.fromRGB(115, 180, 255),
		atmosphereReflectionColor: Color3.fromRGB(42, 133, 198),
		atmosphereSunsetColor: Color3.fromRGB(171, 213, 255),
		atmosphereThickness: 1,
		atmosphereTransparency: 1,

		atmosphericExtinctionColor: Color3.fromRGB(255, 100, 0),
		astronomicalTwilightAtmosphericExtinctionColor: Color3.fromRGB(60, 60, 60),
		innerAtmosphericExtinctionColor: Color3.fromRGB(255, 85, 0),
		nauticalInnerAtmosphericExtinctionColor: Color3.fromRGB(150, 125, 50),
		nauticalTwlightAtmosphericExtinctionColor: Color3.fromRGB(255, 100, 50),
		sunsideAtmosphericExtinctionColor: Color3.fromRGB(255, 20, 0),

		beltOfVenusColor: Color3.fromRGB(0, 13, 25),
		distantSurfaceColor: Color3.fromRGB(45, 118, 255),
		enableAirglow: true,
		airglowColor: Color3.fromRGB(238, 255, 162),
		airglowTransparency: 0.93,

		enableApparentPlanetRotation: true,
		enableApparentSunMovement: false,
		equatorialMovementOnly: false,
		initialPlanetOrientation: new Vector3(0, 90, -90),

		enableEnvironmentalLightingChanges: true,
		daytimeSunlightColor: Color3.fromRGB(230, 241, 255),
		nightBrightness: 1,
		outdoorAmbientBrightnessDay: 180,
		outdoorAmbientBrightnessNight: 120,
		sunlightBrightness: 3,
		sunriseSunlightColor: Color3.fromRGB(255, 140, 20),

		enableGroundAtmosphere: true,
		groundAtmosphereTransparency: 0.8,

		enableMoon: true,
		moonApparentDiameter: 31.6,
		moonTexture: "rbxassetid://4998545943",

		enableSun: true,
		sunApparentDiameter: 31.983,
		sunAtmosphericExtinctionColor: Color3.fromRGB(255, 140, 50),
		sunAtmosphericExtinctionIntermediateColor: Color3.fromRGB(255, 200, 80),
		sunBrightness: 1,
		sunTemp: 5505,
		sunshineTexture: "rbxassetid://5192965045",
		threeDimensionalSunAtmosphericExtinctionColor: Color3.fromRGB(255, 20, 0),

		enableSunsetScattering: true,
		planetTexture: "rbxassetid://5079554320",
		planetTextureNight: "rbxassetid://5088333693",
		planetTransparency: 0.421,
		scale: 0.03,
	};

	static initialize() {
		// TODO: Fix and finish
		return;

		// TEST
		if (!(Players.LocalPlayer.Name === "3QAXM" && RunService.IsStudio())) return;

		// Removes any ROBLOX provided 'atmospheres' since they disable legacy fog which in turn makes the script malfunction
		Lighting.GetDescendants().forEach((instance) => {
			if (instance.IsA("Atmosphere")) {
				instance.Destroy();
			}
		});

		// Spawns the materials && conditions needed to produce the atmosphere.
		this.atmosphereModel = new Instance("Model", Workspace);
		this.atmosphereModel.Name = "Atmosphere";

		this.atmosphere = new Instance("Part", this.atmosphereModel);
		this.atmosphere.CanCollide = false;
		this.atmosphere.CanTouch = false;
		this.atmosphere.CanQuery = false;
		this.atmosphere.Anchored = true;
		this.atmosphere.Name = "Atmosphere";
		this.atmosphere.Size = new Vector3(1, 1, 1);
		this.atmosphere.Color = new Color3(0, 0, 0);
		this.atmosphere.Position = this.camera.CFrame.Position;
		this.atmosphere.Orientation = new Vector3(0, -90, 0);
		this.atmosphere.CastShadow = false;
		this.atmosphere.Material = Enum.Material.Fabric;
		this.atmosphere.Transparency = 0;

		this.distantSurface = new Instance("Part", this.atmosphereModel);
		this.distantSurface.Size = new Vector3(1, 1, 1);
		this.distantSurface.Color = new Color3(33 / 255, 84 / 255, 185 / 255);
		this.distantSurface.Name = "DistantSurface";
		this.distantSurface.CanCollide = false;
		this.distantSurface.CanTouch = false;
		this.distantSurface.CanQuery = false;
		this.distantSurface.Orientation = new Vector3(0, -90, 0);
		this.distantSurface.CastShadow = false;
		this.distantSurface.Anchored = true;
		this.distantSurface.Material = Enum.Material.SmoothPlastic;

		this.surfaceMesh = new Instance("FileMesh", this.distantSurface);
		this.surfaceMesh.MeshId = "rbxassetid://452341386";
		this.surfaceMesh.Scale = new Vector3(700, 1000, 700);

		this.mesh = new Instance("FileMesh", this.atmosphere);
		this.mesh.MeshId = "rbxassetid://5077225120";
		this.mesh.Scale = new Vector3(7600, 3000, 7600);
		this.mesh.TextureId = "http://www.roblox.com/asset/?ID=2013298";

		this.atmosphereApparentHeight = 5.5;

		this.sky = new Instance("Sky", Lighting);
		this.sky.SkyboxBk = "http://www.roblox.com/asset/?ID=2013298";
		this.sky.SkyboxDn = "http://www.roblox.com/asset/?ID=2013298";
		this.sky.SkyboxFt = "http://www.roblox.com/asset/?ID=2013298";
		this.sky.SkyboxLf = "http://www.roblox.com/asset/?ID=2013298";
		this.sky.SkyboxRt = "http://www.roblox.com/asset/?ID=2013298";
		this.sky.SkyboxUp = "http://www.roblox.com/asset/?ID=2013298";
		this.sky.MoonAngularSize = 0.57;
		this.sky.SunAngularSize = 1.44;

		Lighting.FogColor = new Color3(115 / 255, 152 / 255, 255 / 255);
		Lighting.FogEnd = 100000;
		Lighting.FogStart = 0;

		this.fogEndRatio = 1;

		this.earth = new Instance("Part", this.atmosphereModel);
		this.earth.Anchored = true;
		this.earth.Name = "EarthSurface";
		this.earth.CanCollide = false;
		this.earth.CanQuery = false;
		this.earth.CanTouch = false;
		this.earth.Size = new Vector3(1, 1, 1);
		this.earth.Color = new Color3(33 / 255, 84 / 255, 185 / 255);
		this.earth.Orientation = this.settings.initialPlanetOrientation;
		this.earth.CastShadow = false;
		this.earth.Material = Enum.Material.ForceField;
		this.earth.Transparency = 0;

		this.earthPositionEquation = 1;
		this.earthMesh = new Instance("FileMesh", this.earth);
		this.earthMesh.MeshId = "rbxassetid://5276376752";
		this.earthMesh.TextureId = "rbxassetid://2013298";
		this.earthMesh.VertexColor = new Vector3((115 / 255) * 2, (152 / 255) * 2, 2);
		this.earthTexture = new Instance("Decal", this.earth);
		this.earthTexture.Texture = this.settings.planetTexture;

		this.earthMeshEquation = 100000;
		this.earthTransparency = this.settings.planetTransparency;

		this.earthTerminator = new Instance("Part", this.atmosphereModel);
		this.earthTerminator.Anchored = true;
		this.earthTerminator.Name = "EarthTerminator";
		this.earthTerminator.CanCollide = false;
		this.earthTerminator.CanQuery = false;
		this.earthTerminator.CanTouch = false;
		this.earthTerminator.Size = new Vector3(1, 1, 1);
		this.earthTerminator.Color = new Color3(33 / 255, 84 / 255, 185 / 255);
		this.earthTerminator.Transparency = 1;
		this.earthTerminator.CastShadow = false;

		this.earthTerminator2 = new Instance("Part", this.atmosphereModel);
		this.earthTerminator2.Anchored = true;
		this.earthTerminator2.Name = "EarthTerminator2";
		this.earthTerminator2.CanCollide = false;
		this.earthTerminator2.CanQuery = false;
		this.earthTerminator2.CanTouch = false;
		this.earthTerminator2.Size = new Vector3(1, 1, 1);
		this.earthTerminator2.Color = new Color3(33 / 255, 84 / 255, 185 / 255);
		this.earthTerminator2.Transparency = 1;
		this.earthTerminator2.CastShadow = false;

		this.earthTerminatorMesh = new Instance("FileMesh", this.earthTerminator);
		this.earthTerminatorMesh.MeshId = "rbxassetid://5276376752";

		this.earthTerminatorTexture = new Instance("Decal", this.earthTerminator);
		this.earthTerminatorTexture.Texture = "rbxassetid://5410829227";

		this.earthTerminatorMesh2 = new Instance("FileMesh", this.earthTerminator);
		this.earthTerminatorMesh2.MeshId = "rbxassetid://5276376752";

		this.earthTerminatorTexture2 = new Instance("Decal", this.earthTerminator);
		this.earthTerminatorTexture2.Texture = "rbxassetid://5410829627";

		this.showTerminator = 1;
		this.horizonElevationSunsetDifference10 = 10;
		this.sunR = 255;
		this.sunG = 255;
		this.sunB = 255;
		this.sunOffsetX = 0;
		this.sunOffsetZ = 0;
		this.initialTime = Lighting.ClockTime;
		this.initialGL = Lighting.GeographicLatitude;

		this.extinction = ReplicatedStorage.Assets.Atmosphere.AtmosphericExtinction.Clone();
		this.extinctionSunset =
			ReplicatedStorage.Assets.Atmosphere.AtmosphericExtinctionSunset.Clone() as typeof this.extinctionSunset;
		this.extinction.Parent = this.atmosphereModel;
		this.extinctionSunset.Parent = this.atmosphereModel;

		this.lightEmissionEquation = 1;
		this.extinctionTransparencyEquation = 0;
		this.extinctionWidthEquation = 40000;
		this.extinctionOrientationEquation = 81;
		this.outdoorAmbientBrightnessEquation = 128;
		this.sunBrightness = 5;

		this.AirglowLayer = new Instance("Part", this.atmosphereModel);
		this.AirglowLayer.Anchored = true;
		this.AirglowLayer.Name = "Airglow";
		this.AirglowLayer.CanCollide = false;
		this.AirglowLayer.CanTouch = false;
		this.AirglowLayer.CanQuery = false;
		this.AirglowLayer.Size = new Vector3(1, 1, 1);
		this.AirglowLayer.Color = new Color3(58 / 255, 125 / 255, 21 / 255);
		this.AirglowLayer.Orientation = new Vector3(0, 0, 0);
		this.AirglowLayer.CastShadow = false;
		this.AirglowLayer.Material = Enum.Material.ForceField;
		this.AirglowLayer.Transparency = this.settings.airglowTransparency;

		this.AirglowMesh = new Instance("FileMesh", this.AirglowLayer);
		this.AirglowMesh.MeshId = "rbxassetid://1886703108";
		this.AirglowMesh.TextureId = "rbxassetid://2013298";
		this.AirglowMesh.VertexColor = new Vector3(0, 1, 0);

		this.BottomAtmosphere = new Instance("Part", this.atmosphereModel);
		this.BottomAtmosphere.Anchored = true;
		this.BottomAtmosphere.Name = "BottomAtmosphere";
		this.BottomAtmosphere.CanCollide = false;
		this.BottomAtmosphere.CanTouch = false;
		this.BottomAtmosphere.CanQuery = false;
		this.BottomAtmosphere.Size = new Vector3(1, 1, 1);
		this.BottomAtmosphere.Color = new Color3(33 / 255, 84 / 255, 185 / 255);
		this.BottomAtmosphere.Orientation = new Vector3(0, 90, -90);
		this.BottomAtmosphere.CastShadow = false;
		this.BottomAtmosphere.Material = Enum.Material.ForceField;
		this.BottomAtmosphere.Transparency = 0.6;

		this.BottomAtmosphereMesh = new Instance("FileMesh", this.BottomAtmosphere);
		this.BottomAtmosphereMesh.MeshId = "rbxassetid://5276376752";
		this.BottomAtmosphereMesh.TextureId = "rbxassetid://2013298";
		this.BottomAtmosphereMesh.VertexColor = new Vector3((115 / 255) * 2, (152 / 255) * 2, 2);
		this.BottomAtmosphereMesh.Scale = new Vector3(400, 3000, 3000);

		this.extinctionSunsetTransparencyEquation = 1;
		this.Sun3D = ReplicatedStorage.Assets.Atmosphere.Sun3D.Clone();
		this.Sun3D.Parent = this.atmosphereModel;
		this.BottomAtmosphereDarkness = new Instance("Decal", this.BottomAtmosphere);
		this.BottomAtmosphereDarkness.Texture = "rbxassetid://7983012824";
		this.Sun3D.Transparency = 0.011;
		Lighting.EnvironmentDiffuseScale = 0;

		this.initializeScreenSunshine();
		this.postInitialize();
	}

	static initializeScreenSunshine() {
		const SunTextureGui = new Instance("ScreenGui", Gui.getPlayerGui());
		SunTextureGui.DisplayOrder = -1;
		SunTextureGui.Name = "Sun";

		const SunTexture = new Instance("ImageLabel", SunTextureGui);
		SunTexture.Image = this.settings.sunshineTexture;
		SunTexture.BackgroundTransparency = 1;
		SunTexture.Size = new UDim2(0, 1000, 0, 1000);
		SunTexture.AnchorPoint = new Vector2(0.5, 0.5);
		SunTexture.ZIndex = 1;
		let IsObstructed = false;
		const SunTexture2 = new Instance("ImageLabel", SunTextureGui);
		SunTexture2.Image = "rbxassetid://5200654205";
		SunTexture2.BackgroundTransparency = 1;
		SunTexture2.Size = new UDim2(0, 2100 / this.camera.FieldOfView, 0, 2100 / this.camera.FieldOfView);
		SunTexture2.AnchorPoint = new Vector2(0.5, 0.5);
		SunTexture2.ZIndex = 2;
		const SunTexture3 = SunTexture.Clone();
		SunTexture3.Parent = SunTextureGui;

		this.earth.Orientation = this.settings.initialPlanetOrientation;
		this.sunOffsetX = 0;
		this.sunOffsetX = 0;

		//RunService.UnbindFromRenderStep("Sunshine")
		RunService.BindToRenderStep("Sunshine", Enum.RenderPriority.Last.Value, () => {
			if (this.settings.enableSun) {
				SunTextureGui.Enabled = true;
				this.sky.SunTextureId = "rbxasset://sky/sun.jpg";
			} else {
				SunTextureGui.Enabled = false;
				this.sky.SunTextureId = "";
			}

			const ScaleFactor = this.settings.scale ** -1;
			const x = (this.camera.CFrame.Position.Y + this.settings.altitudeOffset) * ScaleFactor;
			const SunBrightness = this.settings.sunBrightness;
			const SunDirectionV = Lighting.GetSunDirection();
			const sunPosition = this.camera.CoordinateFrame.Position.add(SunDirectionV).mul(999);
			const [screenPosition, isVisible] = this.camera.WorldToScreenPoint(sunPosition);
			const CamToSun = new Ray(this.camera.CoordinateFrame.Position, SunDirectionV.mul(999));
			const CamToSunDirection = SunDirectionV.mul(999).sub(this.camera.CFrame.LookVector);
			const ignore: Instance[] = [];
			const SunElevation = math.deg(
				math.atan(CamToSunDirection.Y / math.sqrt(CamToSunDirection.X ** ((2 + CamToSunDirection.Z) ** 2))),
			);
			const HorizonElevation = -math.deg(math.acos(20925656.2 / (20925656.2 + x)));
			const CamZoomDistance = this.camera.Focus.Position.sub(this.camera.CFrame.Position).Magnitude;
			this.horizonElevationSunsetDifference = SunElevation - HorizonElevation;
			const ApparentDiameter = this.settings.sunApparentDiameter;
			const SunExtinctionColorR = this.settings.sunAtmosphericExtinctionColor.R * 255;
			const SunExtinctionColorG = this.settings.sunAtmosphericExtinctionColor.G * 255;
			const SunExtinctionColorB = this.settings.sunAtmosphericExtinctionColor.B * 255;
			const SunExtinctionColorIntermediateR = this.settings.sunAtmosphericExtinctionIntermediateColor.R * 255;
			const SunExtinctionColorIntermediateG = this.settings.sunAtmosphericExtinctionIntermediateColor.G * 255;
			const SunExtinctionColorIntermediateB = this.settings.sunAtmosphericExtinctionIntermediateColor.B * 255;
			const SunsetFOVTransparencyScale =
				1 -
				math.clamp(
					((this.camera.FieldOfView - 5) / 5 + 1) * this.horizonElevationSunsetDifference ** (3 / 10),
					0,
					1,
				);
			const H1 = 6 * 2 ** (-x / 500000);

			if (this.horizonElevationSunsetDifference <= 0) {
				this.horizonElevationSunsetDifference10 = 0;
			} else if (this.horizonElevationSunsetDifference > 0 && this.horizonElevationSunsetDifference <= H1) {
				this.horizonElevationSunsetDifference10 = this.horizonElevationSunsetDifference;
			} else if (this.horizonElevationSunsetDifference > H1) {
				this.horizonElevationSunsetDifference10 = H1;
			}

			const HorizonElevationSunsetDifference10Ratio = this.horizonElevationSunsetDifference10 / H1;
			const HorizonElevationSunsetDifference10Ratio3 =
				(math.clamp(this.horizonElevationSunsetDifference10, 0, 2) * 3) / H1;
			const HorizonElevationSunsetDifference10Ratio1_5 =
				(math.clamp(this.horizonElevationSunsetDifference10, 0, 1) * 6) / H1;

			ignore.push(this.atmosphere);
			if (CamZoomDistance <= 1.1) {
				// Check if player is in first person.
				ignore.push(Players.LocalPlayer.Character!);
			} else if (CamZoomDistance > 1.1) {
				ignore.remove(ignore.indexOf(Players.LocalPlayer.Character!));
			}

			// Checks if something is blocking the Sun
			const [Obstructed, hitPosition] = Workspace.FindPartOnRayWithIgnoreList(CamToSun, ignore);
			SunTexture.Position = new UDim2(0, screenPosition.X, 0, screenPosition.Y);
			SunTexture2.Position = new UDim2(0, screenPosition.X, 0, screenPosition.Y);
			SunTexture3.Position = new UDim2(0, screenPosition.X, 0, screenPosition.Y);

			if (Obstructed) {
				IsObstructed = true;
			} else {
				IsObstructed = false;
			}

			// Converts the Sun's location in the sky to position coordinates of the shine gui.
			if (isVisible) {
				const AltitudeSunTransparencyFadeRate = math.clamp(
					-0.00000133333333333 * x + 0.75666666666666,
					0.55,
					0.75,
				);
				SunTexture.ImageTransparency =
					1 -
					math.clamp(
						(2 - 2.6111111111111 * AltitudeSunTransparencyFadeRate) *
							30 *
							(HorizonElevationSunsetDifference10Ratio3 +
								0.55 -
								AltitudeSunTransparencyFadeRate -
								SunsetFOVTransparencyScale),
						0,
						1,
					);
				SunTexture.TweenSize(
					new UDim2(
						0,
						100 +
							HorizonElevationSunsetDifference10Ratio *
								900 *
								SunBrightness *
								(-((this.camera.FieldOfView - 70) / 200) + 1),
						0,
						100 +
							HorizonElevationSunsetDifference10Ratio *
								900 *
								SunBrightness *
								(-((this.camera.FieldOfView - 70) / 200) + 1),
					),
					Enum.EasingDirection.Out,
					Enum.EasingStyle.Quad,
					0.1,
					true,
				);
				SunTexture2.ImageTransparency =
					1 -
					math.clamp(
						(2 - 2.6111111111111 * AltitudeSunTransparencyFadeRate) *
							30 *
							(HorizonElevationSunsetDifference10Ratio1_5 +
								0.55 -
								AltitudeSunTransparencyFadeRate -
								SunsetFOVTransparencyScale),
						0,
						1,
					);
				SunTexture2.TweenSize(
					new UDim2(
						0,
						((2.5 * this.camera.ViewportSize.Y * ApparentDiameter) / 31.983 / this.camera.FieldOfView) *
							SunBrightness,
						0,
						((2.5 * this.camera.ViewportSize.Y * ApparentDiameter) / 31.9 / this.camera.FieldOfView) *
							SunBrightness,
					),
					Enum.EasingDirection.Out,
					Enum.EasingStyle.Quad,
					0.1,
					true,
				);
				const SunApparentDiameterRatio = this.settings.sunApparentDiameter / 31.983;
				this.Sun3D.SunsetLight.Light.ImageTransparency = HorizonElevationSunsetDifference10Ratio;
				this.Sun3D.Mesh.Scale = new Vector3(
					12.25,
					10.5 + 1.75 * HorizonElevationSunsetDifference10Ratio,
					12.25,
				).mul(SunApparentDiameterRatio);
				if (IsObstructed === true) {
					SunTexture.TweenSize(
						new UDim2(0, -5, 0, -5),
						Enum.EasingDirection.Out,
						Enum.EasingStyle.Quad,
						0.1,
						true,
					);
					SunTexture2.TweenSize(
						new UDim2(0, -5, 0, -5),
						Enum.EasingDirection.Out,
						Enum.EasingStyle.Quad,
						0.1,
						true,
					);
				} else if (SunElevation <= HorizonElevation) {
					SunTexture.TweenSize(
						new UDim2(0, -5, 0, -5),
						Enum.EasingDirection.Out,
						Enum.EasingStyle.Quad,
						0.1,
						true,
					);
					SunTexture2.TweenSize(
						new UDim2(0, -5, 0, -5),
						Enum.EasingDirection.Out,
						Enum.EasingStyle.Quad,
						0.1,
						true,
					);
				} else if (HorizonElevation !== HorizonElevation) {
					SunTexture.TweenSize(
						new UDim2(0, -5, 0, -5),
						Enum.EasingDirection.Out,
						Enum.EasingStyle.Quad,
						0.1,
						true,
					);
					SunTexture2.TweenSize(
						new UDim2(0, -5, 0, -5),
						Enum.EasingDirection.Out,
						Enum.EasingStyle.Quad,
						0.1,
						true,
					);
				}
				SunTexture3.Size = new UDim2(0, SunTexture.Size.X.Offset / 2, 0, SunTexture.Size.Y.Offset / 2);
				SunTexture3.ImageColor3 = new Color3(
					SunTexture.ImageColor3.R * 1.5,
					SunTexture.ImageColor3.G * 1.5,
					SunTexture.ImageColor3.B * 1.5,
				);
				SunTexture3.Position = SunTexture.Position;
				SunTexture3.Rotation = SunTexture.Rotation;
				SunTexture3.ImageTransparency = SunTexture.ImageTransparency;
			} else {
				SunTexture.TweenSize(
					new UDim2(0, -5, 0, -5),
					Enum.EasingDirection.Out,
					Enum.EasingStyle.Quad,
					0.1,
					true,
				);
				SunTexture2.TweenSize(
					new UDim2(0, -5, 0, -5),
					Enum.EasingDirection.Out,
					Enum.EasingStyle.Quad,
					0.1,
					true,
				);
				SunTexture3.Size = SunTexture.Size;
			}

			// To ensure the Sun is completely invisible when player is facing away from the Sun.
			if (SunTexture.Size.X.Offset <= 0) {
				SunTexture.Visible = false;
				SunTexture2.Visible = false;
				SunTexture3.Visible = false;
			} else {
				SunTexture.Visible = true;
				SunTexture2.Visible = true;
				SunTexture3.Visible = true;
			}

			// Sun Temperature
			let TempValue = math.clamp(this.settings.sunTemp, 2001, math.huge);
			if (this.settings.enableSunsetScattering === false) {
				TempValue = this.settings.sunTemp;
			}
			const Temp = (TempValue + 1095) / 100;
			if (TempValue <= 0) {
				this.sunR = 255;
				this.sunG = 76;
				this.sunB = 0;
			} else if (TempValue > 0 && TempValue <= 1000) {
				this.sunR = 255;
				this.sunG = 99.4708025861 * math.log(Temp) - 161.1195681661;
				this.sunB = 0;
			} else if (TempValue > 1000 && TempValue <= 2000) {
				this.sunR = 255;
				this.sunG = 104.49216199393888 * math.log(Temp - 2) - 0.44596950469579133 * Temp - 155.25485562709179;
				this.sunB = 0;
			} else if (TempValue > 2000 && TempValue <= 6600) {
				this.sunR = 255;
				this.sunG = 104.49216199393888 * math.log(Temp - 2) - 0.44596950469579133 * Temp - 155.25485562709179;
				this.sunB = 115.67994401066147 * math.log(Temp - 10) + 0.8274096064007395 * Temp - 254.76935184120902;
			} else if (TempValue > 6600 && TempValue <= 40000) {
				this.sunR = -40.25366309332127 * math.log(Temp - 55) + 0.114206453784165 * Temp + 351.97690566805693;
				this.sunG = -28.0852963507957 * math.log(Temp - 50) + 0.07943456536662342 * Temp + 325.4494125711974;
				this.sunB = 255;
			} else if (TempValue > 40000) {
				this.sunR = 162;
				this.sunG = 192;
				this.sunB = 255;
			}

			const H2 = 3 * 2 ** (-x / 500000);
			if (this.settings.enableSunsetScattering) {
				const IntermediateColor = new Color3(
					math.clamp(
						(((this.sunR - math.clamp(SunExtinctionColorIntermediateR, 0, this.sunR - 1)) /
							(H2 * 2 ** (-x / 500000))) *
							(math.clamp(this.horizonElevationSunsetDifference10, H2, H2 * 2) - H2) +
							SunExtinctionColorIntermediateR) /
							255,
						0,
						1,
					),
					math.clamp(
						(((this.sunG - math.clamp(SunExtinctionColorIntermediateG, 0, this.sunG - 1)) /
							(H2 * 2 ** (-x / 500000))) *
							(math.clamp(this.horizonElevationSunsetDifference10, H2, H2 * 2) - H2) +
							SunExtinctionColorIntermediateG) /
							255,
						0,
						1,
					),
					math.clamp(
						(((this.sunB - math.clamp(SunExtinctionColorIntermediateB, 0, this.sunB - 1)) /
							(H2 * 2 ** (-x / 500000))) *
							(math.clamp(this.horizonElevationSunsetDifference10, H2, H2 * 2) - H2) +
							SunExtinctionColorIntermediateB) /
							255,
						0,
						1,
					),
				);
				SunTexture.ImageColor3 = new Color3(
					(((IntermediateColor.R * 255 - SunExtinctionColorR) / (6 * 2 ** (-x / 500000))) *
						this.horizonElevationSunsetDifference10 +
						SunExtinctionColorR) /
						255,
					(((IntermediateColor.G * 255 - SunExtinctionColorG) / (6 * 2 ** (-x / 500000))) *
						this.horizonElevationSunsetDifference10 +
						SunExtinctionColorG) /
						255,
					(((IntermediateColor.B * 255 - SunExtinctionColorB) / (6 * 2 ** (-x / 500000))) *
						this.horizonElevationSunsetDifference10 +
						SunExtinctionColorB) /
						255,
				);
			} else {
				SunTexture.ImageColor3 = new Color3(
					(((this.sunR - SunExtinctionColorR) / (6 * 2 ** (-x / 500000))) *
						this.horizonElevationSunsetDifference10 +
						SunExtinctionColorR) /
						255,
					(((this.sunG - SunExtinctionColorG) / (6 * 2 ** (-x / 500000))) *
						this.horizonElevationSunsetDifference10 +
						SunExtinctionColorG) /
						255,
					(((this.sunB - SunExtinctionColorB) / (6 * 2 ** (-x / 500000))) *
						this.horizonElevationSunsetDifference10 +
						SunExtinctionColorB) /
						255,
				);
			}
			SunTexture.Rotation = -(screenPosition.X - this.camera.ViewportSize.X / 2) / 100; // Sunshine rotation as a function of the screen's x-axis.

			// 3D SUNSET

			if (Lighting.ClockTime < 12) {
				this.Sun3D.SunsetLight.ExtentsOffsetWorldSpace = new Vector3(5, 0, 0);
			} else {
				this.Sun3D.SunsetLight.ExtentsOffsetWorldSpace = new Vector3(-5, 0, 0);
			}

			let AboveHorizon = this.horizonElevationSunsetDifference > -2;
			if (x > 5000) {
				AboveHorizon = this.horizonElevationSunsetDifference > 0;
			} else if (x > 1000 && x <= 5000) {
				AboveHorizon = this.horizonElevationSunsetDifference > -0.5;
			}
			if (this.settings.enableSun) {
				if (AboveHorizon && this.horizonElevationSunsetDifference < H1) {
					this.Sun3D.Position = this.camera.CFrame.Position;
					this.Sun3D.Mesh.Offset = new Vector3(70000, 70000, 70000).mul(SunDirectionV);
				} else {
					this.Sun3D.Position = new Vector3(0, -200000, 0);
					this.Sun3D.Mesh.Offset = this.Sun3D.Position;
				}
				this.Sun3D.SunsetLight.StudsOffsetWorldSpace = this.Sun3D.Mesh.Offset;
				this.Sun3D.SunsetLight.Brightness = math.clamp(400 - x / 28, 40, 400);
				this.Sun3D.SunsetLight.Size = new UDim2(
					10000 * SunBrightness,
					0,
					math.clamp(-x / 16 + 10000, 4000, 10000) * SunBrightness,
					0,
				);
				this.Sun3D.SunsetLight.Light.ImageColor3 = this.settings.threeDimensionalSunAtmosphericExtinctionColor;
			} else {
				this.Sun3D.Position = this.camera.CFrame.Position.sub(new Vector3(0, 100000, 0));
			}
		});
	}

	static postInitialize() {
		RunService.RenderStepped.Connect((dt) => {
			if (!LocalPlayerController.rootPart) return;

			const ScaleFactor = this.settings.scale ** -1;
			const AtmoThinness = this.settings.atmosphereTransparency;
			const AtmoHeight = (this.settings.atmosphereThickness ** -1) ** 0.0625;
			const ColorR = this.settings.atmosphereColor.R * 255;
			const ColorG = this.settings.atmosphereColor.G * 255;
			const ColorB = this.settings.atmosphereColor.B * 255;
			const ColorRSunset = this.settings.atmosphereSunsetColor.R * 255;
			const ColorGSunset = this.settings.atmosphereSunsetColor.G * 255;
			const ColorBSunset = this.settings.atmosphereSunsetColor.B * 255;
			const ColorR2 = this.settings.distantSurfaceColor.R * 255;
			const ColorG2 = this.settings.distantSurfaceColor.G * 255;
			const ColorB2 = this.settings.distantSurfaceColor.B * 255;
			const SunBrightness = this.settings.sunBrightness;
			const x = (this.camera.CFrame.Position.Y + this.settings.altitudeOffset) * ScaleFactor;
			const SunDirectionV = Lighting.GetSunDirection();
			const CamToSunDirection = SunDirectionV.mul(999).sub(this.camera.CFrame.LookVector);
			const SunElevation = math.deg(
				math.atan(CamToSunDirection.Y / math.sqrt(CamToSunDirection.X ** ((2 + CamToSunDirection.Z) ** 2))),
			);
			const HorizonElevation = -math.deg(math.acos(20925656.2 / (20925656.2 + math.clamp(x, 0, math.huge))));
			this.horizonElevationSunsetDifference = SunElevation - HorizonElevation;
			const EarthTransparencyAltitudeMultiplier = 1 / (1 + 5) ** (this.horizonElevationSunsetDifference - 4);
			const LookAngle = math.deg(
				math.atan(
					this.camera.CFrame.LookVector.Y /
						math.sqrt(this.camera.CFrame.LookVector.X ** ((2 + this.camera.CFrame.LookVector.Z) ** 2)),
				),
			);
			const LookAngleHorizonDifference = LookAngle - HorizonElevation;
			this.earthTerminatorX = 1.01;
			this.earthTerminatorY = 1.2;
			const H3 = 10 * 2 ** (-x / 500000);
			const H15 = 15 * 2 ** (-x / 500000);

			// Makes the atmosphere respond to sunlight.

			const t3 = Lighting.GetMinutesAfterMidnight();
			if (this.horizonElevationSunsetDifference <= -18) {
				this.atmosphere.Transparency = 1;
				this.sky.StarCount = 3000;
			} else if (this.horizonElevationSunsetDifference > -18 && this.horizonElevationSunsetDifference <= -14) {
				this.atmosphere.Transparency = -(this.horizonElevationSunsetDifference + 14) / 4;
				this.sky.StarCount = 3000;
			} else if (this.horizonElevationSunsetDifference > -14 && this.horizonElevationSunsetDifference <= 0) {
				this.atmosphere.Transparency = 0;
				this.sky.StarCount = 3000;
			} else if (this.horizonElevationSunsetDifference > 0) {
				this.atmosphere.Transparency = 0;
				this.sky.StarCount = 0;
			}

			if (this.horizonElevationSunsetDifference >= 0 && this.horizonElevationSunsetDifference < 3.75) {
				// Pre-Sunrise/set
				const ColorRResultant = math.clamp(
					(-(ColorRSunset - ColorR) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorRSunset,
					math.min(ColorR, ColorRSunset),
					math.max(ColorR, ColorRSunset),
				);
				const ColorGResultant = math.clamp(
					(-(ColorGSunset - ColorG) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorGSunset,
					math.min(ColorG, ColorGSunset),
					math.max(ColorG, ColorGSunset),
				);
				const ColorBResultant = math.clamp(
					(-(ColorBSunset - ColorB) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorBSunset,
					math.min(ColorB, ColorBSunset),
					math.min(ColorB, ColorBSunset),
				);
				this.outdoorAmbientBrightnessEquation =
					(this.settings.outdoorAmbientBrightnessDay - this.settings.outdoorAmbientBrightnessNight / 17.75) *
						(this.horizonElevationSunsetDifference - 3.75) +
					this.settings.outdoorAmbientBrightnessDay / 255;
				Lighting.FogColor = new Color3(
					((ColorRResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
					((ColorGResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
					((ColorBResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
				);
				Lighting.FogEnd =
					(-100000 * (this.horizonElevationSunsetDifference - 3.75) + 100000) *
					this.fogEndRatio *
					AtmoThinness;
				this.distantSurface.Color = new Color3(ColorR2 / 255, ColorG2 / 255, ColorB2 / 255);
				this.sunBrightness = this.settings.sunlightBrightness;
				this.AirglowLayer.Transparency = 1;
				this.earthTransparency =
					(this.settings.planetTransparency / 3.75) * this.horizonElevationSunsetDifference + 0.011;
				this.earthTexture.Color3 = new Color3(1, 1, 1);
			} else if (this.horizonElevationSunsetDifference >= -7 && this.horizonElevationSunsetDifference < 0) {
				// Civil twilight
				const ColorRResultant = math.clamp(
					(-(ColorRSunset - ColorR) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorRSunset,
					math.min(ColorR, ColorRSunset),
					math.max(ColorR, ColorRSunset),
				);
				const ColorGResultant = math.clamp(
					(-(ColorGSunset - ColorG) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorGSunset,
					math.min(ColorG, ColorGSunset),
					math.max(ColorG, ColorGSunset),
				);
				const ColorBResultant = math.clamp(
					(-(ColorBSunset - ColorB) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorBSunset,
					math.min(ColorB, ColorBSunset),
					math.min(ColorB, ColorBSunset),
				);
				this.outdoorAmbientBrightnessEquation =
					(((this.settings.outdoorAmbientBrightnessDay - this.settings.outdoorAmbientBrightnessNight) /
						17.75) *
						(this.horizonElevationSunsetDifference - 3.75) +
						this.settings.outdoorAmbientBrightnessDay) /
					255;
				Lighting.FogColor = new Color3(
					((ColorRResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
					((ColorGResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
					((ColorBResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
				);
				Lighting.FogEnd =
					(-25000 * this.horizonElevationSunsetDifference + 475000) * this.fogEndRatio * AtmoThinness;
				this.distantSurface.Color = new Color3(0, 0, 0);
				this.sunBrightness = this.settings.nightBrightness;
				this.AirglowLayer.Transparency = this.settings.airglowTransparency + this.airglowTransparency;
				this.earthTransparency = 0.011;
				this.earthTexture.Color3 = new Color3(7, 7, 4.5);
			} else if (this.horizonElevationSunsetDifference >= -14 && this.horizonElevationSunsetDifference < -7) {
				// Nautical twilight
				const ColorRResultant = math.clamp(
					(-(ColorRSunset - ColorR) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorRSunset,
					math.min(ColorR, ColorRSunset),
					math.max(ColorR, ColorRSunset),
				);
				const ColorGResultant = math.clamp(
					(-(ColorGSunset - ColorG) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorGSunset,
					math.min(ColorG, ColorGSunset),
					math.max(ColorG, ColorGSunset),
				);
				const ColorBResultant = math.clamp(
					(-(ColorBSunset - ColorB) / (H3 / 2.666666666666)) *
						math.abs(this.horizonElevationSunsetDifference) +
						ColorBSunset,
					math.min(ColorB, ColorBSunset),
					math.min(ColorB, ColorBSunset),
				);
				this.outdoorAmbientBrightnessEquation =
					(((this.settings.outdoorAmbientBrightnessDay - this.settings.outdoorAmbientBrightnessNight) /
						17.75) *
						(this.horizonElevationSunsetDifference - 3.75) +
						this.settings.outdoorAmbientBrightnessDay) /
					255;
				Lighting.FogColor = new Color3(
					((ColorRResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
					((ColorGResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
					((ColorBResultant / 17.75) * (this.horizonElevationSunsetDifference + 14)) / 255,
				);
				Lighting.FogEnd =
					((550000 / 7) * (this.horizonElevationSunsetDifference + 7) + 650000) *
					this.fogEndRatio *
					AtmoThinness;
				this.distantSurface.Color = new Color3(0, 0, 0);
				this.sunBrightness = this.settings.nightBrightness;
				this.AirglowLayer.Transparency = this.settings.airglowTransparency + this.airglowTransparency;
				this.earthTransparency = 0.011;
				this.earthTexture.Color3 = new Color3(7, 7, 4.5);
			} else if (this.horizonElevationSunsetDifference < -14) {
				// Night
				this.outdoorAmbientBrightnessEquation = this.settings.outdoorAmbientBrightnessNight / 255;
				Lighting.FogColor = new Color3(0, 0, 0);
				Lighting.FogEnd = 100000 * this.fogEndRatio * AtmoThinness;
				this.distantSurface.Color = new Color3(0, 0, 0);
				this.sunBrightness = this.settings.nightBrightness;
				this.AirglowLayer.Transparency = this.settings.airglowTransparency + this.airglowTransparency;
				this.earthTransparency = 0.011;
				this.earthTexture.Color3 = new Color3(7, 7, 4.5);
			} else if (this.horizonElevationSunsetDifference >= 3.75) {
				// Broad daylight
				this.outdoorAmbientBrightnessEquation = this.settings.outdoorAmbientBrightnessDay / 255;
				Lighting.FogColor = new Color3(ColorR / 255, ColorG / 255, ColorB / 255);
				Lighting.FogEnd = 100000 * this.fogEndRatio * AtmoThinness;
				this.distantSurface.Color = new Color3(ColorR2 / 255, ColorG2 / 255, ColorB2 / 255);
				this.sunBrightness = this.settings.sunlightBrightness;
				this.AirglowLayer.Transparency = 1;
				this.earthTransparency = this.settings.planetTransparency;
				this.earthTexture.Color3 = new Color3(1, 1, 1);
			}

			const DaycolorR = this.settings.daytimeSunlightColor.R;
			const DaycolorG = this.settings.daytimeSunlightColor.G;
			const DaycolorB = this.settings.daytimeSunlightColor.B;
			const SunsetColorR = this.settings.sunriseSunlightColor.R;
			const SunsetColorG = this.settings.sunriseSunlightColor.G;
			const SunsetColorB = this.settings.sunriseSunlightColor.B;
			if (this.settings.enableEnvironmentalLightingChanges) {
				Lighting.OutdoorAmbient = new Color3(
					this.outdoorAmbientBrightnessEquation,
					this.outdoorAmbientBrightnessEquation,
					this.outdoorAmbientBrightnessEquation,
				);
				Lighting.Brightness = SunBrightness;
				Lighting.ColorShift_Top = new Color3(
					((DaycolorR - SunsetColorR) / (6 * 2 ** (-x / 500000))) * this.horizonElevationSunsetDifference10 +
						SunsetColorR,
					((DaycolorG - SunsetColorG) / (6 * 2 ** (-x / 500000))) * this.horizonElevationSunsetDifference10 +
						SunsetColorG,
					((DaycolorB - SunsetColorB) / (6 * 2 ** (-x / 500000))) * this.horizonElevationSunsetDifference10 +
						SunsetColorB,
				);
			}

			const AtmosphericExtinctionR = this.settings.atmosphericExtinctionColor.R * 255;
			const AtmosphericExtinctionG = this.settings.atmosphericExtinctionColor.G * 255;
			const AtmosphericExtinctionB = this.settings.atmosphericExtinctionColor.B * 255;

			const HorizonElevationSunsetDifferenceAdjustmentEquation =
				-((this.horizonElevationSunsetDifference - 10) ** 4 / 1000) + 10;

			if (this.horizonElevationSunsetDifference <= H3 && this.horizonElevationSunsetDifference > 0) {
				this.lightEmissionEquation = (1 / H3) * this.horizonElevationSunsetDifference;
				this.extinctionTransparencyEquation = (1 / H3) * this.horizonElevationSunsetDifference;
				if (this.settings.enableSunsetScattering) {
					this.extinctionTransparencyEquation =
						(0.8 / H3) * HorizonElevationSunsetDifferenceAdjustmentEquation;
					this.extinctionColorEquation = Color3.fromRGB(
						((255 - AtmosphericExtinctionR) / 10) *
							2 ** (-x / 500000) *
							this.horizonElevationSunsetDifference +
							AtmosphericExtinctionR,
						((255 - AtmosphericExtinctionG) / 10) *
							2 ** (-x / 500000) *
							this.horizonElevationSunsetDifference +
							AtmosphericExtinctionG,
						((255 - AtmosphericExtinctionB) / 10) *
							2 ** (-x / 500000) *
							this.horizonElevationSunsetDifference +
							AtmosphericExtinctionB,
					);
				} else {
					this.extinctionTransparencyEquation = 0.8;
					this.extinctionColorEquation = Color3.fromRGB(255, 255, 255);
				}
			} else if (this.horizonElevationSunsetDifference > H3) {
				this.lightEmissionEquation = 1;
				this.extinctionTransparencyEquation = 0.8;
				this.extinctionSunsetTransparencyEquation = 1;
				this.extinctionColorEquation = Color3.fromRGB(255, 255, 255);
			} else if (this.horizonElevationSunsetDifference > -14 && this.horizonElevationSunsetDifference <= 0) {
				this.lightEmissionEquation = 0;
				this.extinctionTransparencyEquation =
					(1 / (1.2 * H3)) * math.abs(this.horizonElevationSunsetDifference);
				if (this.settings.enableSunsetScattering) {
					this.extinctionTransparencyEquation = -this.horizonElevationSunsetDifference / 14;
					const AstroAtmosphericExtinctionR =
						this.settings.astronomicalTwilightAtmosphericExtinctionColor.R * 255;
					const AstroAtmosphericExtinctionG =
						this.settings.astronomicalTwilightAtmosphericExtinctionColor.G * 255;
					const AstroAtmosphericExtinctionB =
						this.settings.astronomicalTwilightAtmosphericExtinctionColor.B * 255;
					this.extinctionColorEquation = Color3.fromRGB(
						((AstroAtmosphericExtinctionR - AtmosphericExtinctionR) / 14) *
							-this.horizonElevationSunsetDifference +
							AtmosphericExtinctionR,
						((AstroAtmosphericExtinctionG - AtmosphericExtinctionG) / 14) *
							-this.horizonElevationSunsetDifference +
							AtmosphericExtinctionG,
						((AstroAtmosphericExtinctionB - AtmosphericExtinctionB) / 14) *
							-this.horizonElevationSunsetDifference +
							AtmosphericExtinctionB,
					);
				} else {
					this.extinctionTransparencyEquation = 0.8;
					this.extinctionColorEquation = Color3.fromRGB(255, 255, 255);
				}
			} else if (this.horizonElevationSunsetDifference <= -14) {
				this.lightEmissionEquation = 0;
				this.extinctionTransparencyEquation = 1;
				this.extinctionSunsetTransparencyEquation = 1;
				if (this.settings.enableSunsetScattering) {
					this.extinctionColorEquation = Color3.fromRGB(
						AtmosphericExtinctionR,
						AtmosphericExtinctionG,
						AtmosphericExtinctionB,
					);
				} else {
					this.extinctionTransparencyEquation = 0.8;
					this.extinctionColorEquation = Color3.fromRGB(255, 255, 255);
				}
			}

			const ExtinctionIntensity = ((1 - 5) / 20000) * math.clamp(x - 20000, 0, 20000) + 5;
			this.extinction.AtmosphericExtinction2.Beam1.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam2.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam3.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam4.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam5.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam6.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam7.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam8.Brightness = ExtinctionIntensity;
			this.extinction.AtmosphericExtinction2.Beam1.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam2.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam3.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam4.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam5.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam6.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam7.LightEmission = this.lightEmissionEquation;
			this.extinction.AtmosphericExtinction2.Beam8.LightEmission = this.lightEmissionEquation;
			const ExtinctionTransNumSequence = new NumberSequence(
				(this.extinctionTransparencyEquation / (1.5 - 0.5 * math.clamp(x / 32808, 0, 1))) *
					((2 / 3) * (1 + (14 + math.clamp(this.horizonElevationSunsetDifference, -14, 0)) / 28)),
			);
			const ExtinctionTransNumSequence_2 = new NumberSequence(
				this.extinctionTransparencyEquation /
					(2 * (1 + math.clamp(this.horizonElevationSunsetDifference, -14, 0) / 28)),
			);
			this.extinction.AtmosphericExtinction2.Beam1.Transparency = ExtinctionTransNumSequence_2;
			this.extinction.AtmosphericExtinction2.Beam2.Transparency = ExtinctionTransNumSequence_2;
			this.extinction.AtmosphericExtinction2.Beam3.Transparency = ExtinctionTransNumSequence_2;
			this.extinction.AtmosphericExtinction2.Beam4.Transparency = ExtinctionTransNumSequence_2;
			this.extinction.AtmosphericExtinction2.Beam5.Transparency = ExtinctionTransNumSequence;
			this.extinction.AtmosphericExtinction2.Beam6.Transparency = ExtinctionTransNumSequence;
			this.extinction.AtmosphericExtinction2.Beam7.Transparency = ExtinctionTransNumSequence;
			this.extinction.AtmosphericExtinction2.Beam8.Transparency = ExtinctionTransNumSequence;
			const ExtinctionColorSequence = new ColorSequence(
				this.extinctionColorEquation,
				new Color3(this.extinctionTransparencyEquation),
				// FIXME: PROBABLY WRONG
			);
			this.extinction.AtmosphericExtinction2.Beam1.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam2.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam3.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam4.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam5.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam6.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam7.Color = ExtinctionColorSequence;
			this.extinction.AtmosphericExtinction2.Beam8.Color = ExtinctionColorSequence;

			// SUNSET
			if (this.extinctionSunsetTransparencyEquation < 1 && this.settings.enableSunsetScattering) {
				const ExtinctionSunsetBrightness = math.clamp(3 * this.horizonElevationSunsetDifference + 10, 10, 40);
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Brightness = ExtinctionSunsetBrightness;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Brightness = ExtinctionSunsetBrightness;
				const ExtinctionTransNumSequenceSunset1 = new NumberSequence([
					new NumberSequenceKeypoint(0, 1),
					new NumberSequenceKeypoint(
						math.clamp((this.horizonElevationSunsetDifference - 10) / 30 + 1, 0.3, 1),
						this.extinctionSunsetTransparencyEquation + 0.1,
					),
					new NumberSequenceKeypoint(1, this.extinctionSunsetTransparencyEquation),
				]);
				const ExtinctionTransNumSequenceSunset2 = new NumberSequence([
					new NumberSequenceKeypoint(0, this.extinctionSunsetTransparencyEquation),
					new NumberSequenceKeypoint(
						math.clamp(-(this.horizonElevationSunsetDifference - 10) / 30, 0.3, 1),
						this.extinctionSunsetTransparencyEquation + 0.1,
					),
					new NumberSequenceKeypoint(1, 1),
				]);
				const ExtinctionTransNumSequenceSunset1BoV = new NumberSequence([
					new NumberSequenceKeypoint(0, 1),
					new NumberSequenceKeypoint(
						math.clamp((this.horizonElevationSunsetDifference - 10) / 30 + 1, 0.3, 1),
						this.extinctionSunsetTransparencyEquation + 0.1,
					),
					new NumberSequenceKeypoint(
						1,
						this.extinctionSunsetTransparencyEquation +
							math.clamp(-(this.horizonElevationSunsetDifference + 6.6) / 2.7, 0, 1),
					),
				]);
				const ExtinctionTransNumSequenceSunset2BoV = new NumberSequence([
					new NumberSequenceKeypoint(
						0,
						this.extinctionSunsetTransparencyEquation +
							math.clamp(-(this.horizonElevationSunsetDifference + 6.6) / 2.7, 0, 1),
					),
					new NumberSequenceKeypoint(
						math.clamp(-(this.horizonElevationSunsetDifference - 10) / 30, 0.3, 1),
						this.extinctionSunsetTransparencyEquation +
							0.1 +
							math.clamp(-(this.horizonElevationSunsetDifference + 6.6) / 2.7, 0, 1),
					),
					new NumberSequenceKeypoint(1, 1),
				]);
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Transparency = ExtinctionTransNumSequenceSunset1;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Transparency = ExtinctionTransNumSequenceSunset2;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Transparency = ExtinctionTransNumSequenceSunset1BoV;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Transparency = ExtinctionTransNumSequenceSunset2BoV;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Transparency = ExtinctionTransNumSequenceSunset1;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Transparency = ExtinctionTransNumSequenceSunset2;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Transparency = ExtinctionTransNumSequenceSunset1BoV;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Transparency = ExtinctionTransNumSequenceSunset2BoV;

				const BeltOfVenusEmission = math.clamp(0.4 * this.horizonElevationSunsetDifference + 1, 0, 1);
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Color = new ColorSequence(
					this.settings.beltOfVenusColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam3.LightEmission = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.LightEmission = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.LightEmission = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.LightEmission = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.LightInfluence = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.LightInfluence = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.LightInfluence = BeltOfVenusEmission;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.LightInfluence = BeltOfVenusEmission;
				let InnerAtmosphericExtinctionColor = this.settings.innerAtmosphericExtinctionColor;
				let InnerExtinctionSunsetColor = Color3.fromRGB(
					((this.settings.atmosphericExtinctionColor.R * 255 -
						this.settings.sunsideAtmosphericExtinctionColor.R * 255) /
						H3) *
						math.abs(this.horizonElevationSunsetDifference) +
						this.settings.sunsideAtmosphericExtinctionColor.R * 255,
					((this.settings.atmosphericExtinctionColor.G * 255 -
						this.settings.sunsideAtmosphericExtinctionColor.G * 255) /
						H3) *
						math.abs(this.horizonElevationSunsetDifference) +
						this.settings.sunsideAtmosphericExtinctionColor.G * 255,
					((this.settings.atmosphericExtinctionColor.B * 255 -
						this.settings.sunsideAtmosphericExtinctionColor.B * 255) /
						H3) *
						math.abs(this.horizonElevationSunsetDifference) +
						this.settings.sunsideAtmosphericExtinctionColor.B * 255,
				);
				if (this.horizonElevationSunsetDifference < 0) {
					InnerExtinctionSunsetColor = Color3.fromRGB(
						((this.settings.nauticalTwlightAtmosphericExtinctionColor.R * 255 -
							this.settings.sunsideAtmosphericExtinctionColor.R * 255) /
							H3) *
							math.abs(this.horizonElevationSunsetDifference) +
							this.settings.sunsideAtmosphericExtinctionColor.R * 255,
						((this.settings.nauticalTwlightAtmosphericExtinctionColor.G * 255 -
							this.settings.sunsideAtmosphericExtinctionColor.G * 255) /
							H3) *
							math.abs(this.horizonElevationSunsetDifference) +
							this.settings.sunsideAtmosphericExtinctionColor.G * 255,
						((this.settings.nauticalTwlightAtmosphericExtinctionColor.B * 255 -
							this.settings.sunsideAtmosphericExtinctionColor.B * 255) /
							H3) *
							math.abs(this.horizonElevationSunsetDifference) +
							this.settings.sunsideAtmosphericExtinctionColor.B * 255,
					);
					InnerAtmosphericExtinctionColor = Color3.fromRGB(
						((this.settings.nauticalInnerAtmosphericExtinctionColor.R * 255 -
							this.settings.innerAtmosphericExtinctionColor.R * 255) /
							H3) *
							math.abs(this.horizonElevationSunsetDifference) +
							this.settings.innerAtmosphericExtinctionColor.R * 255,
						((this.settings.nauticalInnerAtmosphericExtinctionColor.G * 255 -
							this.settings.innerAtmosphericExtinctionColor.G * 255) /
							H3) *
							math.abs(this.horizonElevationSunsetDifference) +
							this.settings.innerAtmosphericExtinctionColor.G * 255,
						((this.settings.nauticalInnerAtmosphericExtinctionColor.B * 255 -
							this.settings.innerAtmosphericExtinctionColor.B * 255) /
							H3) *
							math.abs(this.horizonElevationSunsetDifference) +
							this.settings.innerAtmosphericExtinctionColor.B * 255,
					);
				}
				const ExtinctionSunsetColor1 = new ColorSequence(
					InnerAtmosphericExtinctionColor,
					InnerExtinctionSunsetColor,
				);
				const ExtinctionSunsetColor2 = new ColorSequence(
					InnerExtinctionSunsetColor,
					InnerAtmosphericExtinctionColor,
				);
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Color = ExtinctionSunsetColor1;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Color = ExtinctionSunsetColor2;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Color = ExtinctionSunsetColor1;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Color = ExtinctionSunsetColor2;
			} else {
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Transparency = new NumberSequence(1);
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Transparency = new NumberSequence(1);
			}

			if (this.horizonElevationSunsetDifference >= -14 && this.horizonElevationSunsetDifference < 0) {
				this.showTerminator = -this.horizonElevationSunsetDifference / 14;
				this.earthTexture.Texture = this.settings.planetTextureNight;
				this.mesh.TextureId = "http://www.roblox.com/asset/?ID=2013298";
			} else if (this.horizonElevationSunsetDifference < -14) {
				this.showTerminator = 1;
				this.earthTexture.Texture = this.settings.planetTextureNight;
			} else if (this.horizonElevationSunsetDifference >= 0) {
				this.showTerminator = 0;
				this.earthTexture.Texture = this.settings.planetTexture;
			}

			if (SunElevation < 0 && SunElevation >= -17.5) {
				this.mesh.TextureId = "http://www.roblox.com/asset/?ID=2013298";
			} else if (SunElevation < -17.5 || SunElevation >= 0) {
				this.mesh.TextureId = "";
			}

			/*
				This changes the atmosphere's decay with altitude. By default, it's calibrated for Earth's atmosphere IN REAL LIFE!
				
				DO NOT CHANGE ANYTHING HERE UNLESS YOU KNOW WHAT YOU'RE DOING! 
				If you wanna change something, just go to the customize folder under this script.
				If you know what you're doing, make sure you have a graphing calculator and plot key points to get functions like the ones below.
				
				This works by having the actual part follow the player's camera. The functions are specific for the Y direction
				since ROBLOX's draw distance is limited to 100,000 studs, we had to make the actual part increase in altitude at a slightly 
				slower rate than the player itself so that the NET velocity is slower than the player's velocity in the Y direction.
			*/

			if (x > 100000 && x < 5246873.871) {
				this.fogEndRatio = 4377.1 / (x + 180020.1514) ** 0.810723 + 0.83211;
				const r = 208974;
				const u = -62832.1;
				const l = -1.3935e10;
				const o = -109932;
				const w = -167.036;
				const p = -0.109192;
				const m = -24.6005;
				const n = 9554.31;
				this.atmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (x - 36799.1218621)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.distantSurface.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (x - 54996.930114)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.surfaceMesh.Scale = new Vector3(700, 1000, 700);
				Lighting.FogStart =
					(15 / (0.0000984275 + 0.38) ** (x ** 0.193962 + 0.00154112) - 69535.15141) * AtmoHeight;
				this.mesh.Scale = new Vector3(
					r / (w * (x - u) ** p) + l / (m * (x - o)) + n,
					3000,
					r / (w * (x - u) ** p) + l / (m * (x - o)) + n,
				);
			} else if (x <= 100000 && x > 10000) {
				this.fogEndRatio = 1;
				const d = 25400;
				const b = -60715;
				const c = 30500;
				const f = -43630;
				const a7 = 1.31047990554;
				const b7 = 3.9710993937e-26;
				const c7 = 5.85019468322;
				const d7 = 0.701839373626;
				const f7 = -2.9477486752e-11;
				const g7 = 3.05504012873;
				const h7 = -2607.06952132;
				const i7 = 0.168115525945;
				const j7 = 43.9601841689;
				this.atmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor -
						(x - (((x + d) * (x + b)) / (x + c) - f - 18178.846)) -
						this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.distantSurface.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor -
						(x - (a7 * x + (b7 * x) ** c7 + (j7 * x) ** d7 + (f7 * x) ** g7 + (h7 * x) ** i7 - 161500)) -
						this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.surfaceMesh.Scale = new Vector3(700, 25 * (x / 10000 - 10) ** 2 + 1000, 700);
				Lighting.FogStart = 0;
				const a6 = 2.7154155381e19;
				const b6 = -5.1373398109e19;
				const c6 = 9.1620578497e9;
				const d6 = 9.1430590143e9;
				const f6 = 2.421957201e19;
				const g6 = 9.1219469736e9;
				this.mesh.Scale = new Vector3(
					a6 / ((x - 50000) ** 2 + c6) + b6 / ((x - 50000) ** 2 + d6) + f6 / ((x - 50000) ** 2 + g6),
					3000,
					a6 / ((x - 50000) ** 2 + c6) + b6 / ((x - 50000) ** 2 + d6) + f6 / ((x - 50000) ** 2 + g6),
				);
			} else if (x <= 10000 && x > 0) {
				this.fogEndRatio = 1;
				const d = 25400;
				const b = -60715;
				const c = 30500;
				const f = -43630;
				const a7 = 1.31047990554;
				const b7 = 3.9710993937e-26;
				const c7 = 5.85019468322;
				const d7 = 0.701839373626;
				const f7 = -2.9477486752e-11;
				const g7 = 3.05504012873;
				const h7 = -2607.06952132;
				const i7 = 0.168115525945;
				const j7 = 43.9601841689;
				this.atmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor -
						(x - (((x + d) * (x + b)) / (x + c) - f - 18178.846)) -
						this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.distantSurface.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (2.95 * x - 162000)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.surfaceMesh.Scale = new Vector3(700, 25 * (x / 10000 - 10) ** 2 + 1000, 700);
				Lighting.FogStart = 0;
				const a6 = 2.7154155381e19;
				const b6 = -5.1373398109e19;
				const c6 = 9.1620578497e9;
				const d6 = 9.1430590143e9;
				const f6 = 2.421957201e19;
				const g6 = 9.1219469736e9;
				this.mesh.Scale = new Vector3(
					a6 / ((x - 50000) ** 2 + c6) + b6 / ((x - 50000) ** 2 + d6) + f6 / ((x - 50000) ** 2 + g6),
					3000 + (60 / 10000) * (x - 10000),
					a6 / ((x - 50000) ** 2 + c6) + b6 / ((x - 50000) ** 2 + d6) + f6 / ((x - 50000) ** 2 + g6),
				);
			} else if (x <= 0) {
				this.fogEndRatio = 1;
				const d = 25400;
				const b = -60715;
				const c = 30500;
				const f = -43630;
				this.atmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (-25111.502 + x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.distantSurface.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (-162000 + x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.surfaceMesh.Scale = new Vector3(700, 3500, 700);
				Lighting.FogStart = 0;
				this.mesh.Scale = new Vector3(7600, 2940, 7600);
			} else if (x >= 5246873.871 && x < 21588000) {
				const a4 = -98579869.16641106069088;
				const b4 = 0.999855267221903034941;
				const c4 = 1.17384438375563399982;
				const d4 = -57563664.78762125104666;
				const f4 = -0.196011457493862806416;
				const g4 = 3642.75971943516306506;
				const h4 = -3.95985950072681194396;
				const i4 = 145010709.56709843635559;
				const j4 = 0.999901664356939897242;
				const k4 = -46430900.38206506252289;
				const l4 = 5197398.215953723676503;
				this.fogEndRatio =
					((a4 * x) ** b4 + (b4 * x) ** c4 + (d4 * x) ** f4 + (g4 * x) ** h4 + (i4 * x) ** j4 + k4 * x + l4) /
					100000;
				const a2 = -2.8575150114e13;
				const b2 = -56.5968339427;
				const c2 = -20830785.2368;
				const d2 = 1.11194612973;
				const f2 = 11.9620104512;
				this.atmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (x - 36799.1218621)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.distantSurface.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (x - 54996.930114)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.surfaceMesh.Scale = new Vector3(700, 1000, 700);
				const a5 = -0.1351049236213618273176;
				const b5 = 1.198848625660491833764;
				const c5 = 1196240.55139738689177;
				const d5 = -0.1855817589433473224192;
				const f5 = 0.1360663106851749438068;
				const g5 = 1.1984539473086930711;
				Lighting.FogStart = ((a5 * x) ** b5 + (c5 * x) ** d5 + (f5 * x) ** g5) * AtmoHeight;
				this.mesh.Scale = new Vector3(a2 / (b2 * (x - c2) ** d2) + f2, 3000, a2 / (b2 * (x - c2) ** d2) + f2);
			} else if (x >= 5246873.871) {
				const a4 = -98579869.16641106069088;
				const b4 = 0.999855267221903034941;
				const c4 = 1.17384438375563399982;
				const d4 = -57563664.78762125104666;
				const f4 = -0.196011457493862806416;
				const g4 = 3642.75971943516306506;
				const h4 = -3.95985950072681194396;
				const i4 = 145010709.56709843635559;
				const j4 = 0.999901664356939897242;
				const k4 = -46430900.38206506252289;
				const l4 = 5197398.215953723676503;
				this.fogEndRatio =
					((a4 * x) ** b4 + (b4 * x) ** c4 + (d4 * x) ** f4 + (g4 * x) ** h4 + (i4 * x) ** j4 + k4 * x + l4) /
					100000;
				const a2 = -2.8575150114e13;
				const b2 = -56.5968339427;
				const c2 = -20830785.2368;
				const d2 = 1.11194612973;
				const f2 = 11.9620104512;
				this.atmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (x - 36799.1218621)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.distantSurface.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (x - 54996.930114)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.surfaceMesh.Scale = new Vector3(700, 1000, 700);
				Lighting.FogStart = 87751.051 * AtmoHeight;
				this.mesh.Scale = new Vector3(a2 / (b2 * (x - c2) ** d2) + f2, 3000, a2 / (b2 * (x - c2) ** d2) + f2);
			}

			// To make objects still visible when you look up while you're in space:

			if (x <= 110000) {
				this.atmosphereApparentHeight = 5.5;
			} else {
				this.atmosphereApparentHeight = 340334.643262 * x ** -0.948472308886;
			}

			if (
				x > 110000 &&
				LookAngleHorizonDifference - this.atmosphereApparentHeight >= this.camera.FieldOfView / 2 &&
				this.horizonElevationSunsetDifference >= 0
			) {
				this.mesh.MeshId = "";
				this.surfaceMesh.MeshId = "";
			} else {
				this.mesh.MeshId = "rbxassetid://5077225120";
				this.surfaceMesh.MeshId = "rbxassetid://452341386";
			}

			// Earth Surface

			if (x > 100000 && x <= 1000000) {
				this.earthPositionEquation =
					x / ScaleFactor -
					(x -
						(x -
							100000 +
							7306.78 * x ** 0.872004 +
							-266624 * x ** -0.0237557 +
							-7309.42 * x ** 0.87197956847));
				this.earthMeshEquation =
					((-25.3972387974 * x) ** 1.05354335619 + (25.4369609378 * x) ** 1.05342854607 + 101237.056899) /
					8.13653899048;
				this.earthTexture.Transparency =
					(1 - this.earthTransparency) / (1 + 1.0001 ** (x - 150000)) + this.earthTransparency;
				this.earthTerminatorTexture.Transparency = 1 / (1 + 1.00002 ** (x - 500000)) + this.showTerminator;
				this.earth.Transparency = 1 / (1 + 1.0001 ** (x - 150000)) + EarthTransparencyAltitudeMultiplier;
			} else if (x > 1000000 && x <= 3500000) {
				this.earthPositionEquation =
					x / ScaleFactor -
					(x -
						(2.0240445172e13 / (x ** -1.61220817515 - 0.410381984491) +
							-2.9626966906e11 / (x + 55704.2710045) +
							4.9320988669e13 +
							(x - 100000) -
							836.387));
				this.earthMeshEquation = 100000000000 / x / 8.13653899048;
				this.earthTexture.Transparency = this.earthTransparency;
				this.earthTerminatorTexture.Transparency = 0 + this.showTerminator;
				this.earth.Transparency = 0;
			} else if (x > 3500000 && x <= 5246873.871) {
				this.earthPositionEquation = x / ScaleFactor - (x - (1.00123264194 * x - 106467.5166));
				this.earthMeshEquation =
					(7.8380064061e17 * (x + 222825889.501) ** -1.50563875544 - 177960.408667) / 8.13653899048;
				this.earthTexture.Transparency = this.earthTransparency;
				this.earthTerminatorTexture.Transparency = 0 + this.showTerminator;
				this.earth.Transparency = 0;
			} else if (x > 5246873.871 && x <= 67263000) {
				const a3 = 4709.38474994;
				const b3 = 1.013817207034910740965;
				const c3 = -204535111.700393855572;
				const d3 = 0.3568792446560499938392;
				const f3 = -218410.864076;
				const m3 = 1.036589479214418688465;
				const n3 = 1002557179.90194106102;
				const o3 = 0.3045239696673475114881;
				const p3 = -1283983614.101778745651;
				const q3 = 0.2525169854454897197899;
				const r3 = 214169.771949;
				const s3 = 1.036884246162165828041;
				const t3 = -5.0691452176e10;
				const u3 = -0.3658668418098382413327;
				const A3 = -3431253.77136;
				const B3 = 0.9999996527455057070014;
				const C3 = 0.6366179904251653126221;
				const D3 = -4568303.25078;
				const E3 = 0.9999992677251237902809;
				const F3 = -1.205493651548074211279;
				const G3 = 3229298347.720854282379;
				this.earthPositionEquation = x / ScaleFactor - (x - (x - 100000));
				this.earthMeshEquation =
					((a3 * x) ** b3 +
						(c3 * x) ** d3 +
						(f3 * x) ** m3 +
						(n3 * x) ** o3 +
						(p3 * x) ** q3 +
						(r3 * x) ** s3 +
						(t3 * x) ** u3 +
						(A3 * B3) ** (x - C3) +
						(D3 * E3) ** (x - F3) +
						G3) /
					8.13653899048;
				this.earthTexture.Transparency = this.earthTransparency;
				this.earthTerminatorTexture.Transparency = 0 + this.showTerminator;
				this.earth.Transparency = 0;
			} else if (x > 67263000) {
				const g3 = 8.5549040903e11;
				const h3 = -0.487707702858;
				const i3 = -8.5504558849e11;
				const j3 = -0.487681650235;
				const k3 = 1321.30366835;
				this.earthPositionEquation = x / ScaleFactor - (x - (x - 100000));
				this.earthMeshEquation = ((g3 * x) ** h3 + (i3 * x) ** j3 + k3) / 8.13653899048;
				this.earthTexture.Transparency = this.earthTransparency;
				this.earthTerminatorTexture.Transparency = 0 + this.showTerminator;
				this.earth.Transparency = 0;
			} else if (x <= 100000 && x > 0) {
				this.earthPositionEquation =
					x / ScaleFactor -
					(x -
						(x -
							100000 +
							7306.78 * x ** 0.872004 +
							-266624 * x ** -0.0237557 +
							-7309.42 * x ** 0.87197956847)) /
						8.13653899048;
				this.earthMeshEquation =
					(-25.3972387974 * x) ** 1.05354335619 + (25.4369609378 * x) ** 1.05342854607 + 101237.056899;
				this.earthTexture.Transparency = 1;
				this.earthTerminatorTexture.Transparency = 1 + this.showTerminator;
				this.earth.Transparency = 1;
			}

			if (this.horizonElevationSunsetDifference <= 0) {
				this.earthTerminatorX = 1.0001;
				this.earthTerminatorY = 1.0001;
			} else if (this.horizonElevationSunsetDifference > 0) {
				this.earthTerminatorX = 1.01;
				this.earthTerminatorY = 1.2;
			}

			this.earth.Position = new Vector3(
				this.camera.CFrame.Position.X,
				this.earthPositionEquation - this.settings.altitudeOffset,
				this.camera.CFrame.Position.Z,
			);
			this.earthTerminator.Position = new Vector3(
				this.camera.CFrame.Position.X,
				this.earthPositionEquation - this.settings.altitudeOffset,
				this.camera.CFrame.Position.Z,
			);
			this.earthTerminator2.Position = this.earthTerminator.Position;
			this.earthMesh.Scale = new Vector3(this.earthMeshEquation, this.earthMeshEquation, this.earthMeshEquation);
			this.earthMesh.VertexColor = new Vector3(
				Lighting.FogColor.R * 2,
				Lighting.FogColor.G * 2,
				Lighting.FogColor.B * 2,
			);
			this.earthTerminatorMesh.Scale = new Vector3(
				this.earthMeshEquation * this.earthTerminatorX,
				this.earthMeshEquation * this.earthTerminatorY,
				this.earthMeshEquation * this.earthTerminatorX,
			);
			this.earthTerminatorMesh2.Scale = this.earthTerminatorMesh.Scale;
			this.earthTerminatorTexture2.Transparency = this.earthTerminatorTexture.Transparency;
			this.earthTerminator.CFrame = new CFrame(this.earthTerminator.Position)
				.mul(
					CFrame.fromMatrix(
						new Vector3(),
						this.earthTerminator.CFrame.LookVector,
						Lighting.GetSunDirection(),
					),
				)
				.mul(CFrame.Angles(0, 1.5 * math.pi, 0));
			this.earthTerminator2.CFrame = new CFrame(this.earthTerminator2.Position)
				.mul(
					CFrame.fromMatrix(
						new Vector3(),
						this.earthTerminator2.CFrame.LookVector,
						Lighting.GetSunDirection().mul(-1),
					),
				)
				.mul(CFrame.Angles(0, 1.5 * math.pi, 0));

			// Ionospheric airglow:
			const AirglowColorR = this.settings.airglowColor.R;
			const AirglowColorG = this.settings.airglowColor.G;
			const AirglowColorB = this.settings.airglowColor.B;
			this.AirglowMesh.VertexColor = new Vector3(AirglowColorR, AirglowColorG, AirglowColorB);
			if (this.settings.enableAirglow) {
				this.AirglowLayer.Position = new Vector3(
					this.camera.CFrame.Position.X,
					this.earthPositionEquation - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.AirglowMesh.Scale = new Vector3(
					this.earthMeshEquation * 1.014 * 8.13653899048,
					this.earthMeshEquation * 1.014 * 8.13653899048,
					this.earthMeshEquation * 1.014 * 8.13653899048,
				);
				this.airglowTransparency = 0;
			} else {
				this.AirglowLayer.Position = new Vector3(0, 0, 0);
				this.AirglowMesh.Scale = new Vector3(0, 0, 0);
				this.airglowTransparency = 1;
			}

			// Moon Settings:

			this.sky.MoonAngularSize = 0.57 * (this.settings.moonApparentDiameter / 31.6);
			if (this.settings.enableMoon === false) {
				this.sky.MoonTextureId = "";
			} else {
				this.sky.MoonTextureId = this.settings.moonTexture;
			}

			// Atmospheric Extinction:

			if (x > 0 && x < 21882.1504) {
				const a9 = 2006.90567819;
				const b9 = 1.21405239737;
				const c9 = -2007.17985974;
				const d9 = 1.21403977579;
				const f9 = 3500.97360274;
				const ExtinctionPosition = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - ((a9 * x) ** b9 + (c9 * x) ** d9 + f9 + x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinction.AtmosphericExtinction1.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam8.Enabled = true;
				//+(-0.0498367812967*x+1515)
				const SSa = 8229.544885035839548218;
				const SSb = 1.925649423786986196024;
				const SSc = 4351.473081335900484363;
				const SSd = 1.91834873220339419038;
				const SSe = -7493.591639846589775593;
				const SSf = 1.925973151276423534168;
				const SSg = -5087.402639489375134849;
				const SSh = 1.918929359930211610991;
				const SSi = 1399.623669562920662458;
				const ExtinctionSunsetEquation =
					(SSa * x) ** SSb + (SSc * x) ** SSd + (SSe * x) ** SSf + (SSg * x) ** SSh + SSi;
				const ExtinctionPositionSunset = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - ExtinctionSunsetEquation) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinctionSunset.AtmosphericExtinction1.Position = ExtinctionPositionSunset;
				this.extinctionSunset.AtmosphericExtinction2.Position = ExtinctionPositionSunset;
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Enabled = true;
				this.extinctionWidthEquation = -((40000 * x) / 21882.1504) + 80000;
				this.extinctionOrientationEquation = (2 * x) / 21882.1504 + 79;
			} else if (x >= 21882.1504 && x < 100000) {
				const a8 = 6.2712061263e-21;
				const b8 = 4.76359763589;
				const c8 = 644.975565777;
				const d8 = 0.322499727907;
				const f8 = -87.7371373004;
				const g8 = 0.56698113042;
				const h8 = 0.00149802609093;
				const i8 = 1.54285932958;
				const j8 = -0.00000452047107416;
				const k8 = 2.0219644294;
				const l8 = 4000.17081685;
				const ExtinctionPosition = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor -
						(x -
							((a8 * x) ** b8 +
								(c8 * x) ** d8 +
								(f8 * x) ** g8 +
								(h8 * x) ** i8 +
								(j8 * x) ** k8 +
								l8 +
								x)) -
						this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinction.AtmosphericExtinction1.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam8.Enabled = true;

				const SSa = 15000;
				const SSb = 1.00000103302;
				const SSc = -14999.2215578;
				const ExtinctionSunsetEquation = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - ((SSa * x) ** SSb + SSc * x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinctionSunset.AtmosphericExtinction1.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Enabled = true;
				this.extinctionWidthEquation = 40000;
				this.extinctionOrientationEquation = 81;
			} else if (x >= 100000 && x < 200000) {
				const ExtinctionPosition = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor -
						(x - ((-7.0577896884 * x) ** 0.594641088876 + 620.275987688 + x)) -
						this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinction.AtmosphericExtinction1.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam8.Enabled = true;

				const SSa = 15000;
				const SSb = 1.00000103302;
				const SSc = -14999.2215578;
				const ExtinctionSunsetEquation = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - ((SSa * x) ** SSb + SSc * x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinctionSunset.AtmosphericExtinction1.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Enabled = true;
				this.extinctionWidthEquation = 40000;
				this.extinctionOrientationEquation = 81;
			} else if (x < 0) {
				const ExtinctionPosition = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (3500 + x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinction.AtmosphericExtinction1.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinction.AtmosphericExtinction2.Beam8.Enabled = true;

				const ExtinctionSunsetEquation = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - 1399.6236695629) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinctionSunset.AtmosphericExtinction1.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Enabled = true;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Enabled = true;
				this.extinctionWidthEquation = 80000;
				this.extinctionOrientationEquation = 79;
			} else if (x >= 200000) {
				const ExtinctionPosition = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor -
						(x - ((-7.0577896884 * x) ** 0.594641088876 + 620.275987688 + x)) -
						this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinction.AtmosphericExtinction1.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Position = ExtinctionPosition;
				this.extinction.AtmosphericExtinction2.Beam1.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam2.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam3.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam4.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam5.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam6.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam7.Enabled = false;
				this.extinction.AtmosphericExtinction2.Beam8.Enabled = false;

				const SSa = 15000;
				const SSb = 1.00000103302;
				const SSc = -14999.2215578;
				const ExtinctionSunsetEquation = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - ((SSa * x) ** SSb + SSc * x)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.extinctionSunset.AtmosphericExtinction1.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Position = ExtinctionSunsetEquation;
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam3.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam4.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam5.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam6.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam7.Enabled = false;
				this.extinctionSunset.AtmosphericExtinction2.Beam8.Enabled = false;
				this.extinctionWidthEquation = 40000;
				this.extinctionOrientationEquation = 81;
			}
			const sunHDG = -(math.deg(-math.atan2(SunDirectionV.X, SunDirectionV.Z)) - 180) % 360;
			const BeltOfVenusWidth = math.clamp(-0.4 * this.horizonElevationSunsetDifference + 1, 1, 10);
			this.extinction.AtmosphericExtinction2.Beam1.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam2.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam3.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam4.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam1.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam2.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam3.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam4.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam5.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam6.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam7.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam8.Width0 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam5.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam6.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam7.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Beam8.Width1 = this.extinctionWidthEquation;
			this.extinction.AtmosphericExtinction2.Attachment2a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment3a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				0 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction2.Attachment4a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				-90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction2.Attachment1b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment2b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				0 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction2.Attachment3b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				-90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment1a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				180 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment4b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				180 + sunHDG,
				0,
			);

			this.extinction.AtmosphericExtinction2.Attachment6a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment7a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				0 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction2.Attachment8a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				-90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction2.Attachment5b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment6b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				0 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction2.Attachment7b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				-90 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment5a.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				180 + sunHDG,
				0,
			);
			this.extinction.AtmosphericExtinction1.Attachment8b.WorldOrientation = new Vector3(
				this.extinctionOrientationEquation,
				180 + sunHDG,
				0,
			);

			const ExtinctionWidthEquationSunset = this.extinctionWidthEquation / 4;
			const ExtinctionSunsetBeltOfVenus = ExtinctionWidthEquationSunset * BeltOfVenusWidth;
			this.extinctionSunset.AtmosphericExtinction2.Beam1.Width0 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam2.Width0 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam3.Width0 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam4.Width0 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam1.Width1 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam2.Width1 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam3.Width1 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam4.Width1 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam5.Width0 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam6.Width0 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam7.Width0 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam8.Width0 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam5.Width1 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam6.Width1 = ExtinctionWidthEquationSunset;
			this.extinctionSunset.AtmosphericExtinction2.Beam7.Width1 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Beam8.Width1 = ExtinctionSunsetBeltOfVenus;
			this.extinctionSunset.AtmosphericExtinction2.Attachment2a.WorldOrientation = new Vector3(81, 0 + sunHDG, 0);
			this.extinctionSunset.AtmosphericExtinction1.Attachment3a.WorldOrientation = new Vector3(
				81,
				-90 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction2.Attachment4a.WorldOrientation = new Vector3(
				81,
				-180 + sunHDG,
				-0,
			);
			this.extinctionSunset.AtmosphericExtinction2.Attachment1b.WorldOrientation = new Vector3(81, 0 + sunHDG, 0);
			this.extinctionSunset.AtmosphericExtinction1.Attachment2b.WorldOrientation = new Vector3(
				81,
				-90 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction2.Attachment3b.WorldOrientation = new Vector3(
				81,
				180 + sunHDG,
				-0,
			);
			this.extinctionSunset.AtmosphericExtinction1.Attachment1a.WorldOrientation = new Vector3(
				81,
				90 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction1.Attachment4b.WorldOrientation = new Vector3(
				81,
				90 + sunHDG,
				0,
			);

			this.extinctionSunset.AtmosphericExtinction2.Attachment6a.WorldOrientation = new Vector3(
				81,
				-0 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction1.Attachment7a.WorldOrientation = new Vector3(
				81,
				-90 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction2.Attachment8a.WorldOrientation = new Vector3(
				81,
				-180 + sunHDG,
				-0,
			);
			this.extinctionSunset.AtmosphericExtinction2.Attachment5b.WorldOrientation = new Vector3(81, 0 + sunHDG, 0);
			this.extinctionSunset.AtmosphericExtinction1.Attachment6b.WorldOrientation = new Vector3(
				81,
				-90 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction2.Attachment7b.WorldOrientation = new Vector3(
				81,
				180 + sunHDG,
				-0,
			);
			this.extinctionSunset.AtmosphericExtinction1.Attachment5a.WorldOrientation = new Vector3(
				81,
				90 + sunHDG,
				0,
			);
			this.extinctionSunset.AtmosphericExtinction1.Attachment8b.WorldOrientation = new Vector3(
				81,
				90 + sunHDG,
				0,
			);

			this.extinction.AtmosphericExtinction1.Orientation = new Vector3(0, sunHDG - 90, 0);
			this.extinction.AtmosphericExtinction2.Orientation = new Vector3(0, sunHDG + 180, 0);
			this.extinctionSunset.AtmosphericExtinction1.Orientation = new Vector3(0, sunHDG - 180, 0);
			this.extinctionSunset.AtmosphericExtinction2.Orientation = new Vector3(0, sunHDG + 90, 0);

			this.extinctionSunset.AtmosphericExtinction2.Beam9.Width0 =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Width0;
			this.extinctionSunset.AtmosphericExtinction2.Beam9.Width1 =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Width1;
			this.extinctionSunset.AtmosphericExtinction2.Beam9.Brightness =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Brightness;
			this.extinctionSunset.AtmosphericExtinction2.Beam9.Color =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Color;
			this.extinctionSunset.AtmosphericExtinction2.Beam9.Transparency =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Transparency;
			this.extinctionSunset.AtmosphericExtinction2.Beam9.LightEmission =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.LightEmission;
			this.extinctionSunset.AtmosphericExtinction2.Beam9.Enabled =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled;

			this.extinctionSunset.AtmosphericExtinction2.Beam10.Width0 =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Width0;
			this.extinctionSunset.AtmosphericExtinction2.Beam10.Width1 =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Width1;
			this.extinctionSunset.AtmosphericExtinction2.Beam10.Brightness =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Brightness;
			this.extinctionSunset.AtmosphericExtinction2.Beam10.Color =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Color;
			this.extinctionSunset.AtmosphericExtinction2.Beam10.Transparency =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Transparency;
			this.extinctionSunset.AtmosphericExtinction2.Beam10.LightEmission =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.LightEmission;
			this.extinctionSunset.AtmosphericExtinction2.Beam10.Enabled =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled;

			this.extinctionSunset.AtmosphericExtinction2.Beam11.Width0 =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Width0;
			this.extinctionSunset.AtmosphericExtinction2.Beam11.Width1 =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Width1;
			this.extinctionSunset.AtmosphericExtinction2.Beam11.Brightness =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Brightness;
			this.extinctionSunset.AtmosphericExtinction2.Beam11.Color =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Color;
			this.extinctionSunset.AtmosphericExtinction2.Beam11.Transparency =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Transparency;
			this.extinctionSunset.AtmosphericExtinction2.Beam11.LightEmission =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.LightEmission;
			this.extinctionSunset.AtmosphericExtinction2.Beam11.Enabled =
				this.extinctionSunset.AtmosphericExtinction2.Beam1.Enabled;

			this.extinctionSunset.AtmosphericExtinction2.Beam12.Width0 =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Width0;
			this.extinctionSunset.AtmosphericExtinction2.Beam12.Width1 =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Width1;
			this.extinctionSunset.AtmosphericExtinction2.Beam12.Brightness =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Brightness;
			this.extinctionSunset.AtmosphericExtinction2.Beam12.Color =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Color;
			this.extinctionSunset.AtmosphericExtinction2.Beam12.Transparency =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Transparency;
			this.extinctionSunset.AtmosphericExtinction2.Beam12.LightEmission =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.LightEmission;
			this.extinctionSunset.AtmosphericExtinction2.Beam12.Enabled =
				this.extinctionSunset.AtmosphericExtinction2.Beam2.Enabled;

			if (this.settings.enableGroundAtmosphere) {
				this.BottomAtmosphere.Position = new Vector3(
					this.camera.CFrame.Position.X,
					x / ScaleFactor - (x - (0.975794628099 * x - 9972.10330579)) - this.settings.altitudeOffset,
					this.camera.CFrame.Position.Z,
				);
				this.BottomAtmosphere.Transparency =
					(1 - this.settings.groundAtmosphereTransparency) / (1 + 1.0001 ** -(x - 150000)) +
					(1.01 - this.settings.groundAtmosphereTransparency) / (1 + 1.0005 ** (x - 10000)) +
					this.settings.groundAtmosphereTransparency;
				this.BottomAtmosphereMesh.VertexColor = this.earthMesh.VertexColor;
			} else {
				this.BottomAtmosphere.Position = new Vector3(0, 0, 0);
				this.BottomAtmosphere.Transparency = 1;
				this.BottomAtmosphereMesh.VertexColor = this.earthMesh.VertexColor;
			}

			// Earth Apparent Movement: (FEEL FREE TO TWEAK!)

			const EarthPosition = this.earth.CFrame.Position;
			const EarthOrientation = this.earth.CFrame.sub(EarthPosition);
			const VelocityX =
				((LocalPlayerController.rootPart!.Velocity.X / this.settings.scale) * dt) /
				((2 * math.pi * (20925656.2 + LocalPlayerController.rootPart!.Position.Y * this.settings.scale)) / 360);
			const VelocityZ =
				((LocalPlayerController.rootPart!.Velocity.Z / this.settings.scale) * dt) /
				((2 * math.pi * (20925656.2 + LocalPlayerController.rootPart!.Position.Y * this.settings.scale)) / 360);
			const RotationSpeed = CFrame.Angles(math.rad(-VelocityZ), 0, math.rad(VelocityX));
			const NewEarthRotation = RotationSpeed.mul(EarthOrientation);
			const NewEarthOrientation = NewEarthRotation.add(EarthPosition);

			if (this.settings.enableApparentPlanetRotation) {
				this.earth.CFrame = NewEarthOrientation;
			} else {
				this.earth.CFrame = EarthOrientation;
			}

			// TODO: NO CLOCK
			// if (ClockTimeExists === true && this.settings.enableApparentSunMovement === true) {
			// 	this.initialTime = game.Workspace.ServerClockTime.Value%24
			// }

			// And for the Sun (EXPERIMENTAL)
			if (this.settings.enableApparentSunMovement === true) {
				this.sunOffsetX = this.sunOffsetX + VelocityX * 4;
				this.sunOffsetZ = this.sunOffsetZ + -VelocityZ;
				if (this.settings.equatorialMovementOnly === true) {
					Lighting.SetMinutesAfterMidnight(this.initialTime * 60 + this.sunOffsetX);
				} else {
					Lighting.SetMinutesAfterMidnight(this.initialTime * 60 + this.sunOffsetX);
					Lighting.GeographicLatitude = this.initialGL + this.sunOffsetZ;
				}

				// Assuming this is the size of your spawn location of 20,000 by 20,000 by 1000 studs.
				if (
					LocalPlayerController.rootPart!.Position.X >= -10000 &&
					LocalPlayerController.rootPart!.Position.X < 10000 &&
					LocalPlayerController.rootPart!.Position.Z >= -10000 &&
					LocalPlayerController.rootPart!.Position.Y + this.settings.altitudeOffset < 1000
				) {
					this.sunOffsetX = 0;
					this.sunOffsetZ = 0;
					this.earth.Orientation = this.settings.initialPlanetOrientation;
				}
			}

			// ATMOSPHERE TWILIGHT DARKNESS

			const ATDa = 1.42956638935406912395e-17;
			const ATDb = 3.11869410895;
			const ATDc = 5010.5925368;
			const ATDd = -0.998839715953;

			let ATDTimeCompensation;
			const CT = Lighting.ClockTime;
			if (CT >= 5.9 && CT < 6.2) {
				// Sunrise fade
				ATDTimeCompensation = (CT - 5.9) / 0.3;
			} else if (CT >= 4.8 && CT < 5.1) {
				// Early Morning fade
				ATDTimeCompensation = -(CT - 5.1) / 0.3;
			} else if (CT >= 6.2 && CT < 17.8) {
				// Day
				ATDTimeCompensation = 1;
			} else if (CT >= 17.8 && CT < 18.1) {
				// Sunset fade
				ATDTimeCompensation = -(CT - 18.1) / 0.3;
			} else if (CT >= 18.9 && CT < 19.2) {
				// Evening fade
				ATDTimeCompensation = (CT - 18.9) / 0.3;
			} else if (CT >= 19.2 || CT < 4.8) {
				// Night
				ATDTimeCompensation = 1;
			} else {
				ATDTimeCompensation = 0;
			}

			if (x >= 5060 && x < 250251 && this.settings.enableGroundAtmosphere) {
				this.BottomAtmosphereDarkness.Transparency =
					math.clamp(ATDa * x ** ATDb + ATDc * x ** ATDd, 0, 1) + ATDTimeCompensation;
			} else {
				this.BottomAtmosphereDarkness.Transparency = 1;
			}

			// EARTH'S ATMOSPHERE COLOR (SPECIAL CASE)
			if (this.settings.atmosphereColor === Color3.fromRGB(115, 180, 255)) {
				const groundAtmosphereColorFactor =
					math.clamp(1 - x / ScaleFactor / 32808, 0, 1) *
					(math.clamp(this.horizonElevationSunsetDifference, 0, 10) / 10);
				this.atmosphere.Color = new Color3(
					0,
					(95 / 255) * groundAtmosphereColorFactor,
					(148 / 255) * groundAtmosphereColorFactor,
				);

				const sunsetFade15 = math.clamp(this.horizonElevationSunsetDifference / H15, 0, 1);
				const altitudeFade = 1 - math.clamp((x / ScaleFactor - 100000) / 20000, 0, 1);
				Lighting.FogColor = new Color3(
					Lighting.FogColor.R * (1 + 0.0434782608695652 * sunsetFade15 * altitudeFade),
					Lighting.FogColor.G * (1 + 0.2222222222222222 * sunsetFade15 * altitudeFade),
					Lighting.FogColor.B * (1 + 0.4313725490196079 * sunsetFade15 * altitudeFade),
				);
			} else {
				this.atmosphere.Color = new Color3();
			}
			const atmosphericReflectionColorFactor = math.clamp(this.horizonElevationSunsetDifference / 10, 0, 1);
			Lighting.Ambient = new Color3(
				this.settings.atmosphereReflectionColor.R * atmosphericReflectionColorFactor,
				this.settings.atmosphereReflectionColor.G * atmosphericReflectionColorFactor,
				this.settings.atmosphereReflectionColor.B * atmosphericReflectionColorFactor,
			);
		});
	}
}

Atmosphere.initialize();
