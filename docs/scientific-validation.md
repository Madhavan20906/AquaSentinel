# AquaSentinel Scientific Validation Protocol

## 1. Executive Summary

AquaSentinel synthesizes multi-modal telemetry (continuous hydrological sensors, meteorological data, satellite visual indicators, and citizen scientist observations) into unified environmental health indices and hazard alert tiers.

This document formalizes the validation protocol, concordance thresholds, benchmark datasets, and statistical metrics used to scientifically validate the environmental risk classification engine.

---

## 2. Reference Benchmark Datasets

The scoring models are evaluated against standardized water quality datasets from global environmental protection authorities:

| Dataset Provider | Registry / Survey | Target Analytes | Reference Stations / Sites |
| :--- | :--- | :--- | :--- |
| **USGS NWIS** | National Water Information System | Dissolved Oxygen, pH, Turbidity, Specific Conductance, Temperature | Potomac River, Delaware River, Fox River, Illinois River |
| **EPA NARS** | National Aquatic Resource Surveys | Chlorophyll-a, Total Nitrogen, Total Phosphorus, Microcystins | Cuyahoga Basin, Des Moines River, Lake Erie Coastal |
| **OneAquaHealth** | EU Horizon Europe (Urban Streams) | Bioindicators, E. coli, enterococci, visual pollution indices | Besòs River (Barcelona), Tiber Tributary (Rome) |
| **EPA Emergency** | National Response Center Historical Spills | Severe acute contamination, acid mine drainage, industrial discharge | Animas River (Gold King Mine), Flint River Point Source |

---

## 3. Water Quality Index (WQI) Formulation

AquaSentinel calculates an aggregated Water Quality Index (WQI, 0–100 scale) using weighted parameter sub-indices derived from NSF-WQI and Canadian CCME guidelines:

$$WQI = \max\left(0, 100 - \sum_{i} P_i\right)$$

Where parameter penalties $P_i$ are assigned according to physiological stress thresholds:

1. **Dissolved Oxygen (DO)**:
   - $DO \ge 6.5 \text{ mg/L}$: Baseline healthy ($P = 0$)
   - $5.0 \le DO < 6.5 \text{ mg/L}$: Mild biological stress ($P = 10$)
   - $3.0 \le DO < 5.0 \text{ mg/L}$: Moderate hypoxia ($P = 25$)
   - $DO < 3.0 \text{ mg/L}$: Severe hypoxia / fish kill potential ($P = 40$)

2. **pH Excursion**:
   - $6.5 \le \text{pH} \le 8.5$: Optimal biological range ($P = 0$)
   - $5.0 \le \text{pH} < 6.5$ or $8.5 < \text{pH} \le 9.0$: Mild acidification or alkalization ($P = 15$)
   - $\text{pH} < 5.0$ or $\text{pH} > 9.0$: Critical acid-base breach ($P = 35$)

3. **Turbidity (NTU)**:
   - $\text{Turb} \le 10 \text{ NTU}$: Pristine clear water ($P = 0$)
   - $10 < \text{Turb} \le 20 \text{ NTU}$: Elevated suspension ($P = 5$)
   - $20 < \text{Turb} \le 50 \text{ NTU}$: Moderate silt / algae accumulation ($P = 15$)
   - $\text{Turb} > 50 \text{ NTU}$: Acute storm runoff / heavy sediment plume ($P = 25$)

4. **Electrical Conductivity ($\mu\text{S/cm}$)**:
   - $\le 800\ \mu\text{S/cm}$: Normal ionic balance ($P = 0$)
   - $800 - 1500\ \mu\text{S/cm}$: Elevated mineral or municipal discharge ($P = 10$)
   - $> 1500\ \mu\text{S/cm}$: High saline intrusion or industrial effluent ($P = 20$)

---

## 4. Multi-Modal Fusion: Sensor + Citizen Science

Citizen science inputs (qualitative water color, odor, floating waste) are incorporated via Bayesian confidence updating:

- **AI Image Classification**: Evaluates surface scum, algal blooms, and debris with calibrated confidence scoring (e.g. 74%–91%).
- **Verification Gate**: Citizen reports alone cannot escalate an alert to `Verified` or `Critical` status without either:
  1. Corroborating sensor telemetry (DO drop or turbidity spike), or
  2. Multiple independent citizen submissions within a 2-hour window and 500m radius.

---

## 5. Automated Validation Test Suite

Run the automated scientific validation harness via:

```bash
pnpm --filter @workspace/scripts run validate:scientific
```

The script evaluates model concordance, false-positive rate, and critical hazard sensitivity against the curated reference matrices.
