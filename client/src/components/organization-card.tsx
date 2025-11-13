import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, FolderOpen, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrganizationCardProps {
  name: string;
  projectCount: number;
  memberCount: number;
  status: "active" | "inactive";
  onView?: () => void;
}

export function OrganizationCard({
  name,
  projectCount,
  memberCount,
  status,
  onView,
}: OrganizationCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-org-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <Badge variant={status === "active" ? "default" : "secondary"} className="mt-1">
              {status}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" data-testid={`button-org-menu-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            <span>{projectCount} Projects</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{memberCount} Members</span>
          </div>
        </div>
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => {
            console.log(`Viewing organization: ${name}`);
            onView?.();
          }}
          data-testid={`button-view-org-${name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
