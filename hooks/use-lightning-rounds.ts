import { useMemo } from "react";
import {
  useActiveBountiesQuery,
  useBountiesQuery,
  type BountyFieldsFragment,
  type BountyQueryInput,
} from "@/lib/graphql/generated";

/**
 * Represents a Lightning Round (Bounty Window) with enriched metadata.
 * Derived from the existing BountyWindowType in the schema.
 */
export interface LightningRound {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  /** Bounties associated with this round */
  bounties: BountyFieldsFragment[];
  /** Computed stats */
  stats: {
    totalBounties: number;
    totalValue: number;
    currency: string;
    claimedCount: number;
    completedCount: number;
    categories: string[];
  };
}

/**
 * Derives Lightning Round state from a window's dates.
 * We compute this client-side — the backend exposes `status` on BountyWindowType
 * but it may not always be reliable, so we cross-check with dates.
 */
export function getRoundPhase(
  round: Pick<LightningRound, "startDate" | "endDate" | "status">,
): "upcoming" | "active" | "ended" {
  const now = new Date();
  const start = round.startDate ? new Date(round.startDate) : null;
  const end = round.endDate ? new Date(round.endDate) : null;

  if (round.status?.toLowerCase() === "completed") return "ended";
  if (end && now > end) return "ended";
  if (start && now < start) return "upcoming";
  return "active";
}

/**
 * Returns ms until round starts or ends, depending on phase.
 * Returns null if no relevant date is available.
 */
export function getRoundCountdownTarget(
  round: Pick<LightningRound, "startDate" | "endDate" | "status">,
): Date | null {
  const phase = getRoundPhase(round);
  if (phase === "upcoming" && round.startDate) return new Date(round.startDate);
  if (phase === "active" && round.endDate) return new Date(round.endDate);
  return null;
}

/**
 * Groups bounties by their bountyWindow, building a LightningRound[] list.
 * Bounties without a bountyWindow are excluded.
 */
function groupBountiesByWindow(
  bounties: BountyFieldsFragment[],
): LightningRound[] {
  const windowMap = new Map<string, LightningRound>();

  for (const bounty of bounties) {
    if (!bounty.bountyWindow) continue;
    const { id, name, status, startDate, endDate } = bounty.bountyWindow;

    if (!windowMap.has(id)) {
      windowMap.set(id, {
        id,
        name,
        status,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        bounties: [],
        stats: {
          totalBounties: 0,
          totalValue: 0,
          currency: bounty.rewardCurrency,
          claimedCount: 0,
          completedCount: 0,
          categories: [],
        },
      });
    }

    const round = windowMap.get(id)!;
    round.bounties.push(bounty);

    // Aggregate stats
    round.stats.totalBounties += 1;
    round.stats.totalValue += bounty.rewardAmount ?? 0;

    const s = bounty.status.toLowerCase();
    if (s === "in_progress") round.stats.claimedCount += 1;
    if (s === "completed") round.stats.completedCount += 1;

    const type = bounty.type.replace(/_/g, " ");
    if (!round.stats.categories.includes(type)) {
      round.stats.categories.push(type);
    }
  }

  // Sort: active first, then upcoming, then ended
  const phaseOrder = { active: 0, upcoming: 1, ended: 2 };
  return Array.from(windowMap.values()).sort((a, b) => {
    return phaseOrder[getRoundPhase(a)] - phaseOrder[getRoundPhase(b)];
  });
}

// ---------------------------------------------------------------------------
// Hook: useActiveLightningRound
// ---------------------------------------------------------------------------

/**
 * Returns the currently active Lightning Round (if any), derived from
 * the existing `activeBounties` query — no new backend work needed.
 *
 * @example
 * const { round, isLoading } = useActiveLightningRound();
 * if (round) return <LightningRoundBanner round={round} />;
 */
export function useActiveLightningRound() {
  const { data, isLoading, isError, error } = useActiveBountiesQuery();

  const round = useMemo<LightningRound | null>(() => {
    if (!data?.activeBounties?.length) return null;
    const rounds = groupBountiesByWindow(
      data.activeBounties as BountyFieldsFragment[],
    );
    // Return the first active round
    return rounds.find((r) => getRoundPhase(r) === "active") ?? null;
  }, [data]);

  return { round, isLoading, isError, error };
}

// ---------------------------------------------------------------------------
// Hook: useLightningRounds
// ---------------------------------------------------------------------------

/**
 * Returns all Lightning Rounds (past, active, upcoming) by fetching
 * bounties filtered by a specific window, or all bounties.
 *
 * The backend's `BountyQueryInput.bountyWindowId` filter lets us scope
 * bounties to a specific round when the caller knows the window ID.
 *
 * @example
 * const { rounds, activeRound, upcomingRounds } = useLightningRounds();
 */
export function useLightningRounds(params?: BountyQueryInput) {
  const { data, isLoading, isError, error, refetch } = useBountiesQuery({
    query: { limit: 100, sortBy: "createdAt", sortOrder: "desc", ...params },
  });

  const { rounds, activeRound, upcomingRounds, endedRounds } = useMemo(() => {
    const allBounties =
      (data?.bounties?.bounties as BountyFieldsFragment[]) ?? [];
    const all = groupBountiesByWindow(allBounties);

    return {
      rounds: all,
      activeRound: all.find((r) => getRoundPhase(r) === "active") ?? null,
      upcomingRounds: all.filter((r) => getRoundPhase(r) === "upcoming"),
      endedRounds: all.filter((r) => getRoundPhase(r) === "ended"),
    };
  }, [data]);

  return {
    rounds,
    activeRound,
    upcomingRounds,
    endedRounds,
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// Hook: useLightningRoundBounties
// ---------------------------------------------------------------------------

/**
 * Fetches bounties for a specific Lightning Round by bountyWindowId.
 * Groups them by bounty type for the dedicated round page.
 *
 * @example
 * const { round, groupedByType } = useLightningRoundBounties(windowId);
 */
export function useLightningRoundBounties(windowId: string) {
  const { data, isLoading, isError, error } = useBountiesQuery({
    query: { bountyWindowId: windowId, limit: 100 },
  });

  const { round, groupedByType } = useMemo(() => {
    const bounties = (data?.bounties?.bounties as BountyFieldsFragment[]) ?? [];
    const rounds = groupBountiesByWindow(bounties);
    const found = rounds[0] ?? null;

    // Group bounties by type for the category-section layout on the round page
    const grouped: Record<string, BountyFieldsFragment[]> = {};
    for (const b of bounties) {
      const key = b.type.replace(/_/g, " ");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(b);
    }

    return { round: found, groupedByType: grouped };
  }, [data]);

  return { round, groupedByType, isLoading, isError, error };
}
