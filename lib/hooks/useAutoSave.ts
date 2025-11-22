import { useEffect, useRef } from "react";
import { Node, Edge } from "@xyflow/react";
import { useToast } from "@/components/ui/toast";

interface AutoSaveOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
}

export function useAutoSave(
  nodes: Node[],
  edges: Edge[],
  options: AutoSaveOptions = {}
) {
  const { interval = 30000, enabled = true, onSave } = options; // 30 seconds default
  const { addToast } = useToast();
  const lastSaveRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const currentState = JSON.stringify({ nodes, edges });

    // Only save if state has changed
    if (currentState === lastSaveRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        if (onSave) {
          await onSave(nodes, edges);
        } else {
          // Default save to localStorage
          localStorage.setItem("workflow-autosave", currentState);
          localStorage.setItem("workflow-autosave-timestamp", new Date().toISOString());
        }

        lastSaveRef.current = currentState;
        console.log("Auto-saved workflow at", new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodes, edges, interval, enabled, onSave]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("workflow-autosave");
    if (saved) {
      const timestamp = localStorage.getItem("workflow-autosave-timestamp");
      console.log("Found auto-saved workflow from", timestamp);
    }
  }, []);

  return {
    loadAutoSave: () => {
      const saved = localStorage.getItem("workflow-autosave");
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    },
    clearAutoSave: () => {
      localStorage.removeItem("workflow-autosave");
      localStorage.removeItem("workflow-autosave-timestamp");
    },
    getLastSaveTime: () => {
      return localStorage.getItem("workflow-autosave-timestamp");
    },
  };
}
