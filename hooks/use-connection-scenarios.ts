"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ScenarioActiveResponse,
  ScenarioActivateResponse,
  ScenarioConfig,
} from "@/types/connection-scenario";

// =============================================================================
// useConnectionScenarios — Active Scenario State & Activation Hook
// =============================================================================
// Manages which connection scenario is active and handles activation
// (sending network mode + band lock AT commands to the modem).
//
// Backend endpoints:
//   GET  /cgi-bin/quecmanager/scenarios/active.sh    → active scenario ID
//   POST /cgi-bin/quecmanager/scenarios/activate.sh  → apply scenario
//
// For default scenarios, only the ID is needed (backend knows the config).
// For custom scenarios, the full config (mode + bands) is sent in the body.
// =============================================================================

const CGI_BASE = "/cgi-bin/quecmanager/scenarios";

export interface UseConnectionScenariosReturn {
  /** Currently active scenario ID (defaults to "balanced") */
  activeScenarioId: string;
  /** True during initial fetch of active scenario */
  isLoading: boolean;
  /** True while an activation request is in flight */
  isActivating: boolean;
  /** Error message from the last operation */
  error: string | null;
  /**
   * Activate a scenario by ID.
   * For custom scenarios, pass the config so mode + bands are sent to backend.
   * Returns success boolean.
   */
  activateScenario: (id: string, config?: ScenarioConfig) => Promise<boolean>;
  /** Manually refresh the active scenario state */
  refresh: () => void;
}

export function useConnectionScenarios(): UseConnectionScenariosReturn {
  const [activeScenarioId, setActiveScenarioId] = useState("balanced");
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch active scenario from backend
  // ---------------------------------------------------------------------------
  const fetchActive = useCallback(async () => {
    try {
      const resp = await fetch(`${CGI_BASE}/active.sh`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data: ScenarioActiveResponse = await resp.json();
      if (!mountedRef.current) return;

      setActiveScenarioId(data.active_scenario_id || "balanced");
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load active scenario",
      );
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  // ---------------------------------------------------------------------------
  // Activate a scenario
  // ---------------------------------------------------------------------------
  const activateScenario = useCallback(
    async (id: string, config?: ScenarioConfig): Promise<boolean> => {
      setError(null);
      setIsActivating(true);

      try {
        // Build POST body — default scenarios only need id,
        // custom scenarios include full config for backend to apply
        const body: Record<string, string> = { id };

        if (config && id.startsWith("custom-")) {
          body.mode = config.atModeValue;
          if (config.lte_bands) body.lte_bands = config.lte_bands;
          if (config.nsa_nr_bands) body.nsa_nr_bands = config.nsa_nr_bands;
          if (config.sa_nr_bands) body.sa_nr_bands = config.sa_nr_bands;
        }

        const resp = await fetch(`${CGI_BASE}/activate.sh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const data: ScenarioActivateResponse = await resp.json();
        if (!mountedRef.current) return false;

        if (!data.success) {
          setError(data.detail || data.error || "Failed to activate scenario");
          return false;
        }

        // Optimistic update — backend confirmed success
        setActiveScenarioId(id);
        return true;
      } catch (err) {
        if (!mountedRef.current) return false;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to activate scenario",
        );
        return false;
      } finally {
        if (mountedRef.current) {
          setIsActivating(false);
        }
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Manual refresh
  // ---------------------------------------------------------------------------
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchActive();
  }, [fetchActive]);

  return {
    activeScenarioId,
    isLoading,
    isActivating,
    error,
    activateScenario,
    refresh,
  };
}
