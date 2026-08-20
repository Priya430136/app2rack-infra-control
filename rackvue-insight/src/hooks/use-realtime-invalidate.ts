import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Note: Real-time updates via WebSockets are currently disabled 
 * after the migration to a custom Express backend. 
 * Re-implementing this would require a Socket.io or similar 
 * integration on the Express server.
 */
export function useRealtimeInvalidate() {
  const qc = useQueryClient();
  useEffect(() => {
    // Placeholder for future WebSocket implementation
    // For now, we rely on standard React Query invalidation
  }, [qc]);
}
