import * as React from "react"

/**
 * Hook to listen for media query changes.
 * 
 * @param query The media query string to listen for.
 * @returns True if the media query matches, false otherwise.
 * 
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
    // Keep track of the media query match status
    // Initialize with null/false to avoid hydration mismatch, or handle with effect
    // "Boring" safe way: false initially, then update in effect.
    const [matches, setMatches] = React.useState(false)

    React.useEffect(() => {
        const media = window.matchMedia(query)

        // Update the state with the current value
        setMatches(media.matches)

        // Listener callback
        const listener = () => setMatches(media.matches)

        // Register listener
        media.addEventListener("change", listener)

        // Remove listener on cleanup
        return () => media.removeEventListener("change", listener)
    }, [query]) // Re-run if query changes

    return matches
}
