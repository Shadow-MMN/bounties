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
        let cleanup: void | (() => void | undefined)
        let mounted = true

        const run = async () => {
            if (mounted) {
                cleanup = await effect()
            }
        }

        run()

        return () => {
            mounted = false
            if (cleanup && typeof cleanup === "function") {
                cleanup()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}
