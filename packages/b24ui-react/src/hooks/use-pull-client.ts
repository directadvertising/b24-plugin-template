import { useB24Helper } from "@bitrix24/b24jssdk";
import { useEffect, useRef } from "react";
import { useB24FrameOrNull } from "./use-b24-frame.js";

export interface UsePullClientOptions {
  moduleId?: string;
  onMessage?: (command: string, params: Record<string, unknown>) => void;
  enabled?: boolean;
}

/**
 * Lifecycle hook for Bitrix24 Pull (websocket) messaging.
 * Automatically starts/stops the pull client on mount/unmount.
 */
export function usePullClient(options: UsePullClientOptions = {}) {
  const { moduleId = "main", onMessage, enabled = true } = options;
  const frame = useB24FrameOrNull();
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !frame) return;

    const {
      usePullClient: setupPull,
      useSubscribePullClient,
      startPullClient,
      destroyB24Helper,
      // biome-ignore lint/correctness/useHookAtTopLevel: B24 SDK factory, not a React hook
    } = useB24Helper();

    setupPull();

    if (callbackRef.current) {
      // biome-ignore lint/correctness/useHookAtTopLevel: B24 SDK function, not a React hook
      useSubscribePullClient(
        (message: { command: string; params: Record<string, unknown> }) => {
          callbackRef.current?.(message.command, message.params);
        },
        moduleId,
      );
    }

    startPullClient();

    return () => {
      destroyB24Helper();
    };
  }, [enabled, frame, moduleId]);
}
