import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Globe, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@/types/project";

interface ProjectSidebarProps {
  project: Project;
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const createdTimeAgo = formatDistanceToNow(new Date(project.createdAt), { addSuffix: true });
  const updatedTimeAgo = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });

  return (
    <div className="space-y-6">
      {/* Project Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Project Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Bounties</span>
            <span className="text-lg font-bold">{project.bountyCount}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">Open Bounties</span>
            <span className="text-lg font-bold text-primary">{project.openBountyCount}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">Prize Pool</span>
            <span className="text-lg font-bold">{project.prizeAmount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Links Card */}
      {project.websiteUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline group"
            >
              <Globe className="size-4" />
              <span>Official Website</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Timeline Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Calendar className="size-4 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-xs">Created</p>
              <p className="text-sm">{createdTimeAgo}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-2">
            <TrendingUp className="size-4 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-xs">Last Updated</p>
              <p className="text-sm">{updatedTimeAgo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
