import { useEffect } from "react";
import { DependencyList, EffectCallback, useRef } from "react";



export function useEffectUnsafe(effect: EffectCallback, deps: DependencyList) {
  let initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      effect();
    }
  }, [effect, deps]);
}