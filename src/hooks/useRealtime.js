import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { createAuthenticatedSocket } from "../utils/socketClient";

export const useRealtime = (handlers = {}) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let socket;
    try {
      socket = createAuthenticatedSocket();
    } catch {
      return undefined;
    }

    const on = (event, fn) => {
      socket.on(event, fn);
    };

    on("notification", (payload) => {
      handlersRef.current.onNotification?.(payload);
      if (payload?.request?.title) {
        toast(`Workflow: ${payload.request.title}`, { icon: "🔔" });
      }
    });

    on("workflow:created", (payload) => handlersRef.current.onWorkflowCreated?.(payload));
    on("workflow:updated", (payload) => handlersRef.current.onWorkflowUpdated?.(payload));
    on("workflow:escalated", (payload) => {
      handlersRef.current.onWorkflowEscalated?.(payload);
      toast("Workflow escalated — SLA breached", { icon: "⚠️" });
    });
    on("announcement:created", (payload) => {
      handlersRef.current.onAnnouncement?.(payload);
      toast(payload?.announcement?.title || "New announcement", { icon: "📢" });
    });
    on("budget:updated", (payload) => handlersRef.current.onBudgetUpdated?.(payload));
    on("activity:new", (payload) => handlersRef.current.onActivity?.(payload));
    on("project:updated", (payload) => handlersRef.current.onProjectUpdated?.(payload));
    on("task:updated", (payload) => handlersRef.current.onTaskUpdated?.(payload));

    return () => {
      socket.disconnect();
    };
  }, []);
};

export const joinProjectRoom = (projectId) => {
  try {
    const socket = createAuthenticatedSocket();
    socket.emit("joinProject", projectId);
    return () => {
      socket.emit("leaveProject", projectId);
      socket.disconnect();
    };
  } catch {
    return () => {};
  }
};
