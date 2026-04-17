"use client";

import { useEffect } from "react";
import { getApiBaseUrl, switchToLocalBackend } from "@/lib/api-base";

export default function ApiHealthChecker() {
  useEffect(() => {
    // Only perform the health check if we are on localhost in development
    // or if we explicitly want to check connectivity to production.
    if (typeof window === "undefined") return;
    
    const checkHealth = async () => {
      const baseUrl = getApiBaseUrl();
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(`${baseUrl}/jobs?limit=1`, { 
          method: "GET",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok && response.status !== 401) {
          throw new Error("API responded with error");
        }
      } catch (error) {
        // If production is down, and we're local, switch!
        if (window.location.hostname === "localhost") {
          switchToLocalBackend();
        }
      }
    };

    checkHealth();
  }, []);

  return null;
}
