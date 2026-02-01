"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  getDataRequests,
  createDataRequest,
  fulfillDataRequest,
  declineDataRequest,
  type DataRequest,
  type DataRequestsResponse,
} from "../lib/api";

// Socket event types for data requests
type DataRequestSocketEvent = {
  type: "dataRequest" | "requestFulfilled" | "requestDeclined";
  request: DataRequest;
};

export function useDataRequests(entityId: string | null) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch requests from the server
  const {
    data: requestsData,
    isLoading,
    refetch,
  } = useQuery<DataRequestsResponse>({
    queryKey: ["dataRequests"],
    queryFn: getDataRequests,
    enabled: !!entityId,
    refetchOnWindowFocus: false,
  });

  // Extract incoming and outgoing requests
  const incomingRequests = requestsData?.incoming ?? [];
  const outgoingRequests = requestsData?.outgoing ?? [];

  // Calculate pending count (requests addressed to this entity that are pending)
  useEffect(() => {
    const pending = incomingRequests.filter((r) => r.status === "pending").length;
    setPendingCount(pending);
  }, [incomingRequests]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!entityId) return;

    const socket = io({
      path: "/api/socket",
      addTrailingSlash: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[DataRequests] Socket connected");
      socket.emit("subscribe", entityId);
    });

    // Handle incoming data request (doctor sent request to patient)
    socket.on("dataRequest", (data: DataRequestSocketEvent) => {
      console.log("[DataRequests] Received data request:", data);
      queryClient.invalidateQueries({ queryKey: ["dataRequests"] });
      toast.info("New data request received", {
        description: `A healthcare provider is requesting your medical records.`,
      });
    });

    // Handle request fulfilled notification (patient fulfilled request)
    socket.on("requestFulfilled", (data: DataRequestSocketEvent) => {
      console.log("[DataRequests] Request fulfilled:", data);
      queryClient.invalidateQueries({ queryKey: ["dataRequests"] });
      toast.success("Data request fulfilled", {
        description: "The patient has shared the requested records with you.",
      });
    });

    // Handle request declined notification (patient declined request)
    socket.on("requestDeclined", (data: DataRequestSocketEvent) => {
      console.log("[DataRequests] Request declined:", data);
      queryClient.invalidateQueries({ queryKey: ["dataRequests"] });
      toast.info("Data request declined", {
        description: "The patient has declined your data request.",
      });
    });

    return () => {
      socket.emit("unsubscribe", entityId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [entityId, queryClient]);

  // Create request mutation (doctor creates request)
  const createRequestMutation = useMutation({
    mutationFn: async ({
      toEntityId,
      requestedTypes,
      message,
    }: {
      toEntityId: string;
      requestedTypes: string[];
      message?: string;
    }) => {
      const result = await createDataRequest(toEntityId, requestedTypes, message);
      
      // Emit socket event to notify patient
      if (socketRef.current) {
        socketRef.current.emit("dataRequest", {
          type: "dataRequest",
          request: result.request,
        });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataRequests"] });
      toast.success("Data request sent", {
        description: "The patient will be notified of your request.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to send request", {
        description: error.message,
      });
    },
  });

  // Fulfill request mutation (patient fulfills request)
  const fulfillRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      sharedPropertyNames,
    }: {
      requestId: string;
      sharedPropertyNames?: string[];
    }) => {
      const result = await fulfillDataRequest(requestId, sharedPropertyNames);
      
      // Emit socket event to notify doctor
      if (socketRef.current) {
        socketRef.current.emit("requestFulfilled", {
          type: "requestFulfilled",
          request: result.request,
        });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataRequests"] });
      toast.success("Request fulfilled", {
        description: "The healthcare provider has been notified.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to fulfill request", {
        description: error.message,
      });
    },
  });

  // Decline request mutation (patient declines request)
  const declineRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason?: string;
    }) => {
      const result = await declineDataRequest(requestId, reason);
      
      // Emit socket event to notify doctor
      if (socketRef.current) {
        socketRef.current.emit("requestDeclined", {
          type: "requestDeclined",
          request: result.request,
        });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataRequests"] });
      toast.success("Request declined");
    },
    onError: (error: Error) => {
      toast.error("Failed to decline request", {
        description: error.message,
      });
    },
  });

  // Helper functions
  const sendRequest = useCallback(
    (toEntityId: string, requestedTypes: string[], message?: string) =>
      createRequestMutation.mutateAsync({ toEntityId, requestedTypes, message }),
    [createRequestMutation]
  );

  const fulfillRequest = useCallback(
    (requestId: string, sharedPropertyNames?: string[]) =>
      fulfillRequestMutation.mutateAsync({ requestId, sharedPropertyNames }),
    [fulfillRequestMutation]
  );

  const declineRequest = useCallback(
    (requestId: string, reason?: string) =>
      declineRequestMutation.mutateAsync({ requestId, reason }),
    [declineRequestMutation]
  );

  return {
    // Data
    incomingRequests,
    outgoingRequests,
    pendingCount,
    isLoading,
    
    // Actions
    sendRequest,
    fulfillRequest,
    declineRequest,
    refetch,
    
    // Status
    isSendingRequest: createRequestMutation.isPending,
    isFulfillingRequest: fulfillRequestMutation.isPending,
    isDecliningRequest: declineRequestMutation.isPending,
  };
}
