import type { Session } from "@/types";
import type { MasanielloStore } from "../masaniello-store";

export function updateSession(
  state: MasanielloStore,
  data: Partial<Session>
) {
  return {
    ...state,
    sessions: state.sessions.map(s =>
      s.id === state.activeSessionId
        ? { ...s, ...data }
        : s
    )
  }
}