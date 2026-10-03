import { logger } from "./logger";
import { fetchLiveWeather } from "./weather-service";

export interface TelemetryReading {
  parameter: string;
  current: number;
  baseline: number;
  unit: string;
  change: number;
  trend: "increasing" | "decreasing" | "stable";
  status: "normal" | "abnormal" | "unavailable" | "estimated" | "simulated";
  history: { label: string; value: number }[];
  source: string;
  simulated: boolean;
}

export interface EnvironmentalDataSource {
  readonly name: string;
  fetchSiteMetrics(
    siteId: string,
    latitude: number,
    longitude: number,
    isCritical?: boolean
  ): Promise<TelemetryReading[]>;
}

/**
 * Fallback Simulated Data Source
 * Produces deterministic baseline and stressed profiles for demonstrator waterways.
 */
export class SimulatedDataSource implements EnvironmentalDataSource {
  readonly name = "Simulated Environmental Sensor Engine";

  async fetchSiteMetrics(
    _siteId: string,
    _latitude: number,
    _longitude: number,
    isCritical = false
  ): Promise<TelemetryReading[]> {
    return [
      {
        parameter: "Turbidity",
        current: isCritical ? 48 : 34,
        baseline: 37,
        unit: "NTU",
        change: isCritical ? 29.7 : -8.1,
        trend: isCritical ? "increasing" : "stable",
        status: isCritical ? "abnormal" : "simulated",
        history: isCritical
          ? [
              { label: "08:00", value: 35 },
              { label: "10:00", value: 38 },
              { label: "12:00", value: 43 },
              { label: "14:00", value: 48 },
            ]
          : [
              { label: "08:00", value: 35 },
              { label: "10:00", value: 34 },
              { label: "12:00", value: 33 },
              { label: "14:00", value: 34 },
            ],
        source: "Demo sensor network",
        simulated: true,
      },
      {
        parameter: "Dissolved oxygen",
        current: isCritical ? 5.7 : 7.4,
        baseline: 7.1,
        unit: "mg/L",
        change: isCritical ? -19.7 : 4.2,
        trend: isCritical ? "decreasing" : "stable",
        status: isCritical ? "abnormal" : "simulated",
        history: [
          { label: "08:00", value: isCritical ? 7.1 : 7.3 },
          { label: "10:00", value: isCritical ? 6.8 : 7.4 },
          { label: "12:00", value: isCritical ? 6.2 : 7.4 },
          { label: "14:00", value: isCritical ? 5.7 : 7.4 },
        ],
        source: "Demo sensor network",
        simulated: true,
      },
      {
        parameter: "Temperature",
        current: isCritical ? 28.6 : 27.2,
        baseline: 26.9,
        unit: "°C",
        change: isCritical ? 6.3 : 1.1,
        trend: "increasing",
        status: "simulated",
        history: [
          { label: "08:00", value: 26.2 },
          { label: "10:00", value: 27.0 },
          { label: "12:00", value: 27.5 },
          { label: "14:00", value: isCritical ? 28.6 : 27.2 },
        ],
        source: "Demo sensor network",
        simulated: true,
      },
      {
        parameter: "Rainfall",
        current: isCritical ? 42 : 8,
        baseline: 12,
        unit: "mm / 24h",
        change: isCritical ? 250 : -33,
        trend: isCritical ? "increasing" : "stable",
        status: "simulated",
        history: [
          { label: "08:00", value: 4 },
          { label: "10:00", value: 18 },
          { label: "12:00", value: 32 },
          { label: "14:00", value: isCritical ? 42 : 8 },
        ],
        source: "Demo weather context",
        simulated: true,
      },
    ];
  }
}

/**
 * USGS Water Services Live Ingestion Source
 * Directly interfaces the USGS NWIS Instantaneous Values REST API for river gage height,
 * discharge, and stream turbidity.
 */
export class UsgsWaterServicesDataSource implements EnvironmentalDataSource {
  readonly name = "USGS Water Services NWIS";

  // Mapping demo sites or standard reference stations
  private siteToUsgsStation: Record<string, string> = {
    "SAC-02": "11447650", // Sacramento River at Freeport, CA
    "TOR-01": "01646500", // Reference station
    "USGS-REF": "01646500", // Potomac River near Washington DC
  };

  async fetchSiteMetrics(
    siteId: string,
    latitude: number,
    longitude: number,
    _isCritical = false
  ): Promise<TelemetryReading[]> {
    const stationId = this.siteToUsgsStation[siteId];
    if (!stationId) {
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${stationId}&parameterCd=00060,00065,00010`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        logger.warn({ stationId, status: res.status }, "USGS NWIS returned non-200");
        return [];
      }
      const data = (await res.json()) as any;
      const timeSeries = data?.value?.timeSeries || [];
      const readings: TelemetryReading[] = [];

      for (const series of timeSeries) {
        const variableName = series?.variable?.variableName || "";
        const unit = series?.variable?.unit?.unitCode || "";
        const values = series?.values?.[0]?.value || [];
        if (!values.length) continue;

        const latest = values[values.length - 1];
        const val = parseFloat(latest.value);
        if (Number.isNaN(val) || val === -999999) continue;

        const isStreamFlow = variableName.toLowerCase().includes("streamflow") || variableName.toLowerCase().includes("discharge");
        const isGageHeight = variableName.toLowerCase().includes("gage height");
        const isTemp = variableName.toLowerCase().includes("temperature");

        const paramName = isStreamFlow
          ? "Streamflow / Discharge"
          : isGageHeight
          ? "Gage Height"
          : isTemp
          ? "Water Temperature"
          : variableName;

        const baseline = isStreamFlow ? val * 0.95 : val * 0.98;
        const change = parseFloat((((val - baseline) / (baseline || 1)) * 100).toFixed(1));

        readings.push({
          parameter: paramName,
          current: parseFloat(val.toFixed(2)),
          baseline: parseFloat(baseline.toFixed(2)),
          unit,
          change,
          trend: change > 3 ? "increasing" : change < -3 ? "decreasing" : "stable",
          status: "normal",
          history: values.slice(-4).map((v: any) => ({
            label: new Date(v.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            value: parseFloat(parseFloat(v.value).toFixed(2)),
          })),
          source: `USGS NWIS Station ${stationId}`,
          simulated: false,
        });
      }

      return readings;
    } catch (err: any) {
      logger.warn({ err: err?.message, stationId }, "USGS fetch failed; using fallback");
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Composite Environmental Data Source
 * Fuses Open-Meteo live meteorological telemetry and USGS hydrological telemetry with
 * simulated sensor baselines, clearly marking each parameter's live vs simulated provenance.
 */
export class CompositeEnvironmentalDataSource implements EnvironmentalDataSource {
  readonly name = "AquaSentinel Composite Environmental Ingestion Engine";

  private simulatedSource = new SimulatedDataSource();
  private usgsSource = new UsgsWaterServicesDataSource();

  async fetchSiteMetrics(
    siteId: string,
    latitude: number,
    longitude: number,
    isCritical = false
  ): Promise<TelemetryReading[]> {
    // 1. Fetch fallback baseline metrics
    const baselineMetrics = await this.simulatedSource.fetchSiteMetrics(
      siteId,
      latitude,
      longitude,
      isCritical
    );

    // 2. Fetch live weather from Open-Meteo
    let liveWeather = null;
    try {
      liveWeather = await fetchLiveWeather(latitude, longitude, 3000);
    } catch (err) {
      logger.warn({ siteId, err }, "Open-Meteo live feed retrieval error");
    }

    // 3. Fetch live USGS metrics if applicable
    let usgsReadings: TelemetryReading[] = [];
    try {
      usgsReadings = await this.usgsSource.fetchSiteMetrics(siteId, latitude, longitude, isCritical);
    } catch (err) {
      logger.warn({ siteId, err }, "USGS live feed retrieval error");
    }

    // 4. Merge live weather into rainfall/temperature parameters
    const merged = baselineMetrics.map((metric) => {
      if (liveWeather && !liveWeather.simulated) {
        if (metric.parameter.toLowerCase().includes("rainfall")) {
          const livePrecip = liveWeather.precipitation ?? liveWeather.rain ?? metric.current;
          const baselineRain = 12;
          const rainChange = parseFloat((((livePrecip - baselineRain) / baselineRain) * 100).toFixed(1));
          return {
            ...metric,
            current: livePrecip,
            change: rainChange,
            trend: (livePrecip > baselineRain ? "increasing" : "stable") as "increasing" | "stable",
            source: liveWeather.source,
            simulated: false,
            status: (livePrecip > 30 ? "abnormal" : "normal") as "abnormal" | "normal",
          };
        }

        if (metric.parameter.toLowerCase().includes("temperature") && liveWeather.temperature != null) {
          const liveTemp = liveWeather.temperature;
          const baselineTemp = 27.0;
          const tempChange = parseFloat((((liveTemp - baselineTemp) / baselineTemp) * 100).toFixed(1));
          return {
            ...metric,
            current: liveTemp,
            change: tempChange,
            source: liveWeather.source,
            simulated: false,
            status: "normal" as const,
          };
        }
      }
      return metric;
    });

    // 5. Append any real USGS hydrologic parameters
    if (usgsReadings.length > 0) {
      return [...merged, ...usgsReadings];
    }

    return merged;
  }
}

export const defaultEnvironmentalDataSource: EnvironmentalDataSource = new CompositeEnvironmentalDataSource();
