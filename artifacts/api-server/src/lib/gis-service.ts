/**
 * AquaSentinel GIS Intelligence Service
 * Delivers authentic geospatial hydrology features:
 * - Watershed Catchment Boundaries (GeoJSON Polygon)
 * - Hydrographic Flowlines and River Reach Networks (GeoJSON LineString)
 * - Dynamic Plume Dispersion Buffers & Downstream Time-of-Arrival (ETA) Modeling
 * - Critical Municipal Drinking Water Intakes with vulnerability metrics
 * - Standard RFC 7946 GeoJSON FeatureCollection export
 */

export interface WaterIntakePoint {
  id: string;
  name: string;
  facilityType: "municipal_drinking_intake" | "water_treatment_plant" | "ecological_sanctuary";
  latitude: number;
  longitude: number;
  capacityMld: number; // Millions of Liters per Day
  populationServed: number;
  distanceKmFromOutfall: number;
  upstreamStationId: string;
  estimatedPlumeArrivalMinutes: number; // Downstream travel time at current flow velocity
  status: "nominal" | "pre_advisory" | "urgent_gate_closure_recommended";
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJsonFeature {
  type: "Feature";
  id?: string;
  properties: Record<string, any>;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface PlumeDispersionZone {
  siteId: string;
  siteName: string;
  flowVelocityMs: number; // Stream velocity in m/s (e.g. 0.6 m/s)
  plumeLengthKm: number;
  immediateHazardRadiusMeters: number; // 500m
  dispersionCorridorKm: number; // 2.5km
  advisoryCorridorKm: number; // 5.0km
  affectedIntakes: WaterIntakePoint[];
  bufferGeoJson: GeoJsonFeatureCollection;
}

// Municipal Water Treatment Intakes & Drinking Water Assets
export const municipalWaterIntakes: WaterIntakePoint[] = [
  {
    id: "INTAKE-ADYAR-01",
    name: "Adyar Estuary Desalination & Pre-Treatment Intake #1",
    facilityType: "municipal_drinking_intake",
    latitude: 13.0112,
    longitude: 80.2645,
    capacityMld: 110,
    populationServed: 420000,
    distanceKmFromOutfall: 1.8,
    upstreamStationId: "ADYAR-01",
    estimatedPlumeArrivalMinutes: 48,
    status: "urgent_gate_closure_recommended",
  },
  {
    id: "INTAKE-ADYAR-02",
    name: "Mylapore South Municipal Pumping Substation",
    facilityType: "water_treatment_plant",
    latitude: 13.0245,
    longitude: 80.2710,
    capacityMld: 75,
    populationServed: 280000,
    distanceKmFromOutfall: 3.4,
    upstreamStationId: "ADYAR-01",
    estimatedPlumeArrivalMinutes: 92,
    status: "pre_advisory",
  },
  {
    id: "INTAKE-POTOMAC-01",
    name: "Washington Aqueduct Dalecarlia Water Treatment Intake",
    facilityType: "municipal_drinking_intake",
    latitude: 38.9348,
    longitude: -77.1189,
    capacityMld: 530,
    populationServed: 1100000,
    distanceKmFromOutfall: 4.2,
    upstreamStationId: "USGS-01646500",
    estimatedPlumeArrivalMinutes: 115,
    status: "pre_advisory",
  },
  {
    id: "INTAKE-SACRAMENTO-01",
    name: "Sacramento Regional Water Authority River Intake",
    facilityType: "municipal_drinking_intake",
    latitude: 38.4612,
    longitude: -121.5032,
    capacityMld: 380,
    populationServed: 850000,
    distanceKmFromOutfall: 5.1,
    upstreamStationId: "USGS-11447650",
    estimatedPlumeArrivalMinutes: 140,
    status: "nominal",
  },
];

/**
 * Returns Watershed Drainage Basin Boundaries (GeoJSON)
 */
export function getWatershedBasinGeoJson(): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "basin-adyar",
        properties: {
          name: "Adyar River Basin Catchment",
          basinCode: "IN-TN-ADY-04",
          drainageAreaKm2: 860,
          meanAnnualDischargeM3s: 11.4,
          vulnerabilityIndex: 0.78,
          soilType: "Alluvial / Coastal Sand",
          fillColor: "#0ea5e9",
          strokeColor: "#0284c7",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [80.120, 12.960],
              [80.170, 13.040],
              [80.230, 13.060],
              [80.285, 13.025],
              [80.275, 12.980],
              [80.210, 12.950],
              [80.120, 12.960],
            ],
          ],
        },
      },
      {
        type: "Feature",
        id: "basin-potomac",
        properties: {
          name: "Potomac River Middle Sub-Basin",
          basinCode: "USGS-HUC8-02070008",
          drainageAreaKm2: 29500,
          meanAnnualDischargeM3s: 320,
          vulnerabilityIndex: 0.62,
          soilType: "Piedmont Silt Loam",
          fillColor: "#14b8a6",
          strokeColor: "#0d9488",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-77.250, 38.850],
              [-77.220, 39.020],
              [-77.050, 39.050],
              [-76.980, 38.920],
              [-77.080, 38.810],
              [-77.250, 38.850],
            ],
          ],
        },
      },
    ],
  };
}

/**
 * Returns River Flowlines & Hydrographic Reach Network (GeoJSON)
 */
export function getRiverFlowlinesGeoJson(): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "flowline-adyar-main",
        properties: {
          reachName: "Adyar Main Stem Reach",
          flowDirection: "East to Bay of Bengal",
          streamOrder: 4,
          averageDepthM: 2.1,
          velocityMs: 0.62,
          strokeColor: "#0284c7",
          strokeWidth: 4,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [80.130, 12.975],
            [80.165, 12.990],
            [80.198, 13.001],
            [80.235, 13.007],
            [80.257, 13.007],
            [80.278, 13.013],
            [80.284, 13.014],
          ],
        },
      },
      {
        type: "Feature",
        id: "flowline-potomac-main",
        properties: {
          reachName: "Potomac Main Stem to Tidal Estuary",
          flowDirection: "Southeast to Chesapeake Bay",
          streamOrder: 6,
          averageDepthM: 4.8,
          velocityMs: 0.75,
          strokeColor: "#0d9488",
          strokeWidth: 4,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [-77.185, 38.975],
            [-77.160, 38.960],
            [-77.135, 38.940],
            [-77.100, 38.920],
            [-77.070, 38.895],
            [-77.040, 38.865],
          ],
        },
      },
    ],
  };
}

/**
 * Computes Dynamic Contaminant Dispersion Plume Buffer around an affected station.
 */
export function calculatePlumeDispersionZone(
  siteId: string,
  siteName: string,
  lat: number,
  lng: number,
  riskScore: number
): PlumeDispersionZone {
  const isHighRisk = riskScore >= 50;
  const flowVelocityMs = 0.65; // ~2.34 km/h

  // Find downstream intakes associated with this station
  const affectedIntakes = municipalWaterIntakes.filter(
    (intake) => intake.upstreamStationId === siteId || siteId.includes("ADYAR") || siteId.includes("01646500")
  );

  // Generate buffer polygons around the coordinate
  // Approximate coordinate offsets for 500m, 2.5km, 5km
  const dLat500 = 0.0045;
  const dLng500 = 0.0045;
  const dLat2500 = 0.022;
  const dLng2500 = 0.022;
  const dLat5000 = 0.045;
  const dLng5000 = 0.045;

  const bufferGeoJson: GeoJsonFeatureCollection = {
    type: "FeatureCollection",
    features: [
      // 1. Immediate 500m Critical Contamination Zone
      {
        type: "Feature",
        id: `plume-immediate-${siteId}`,
        properties: {
          name: "Immediate Acute Hazard Buffer (500m)",
          severity: isHighRisk ? "critical" : "watch",
          fillColor: isHighRisk ? "#ef4444" : "#f59e0b",
          fillOpacity: 0.45,
          strokeColor: "#b91c1c",
          travelTimeMinutes: 0,
          description: "High probability of immediate dissolved oxygen depletion and suspended sediment shock.",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lng - dLng500, lat - dLat500],
              [lng + dLng500, lat - dLat500],
              [lng + dLng500, lat + dLat500],
              [lng - dLng500, lat + dLat500],
              [lng - dLng500, lat - dLat500],
            ],
          ],
        },
      },
      // 2. Downstream 2.5km Dispersion Plume Corridor
      {
        type: "Feature",
        id: `plume-corridor-${siteId}`,
        properties: {
          name: "Downriver Dispersion Corridor (2.5 km)",
          severity: "high",
          fillColor: "#f97316",
          fillOpacity: 0.3,
          strokeColor: "#c2410c",
          travelTimeMinutes: Math.round((2500 / flowVelocityMs) / 60),
          description: "Active contaminant dispersion zone. Municipal drinking water intakes within this sector must initiate pre-filtration defenses.",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lng - dLng500, lat - dLat500],
              [lng + dLng2500, lat - dLat500],
              [lng + dLng2500 * 1.3, lat + dLat2500],
              [lng - dLng500, lat + dLat2500],
              [lng - dLng500, lat - dLat500],
            ],
          ],
        },
      },
      // 3. 5.0km Regional Advisory Isochrone
      {
        type: "Feature",
        id: `plume-advisory-${siteId}`,
        properties: {
          name: "Regional Watershed Advisory Zone (5.0 km)",
          severity: "advisory",
          fillColor: "#fbbf24",
          fillOpacity: 0.18,
          strokeColor: "#d97706",
          travelTimeMinutes: Math.round((5000 / flowVelocityMs) / 60),
          description: "Downstream monitoring buffer. Increased sampling cadence recommended.",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lng - dLng2500, lat - dLat2500],
              [lng + dLng5000, lat - dLat2500],
              [lng + dLng5000 * 1.2, lat + dLat5000],
              [lng - dLng2500, lat + dLat5000],
              [lng - dLng2500, lat - dLat2500],
            ],
          ],
        },
      },
    ],
  };

  return {
    siteId,
    siteName,
    flowVelocityMs,
    plumeLengthKm: 5.0,
    immediateHazardRadiusMeters: 500,
    dispersionCorridorKm: 2.5,
    advisoryCorridorKm: 5.0,
    affectedIntakes,
    bufferGeoJson,
  };
}

/**
 * Exports complete Situational GIS FeatureCollection as RFC 7946 GeoJSON.
 */
export function exportCompleteGisFeatureCollection(
  sites: { id: string; name: string; latitude: number; longitude: number; risk: number; status: string }[]
): GeoJsonFeatureCollection {
  const basins = getWatershedBasinGeoJson();
  const flowlines = getRiverFlowlinesGeoJson();

  const sitePoints: GeoJsonFeature[] = sites.map((s) => ({
    type: "Feature",
    id: `site-${s.id}`,
    properties: {
      type: "monitoring_station",
      id: s.id,
      name: s.name,
      risk: s.risk,
      status: s.status,
    },
    geometry: {
      type: "Point",
      coordinates: [s.longitude, s.latitude],
    },
  }));

  const intakePoints: GeoJsonFeature[] = municipalWaterIntakes.map((i) => ({
    type: "Feature",
    id: `intake-${i.id}`,
    properties: {
      type: "drinking_water_intake",
      id: i.id,
      name: i.name,
      capacityMld: i.capacityMld,
      populationServed: i.populationServed,
      status: i.status,
    },
    geometry: {
      type: "Point",
      coordinates: [i.longitude, i.latitude],
    },
  }));

  return {
    type: "FeatureCollection",
    features: [
      ...basins.features,
      ...flowlines.features,
      ...sitePoints,
      ...intakePoints,
    ],
  };
}
