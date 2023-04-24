import type { DependencyList, EffectCallback } from "react"
import { useEffect } from "react"



export function useEffectUnsafe(effect: EffectCallback, deps: DependencyList) {
  let initialized = false;

  useEffect(() => {
    if (!initialized) {
      initialized = true;
      effect();
    }
  }, deps);
}