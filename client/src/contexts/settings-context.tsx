import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface GoldenRepoOrganization {
  id: string;
  name: string;
  organizationUrl: string;
  projectName: string;
  repositoryName: string;
  apiVersion: string;
  patConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArtifactOrganization {
  id: string;
  organizationUrl: string;
  projectName: string;
  patConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SettingsContextType {
  goldenRepoOrganizations: GoldenRepoOrganization[];
  artifactOrganizations: ArtifactOrganization[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [goldenRepoOrganizations, setGoldenRepoOrganizations] = useState<GoldenRepoOrganization[]>([]);
  const [artifactOrganizations, setArtifactOrganizations] = useState<ArtifactOrganization[]>([]);

  // Fetch Golden Repo Organizations
  const { data: goldenRepoData, isLoading: goldenRepoLoading, refetch: refetchGoldenRepo } = useQuery<{ organizations: GoldenRepoOrganization[] }>({
    queryKey: ['/api/golden-repo-organizations'],
  });

  // Fetch Artifact Organizations (Client Settings)
  const { data: artifactData, isLoading: artifactLoading, refetch: refetchArtifact } = useQuery<{ organizations: ArtifactOrganization[] }>({
    queryKey: ['/api/artifact-organizations'],
  });

  // Update state when data is fetched
  useEffect(() => {
    if (goldenRepoData?.organizations) setGoldenRepoOrganizations(goldenRepoData.organizations);
  }, [goldenRepoData]);

  useEffect(() => {
    if (artifactData?.organizations) setArtifactOrganizations(artifactData.organizations);
  }, [artifactData]);

  const isLoading = goldenRepoLoading || artifactLoading;
  const isError = false; // Individual queries handle their own errors

  const refetch = () => {
    refetchGoldenRepo();
    refetchArtifact();
  };

  const value: SettingsContextType = {
    goldenRepoOrganizations,
    artifactOrganizations,
    isLoading,
    isError,
    refetch,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
