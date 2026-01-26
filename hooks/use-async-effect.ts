import * as React from "react"

/**
 * Hook to run an async effect.
 * 
 * @param effect The async function to run.
 * @param deps The dependency array.
 * @param destructor Optional destructor function.
 */
export function useAsyncEffect(
    effect: () => Promise<void | (() => void | undefined)>,
    deps: React.DependencyList
) {
    React.useEffect(() => {
        let mounted = true
        const cleanupRef = { current: undefined as void | (() => void | undefined) }

        const run = async () => {
            const cleanup = await effect()
            // Store cleanup in ref so it can be called even if component unmounts
            cleanupRef.current = cleanup
            // If we unmounted while waiting, call cleanup immediately
            if (!mounted && cleanup && typeof cleanup === "function") {
                cleanup()
            }
        }

        run()

        return () => {
            mounted = false
            if (cleanupRef.current && typeof cleanupRef.current === "function") {
                cleanupRef.current()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}
