import { differenceInDays, isPast, parseISO, isValid } from 'date-fns';


/**
 * Interface defining the minimal fields required for status logic.
 * Compatible with both `types/bounty.ts` and `lib/types.ts`.
 */
export interface StatusAwareBounty {
    status: string;
    claimingModel: string;
    claimExpiresAt?: string;
    lastActivityAt?: string;
    claimedBy?: string;
    claimedAt?: string;
}

export class BountyLogic {
    /**
     * Configuration for inactivity thresholds (in days)
     */
    static readonly INACTIVITY_THRESHOLD_DAYS = 7;

    /**
     * Processes the bounty status based on its model and timestamps.
     * - Checks for inactivity auto-release for single-claim.
     * - Checks for expired claims.
     * - Returns the potentially modified bounty (this simulates the backend update).
     */
    static processBountyStatus<T extends StatusAwareBounty>(bounty: T): T {
        if (bounty.status !== 'claimed' && bounty.status !== 'open') return bounty;

        const now = new Date();
        // Shallow copy works for pure property updates
        const newBounty = { ...bounty };

        // Anti-squatting: Check inactivity for single-claim
        if (
            bounty.claimingModel === 'single-claim' &&
            bounty.status === 'claimed'
        ) {
            // Helper to get Date object safely
            const getDate = (val?: string) => {
                if (!val) return null;
                const date = parseISO(val);
                return isValid(date) ? date : null;
            };

            const expiresAt = getDate(bounty.claimExpiresAt);

            // If claim expired
            if (expiresAt && isPast(expiresAt)) {
                // Auto-release
                newBounty.status = 'open';
                newBounty.claimedBy = undefined;
                newBounty.claimedAt = undefined;
                newBounty.claimExpiresAt = undefined;
                newBounty.lastActivityAt = undefined;
            }

            // If inactive for too long
            const lastActive = getDate(bounty.lastActivityAt) || getDate(bounty.claimedAt);
            if (lastActive) {
                const daysInactive = differenceInDays(now, lastActive);
                if (daysInactive > this.INACTIVITY_THRESHOLD_DAYS) {
                    // Auto-release due to inactivity
                    newBounty.status = 'open';
                    newBounty.claimedBy = undefined;
                    newBounty.claimedAt = undefined;
                    newBounty.claimExpiresAt = undefined;
                    newBounty.lastActivityAt = undefined;
                }
            }
        }

        return newBounty;
    }

    /**
     * Returns metadata about the claim status suitable for UI display.
     */
    static getClaimStatusDisplay(bounty: StatusAwareBounty) {
        if (bounty.status === 'open') return { label: 'Available', color: 'green' };

        if (bounty.status === 'claimed') {
            if (bounty.claimingModel === 'single-claim') {
                return {
                    label: 'Claimed',
                    color: 'orange',
                    details: bounty.claimExpiresAt ? `Expires ${BountyLogic.formatDate(bounty.claimExpiresAt)}` : 'In Progress'
                };
            }
            if (bounty.claimingModel === 'application') {
                return { label: 'Applications Open', color: 'blue' };
            }
        }

        return { label: bounty.status, color: 'gray' };
    }

    private static formatDate(dateStr: string) {
        const date = parseISO(dateStr);
        if (!isValid(date)) return 'Invalid Date';
        return date.toLocaleDateString();
    }
}
