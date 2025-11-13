import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderGit2, Star, GitFork, Download, Users, GitCommit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RepoCardProps {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  domain?: string | null;
  stars?: number;
  contributors?: string[];
  contributorCount?: number;
  lastCommit?: {
    author: string;
    message: string;
    date: string;
  } | null;
  isSelected?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  onFork?: () => void;
  onDownload?: () => void;
}

export function RepoCard({
  id,
  name,
  description,
  technologies,
  domain,
  stars = 0,
  contributors = [],
  contributorCount = 0,
  lastCommit,
  isSelected = false,
  onSelect,
  onPreview,
  onFork,
  onDownload,
}: RepoCardProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover-elevate h-full flex flex-col" data-testid={`card-repo-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1" id={`repo-header-${id}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{name}</h3>
              {domain && (
                <Badge 
                  variant="outline" 
                  className="text-xs capitalize" 
                  data-testid={`badge-domain-${domain}`}
                >
                  {domain}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </div>
        {stars > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span>{stars}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>

        {/* Contributors and Commits Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          {contributorCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{contributorCount} contributor{contributorCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {stars > 0 && (
            <div className="flex items-center gap-1">
              <GitCommit className="h-4 w-4" />
              <span>{stars} commit{stars > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Last Commit Info */}
        {lastCommit && (
          <div className="border-t pt-3">
            <div className="flex items-start gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {lastCommit.author.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{lastCommit.author}</p>
                <p className="text-xs text-muted-foreground truncate">{lastCommit.message}</p>
                <p className="text-xs text-muted-foreground">{formatDate(lastCommit.date)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                console.log(`Previewing repository: ${name}`);
                onPreview?.();
              }}
              data-testid={`button-preview-${name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                console.log(`Forking repository: ${name}`);
                onFork?.();
              }}
              data-testid={`button-fork-${name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <GitFork className="h-4 w-4 mr-1" />
              Fork
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              console.log(`Downloading repository: ${name}`);
              onDownload?.();
            }}
            data-testid={`button-download-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Download ZIP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
