import { Button } from "@/components/ui/button";
import { OrganizationCard } from "@/components/organization-card";
import { Plus } from "lucide-react";

export default function Organizations() {
  //todo: remove mock data
  const organizations = [
    { name: "Acme Corporation", projectCount: 12, memberCount: 45, status: "active" as const },
    { name: "Tech Innovators", projectCount: 8, memberCount: 23, status: "active" as const },
    { name: "Digital Solutions", projectCount: 15, memberCount: 67, status: "active" as const },
    { name: "Cloud Systems", projectCount: 5, memberCount: 12, status: "inactive" as const },
    { name: "DevOps Masters", projectCount: 20, memberCount: 89, status: "active" as const },
    { name: "Code Factory", projectCount: 10, memberCount: 34, status: "active" as const },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organizations and teams
          </p>
        </div>
        <Button data-testid="button-create-organization">
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org, index) => (
          <OrganizationCard key={index} {...org} />
        ))}
      </div>
    </div>
  );
}
