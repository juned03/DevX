import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  PlayCircle,
  StopCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Download,
  Terminal,
  FileText,
  Package,
  Rocket,
  Activity,
  TrendingUp,
  AlertCircle,
  Server,
  Zap,
  Flag,
  Eye,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ActionType = 
  | "run-cicd"
  | "view-test-report"
  | "publish-package"
  | "trigger-release"
  | "manage-feature-flags"
  | "open-monitoring"
  | "push-code"
  | "create-mr"
  | "review-code"
  | "create-target"
  | "assign-reviewers"
  | "link-jira"
  | "review-design"
  | "upload-diagram"
  | "export-figma"
  | "goto-reports";

interface CICDActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ActionType | null;
  projectId: string;
  projectName: string;
  phaseName: string;
}

type PipelineStage = {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  duration?: string;
  logs?: string[];
};

export function CICDActionDialog({
  open,
  onOpenChange,
  actionType,
  projectId,
  projectName,
  phaseName,
}: CICDActionDialogProps) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [environment, setEnvironment] = useState("staging");
  const [version, setVersion] = useState("1.0.0");
  const [featureFlags, setFeatureFlags] = useState([
    { id: "1", name: "new-ui-design", enabled: true, rollout: 100 },
    { id: "2", name: "ai-suggestions", enabled: true, rollout: 50 },
    { id: "3", name: "dark-mode-v2", enabled: false, rollout: 0 },
  ]);

  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { name: "Build", status: "pending" },
    { name: "Test", status: "pending" },
    { name: "Security Scan", status: "pending" },
    { name: "Deploy", status: "pending" },
  ]);

  const getDialogTitle = () => {
    switch (actionType) {
      case "run-cicd":
        return "Run CI/CD Pipeline";
      case "view-test-report":
        return "Test Reports";
      case "publish-package":
        return "Publish Package";
      case "trigger-release":
        return "Trigger Release";
      case "manage-feature-flags":
        return "Manage Feature Flags";
      case "open-monitoring":
        return "Monitoring Dashboard";
      case "push-code":
        return "Push Code";
      case "create-mr":
        return "Create Merge Request";
      case "review-code":
        return "Review Code";
      case "create-target":
        return "Create Target";
      case "assign-reviewers":
        return "Assign Reviewers";
      case "link-jira":
        return "Link Jira Ticket";
      case "review-design":
        return "Review Design";
      case "upload-diagram":
        return "Upload Architecture Diagram";
      case "export-figma":
        return "Export to Figma";
      case "goto-reports":
        return "Go to Reports";
      default:
        return "Action";
    }
  };

  const getDialogDescription = () => {
    switch (actionType) {
      case "run-cicd":
        return `Execute CI/CD pipeline for ${projectName} - ${phaseName}`;
      case "view-test-report":
        return `View test results and coverage for ${projectName}`;
      case "publish-package":
        return `Publish package to registry for ${projectName}`;
      case "trigger-release":
        return `Deploy ${projectName} to production environment`;
      case "manage-feature-flags":
        return `Control feature rollout for ${projectName}`;
      case "open-monitoring":
        return `Monitor performance and health of ${projectName}`;
      case "push-code":
        return `Push your local changes to the remote repository for ${projectName}`;
      case "create-mr":
        return `Create a new merge request for ${projectName}`;
      case "review-code":
        return `Review pending code changes for ${projectName}`;
      case "create-target":
        return `Create a new epic or target milestone for ${projectName}`;
      case "assign-reviewers":
        return `Assign team members to review work items in ${projectName}`;
      case "link-jira":
        return `Link Jira tickets to work items in ${projectName}`;
      case "review-design":
        return `Review design mockups and assets for ${projectName}`;
      case "upload-diagram":
        return `Upload architecture diagrams and technical documentation for ${projectName}`;
      case "export-figma":
        return `Export design assets to Figma for ${projectName}`;
      case "goto-reports":
        return `View maintenance and performance reports for ${projectName}`;
      default:
        return "";
    }
  };

  const runCICDPipeline = async () => {
    setIsRunning(true);
    setProgress(0);

    const stages = [...pipelineStages];
    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(i);
      stages[i].status = "running";
      setPipelineStages([...stages]);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const success = Math.random() > 0.1;
      stages[i].status = success ? "success" : "failed";
      stages[i].duration = `${(Math.random() * 30 + 10).toFixed(1)}s`;
      stages[i].logs = [
        `[${new Date().toLocaleTimeString()}] Starting ${stages[i].name}...`,
        `[${new Date().toLocaleTimeString()}] Processing dependencies...`,
        `[${new Date().toLocaleTimeString()}] ${success ? "✓ Completed successfully" : "✗ Failed"}`,
      ];
      setPipelineStages([...stages]);
      setProgress(((i + 1) / stages.length) * 100);

      if (!success) {
        setIsRunning(false);
        toast({
          title: "Pipeline Failed",
          description: `${stages[i].name} stage failed. Check logs for details.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsRunning(false);
    toast({
      title: "Pipeline Completed",
      description: "All stages completed successfully!",
    });
  };

  const publishPackage = () => {
    toast({
      title: "Package Published",
      description: `Version ${version} published to registry successfully!`,
    });
    onOpenChange(false);
  };

  const triggerRelease = () => {
    toast({
      title: "Release Triggered",
      description: `Deploying to ${environment} environment...`,
    });
    onOpenChange(false);
  };

  const updateFeatureFlag = (id: string, enabled: boolean) => {
    setFeatureFlags(
      featureFlags.map((flag) =>
        flag.id === id ? { ...flag, enabled } : flag
      )
    );
    toast({
      title: "Feature Flag Updated",
      description: `Flag ${featureFlags.find((f) => f.id === id)?.name} ${enabled ? "enabled" : "disabled"}`,
    });
  };

  const renderRunCICD = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Environment</Label>
          <Select value={environment} onValueChange={setEnvironment}>
            <SelectTrigger className="w-[200px]" data-testid="select-environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={runCICDPipeline}
          disabled={isRunning}
          data-testid="button-run-pipeline"
        >
          {isRunning ? (
            <>
              <StopCircle className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Pipeline
            </>
          )}
        </Button>
      </div>

      <Progress value={progress} className="h-2" data-testid="progress-pipeline" />

      <div className="space-y-3">
        {pipelineStages.map((stage, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border ${
              stage.status === "running" ? "border-primary bg-primary/5" : ""
            }`}
            data-testid={`stage-${idx}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {stage.status === "pending" && (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                {stage.status === "running" && (
                  <PlayCircle className="h-4 w-4 text-primary animate-pulse" />
                )}
                {stage.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {stage.status === "failed" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-medium">{stage.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {stage.duration && (
                  <span className="text-xs text-muted-foreground">
                    {stage.duration}
                  </span>
                )}
                <Badge
                  variant={
                    stage.status === "success"
                      ? "default"
                      : stage.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                  data-testid={`badge-status-${idx}`}
                >
                  {stage.status}
                </Badge>
              </div>
            </div>
            {stage.logs && stage.logs.length > 0 && (
              <ScrollArea className="h-20 mt-2">
                <div className="bg-muted/50 p-2 rounded font-mono text-xs space-y-1">
                  {stage.logs.map((log, logIdx) => (
                    <div key={logIdx} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTestReport = () => (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="summary" data-testid="tab-summary">
          Summary
        </TabsTrigger>
        <TabsTrigger value="coverage" data-testid="tab-coverage">
          Coverage
        </TabsTrigger>
        <TabsTrigger value="details" data-testid="tab-details">
          Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg" data-testid="stat-total-tests">
            <div className="text-2xl font-bold text-green-500">247</div>
            <div className="text-sm text-muted-foreground">Tests Passed</div>
          </div>
          <div className="p-4 border rounded-lg" data-testid="stat-failed-tests">
            <div className="text-2xl font-bold text-destructive">3</div>
            <div className="text-sm text-muted-foreground">Tests Failed</div>
          </div>
          <div className="p-4 border rounded-lg" data-testid="stat-skipped-tests">
            <div className="text-2xl font-bold text-amber-500">5</div>
            <div className="text-sm text-muted-foreground">Tests Skipped</div>
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Success Rate</span>
            <span className="text-xl font-bold text-green-500">98.8%</span>
          </div>
          <Progress value={98.8} className="h-2" />
        </div>
      </TabsContent>

      <TabsContent value="coverage" className="space-y-4">
        <div className="space-y-3">
          {[
            { name: "Lines", coverage: 87.3 },
            { name: "Branches", coverage: 82.1 },
            { name: "Functions", coverage: 91.5 },
            { name: "Statements", coverage: 86.9 },
          ].map((metric, idx) => (
            <div key={idx} className="space-y-2" data-testid={`coverage-${idx}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{metric.name}</span>
                <span className="text-sm font-semibold">{metric.coverage}%</span>
              </div>
              <Progress value={metric.coverage} className="h-2" />
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="details" className="space-y-2">
        <ScrollArea className="h-64">
          {[
            { name: "Authentication", status: "passed", time: "2.3s" },
            { name: "User Management", status: "passed", time: "1.8s" },
            { name: "API Endpoints", status: "failed", time: "3.1s" },
            { name: "Database Operations", status: "passed", time: "4.2s" },
            { name: "UI Components", status: "passed", time: "1.5s" },
          ].map((test, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border rounded-lg"
              data-testid={`test-${idx}`}
            >
              <div className="flex items-center gap-2">
                {test.status === "passed" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span>{test.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{test.time}</span>
            </div>
          ))}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );

  const renderPublishPackage = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="version">Version</Label>
        <Input
          id="version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0.0"
          data-testid="input-version"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="registry">Registry</Label>
        <Select defaultValue="npm">
          <SelectTrigger data-testid="select-registry">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="npm">NPM Registry</SelectItem>
            <SelectItem value="github">GitHub Packages</SelectItem>
            <SelectItem value="private">Private Registry</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Release Notes</Label>
        <Textarea
          id="notes"
          placeholder="What's new in this version?"
          className="h-24"
          data-testid="textarea-release-notes"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={publishPackage} data-testid="button-publish">
          <Package className="mr-2 h-4 w-4" />
          Publish
        </Button>
      </div>
    </div>
  );

  const renderTriggerRelease = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Target Environment</Label>
        <Select value={environment} onValueChange={setEnvironment}>
          <SelectTrigger data-testid="select-release-environment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Version</span>
          <Badge>v1.2.5</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">New Version</span>
          <Badge variant="default">v1.3.0</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Health Status</span>
          <Badge variant="default" className="bg-green-500">
            <Activity className="mr-1 h-3 w-3" />
            Healthy
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span className="text-sm">
          This will deploy to {environment}. Ensure all checks have passed.
        </span>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={triggerRelease} data-testid="button-deploy">
          <Rocket className="mr-2 h-4 w-4" />
          Deploy Now
        </Button>
      </div>
    </div>
  );

  const renderFeatureFlags = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Feature Flags</h3>
        <Button size="sm" data-testid="button-add-flag">
          <Flag className="mr-2 h-4 w-4" />
          Add Flag
        </Button>
      </div>
      <div className="space-y-3">
        {featureFlags.map((flag) => (
          <div
            key={flag.id}
            className="p-4 border rounded-lg space-y-3"
            data-testid={`flag-${flag.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{flag.name}</div>
                <div className="text-sm text-muted-foreground">
                  Rollout: {flag.rollout}%
                </div>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={(checked) =>
                  updateFeatureFlag(flag.id, checked)
                }
                data-testid={`switch-${flag.id}`}
              />
            </div>
            <Progress value={flag.rollout} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <Tabs defaultValue="metrics" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="metrics" data-testid="tab-metrics">
          Metrics
        </TabsTrigger>
        <TabsTrigger value="logs" data-testid="tab-logs">
          Logs
        </TabsTrigger>
        <TabsTrigger value="health" data-testid="tab-health">
          Health
        </TabsTrigger>
      </TabsList>

      <TabsContent value="metrics" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "CPU Usage", value: "42%", icon: Activity },
            { label: "Memory", value: "1.2 GB", icon: Server },
            { label: "Requests/min", value: "1,247", icon: TrendingUp },
            { label: "Error Rate", value: "0.03%", icon: AlertCircle },
          ].map((metric, idx) => (
            <div
              key={idx}
              className="p-4 border rounded-lg"
              data-testid={`metric-${idx}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {metric.label}
                </span>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="logs" className="space-y-2">
        <ScrollArea className="h-64">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="p-3 border rounded-lg mb-2 font-mono text-xs"
              data-testid={`log-${i}`}
            >
              <span className="text-muted-foreground">
                [{new Date().toLocaleTimeString()}]
              </span>{" "}
              <span>Request processed successfully - 200 OK</span>
            </div>
          ))}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="health" className="space-y-4">
        <div className="p-4 border rounded-lg bg-green-500/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-500">All Systems Operational</span>
          </div>
        </div>
        <div className="space-y-2">
          {["Database", "API Server", "Cache", "CDN"].map((service, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border rounded-lg"
              data-testid={`service-${idx}`}
            >
              <span>{service}</span>
              <Badge variant="default" className="bg-green-500">
                Healthy
              </Badge>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );

  // Development Phase Actions
  const renderPushCode = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="branch">Target Branch</Label>
        <Select defaultValue="main">
          <SelectTrigger data-testid="select-push-branch">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">main</SelectItem>
            <SelectItem value="develop">develop</SelectItem>
            <SelectItem value="feature/new-ui">feature/new-ui</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="commit-message">Commit Message</Label>
        <Textarea
          id="commit-message"
          placeholder="feat: add new feature"
          className="h-24"
          data-testid="textarea-commit-message"
        />
      </div>
      <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
        <div className="text-sm font-medium mb-2">Changed Files (5)</div>
        {["src/components/Header.tsx", "src/pages/Dashboard.tsx", "src/lib/api.ts", "package.json", "README.md"].map((file, idx) => (
          <div key={idx} className="text-sm text-muted-foreground" data-testid={`changed-file-${idx}`}>
            + {file}
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => {
          toast({ title: "Code Pushed", description: "Changes pushed to remote repository successfully!" });
          onOpenChange(false);
        }} data-testid="button-push">
          <Upload className="mr-2 h-4 w-4" />
          Push Code
        </Button>
      </div>
    </div>
  );

  const renderCreateMR = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mr-title">Merge Request Title</Label>
        <Input
          id="mr-title"
          placeholder="feat: implement new dashboard"
          data-testid="input-mr-title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source-branch">Source Branch</Label>
        <Select defaultValue="feature/dashboard">
          <SelectTrigger data-testid="select-source-branch">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feature/dashboard">feature/dashboard</SelectItem>
            <SelectItem value="feature/new-ui">feature/new-ui</SelectItem>
            <SelectItem value="bugfix/login">bugfix/login</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target-branch">Target Branch</Label>
        <Select defaultValue="main">
          <SelectTrigger data-testid="select-target-branch">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">main</SelectItem>
            <SelectItem value="develop">develop</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your changes..."
          className="h-32"
          data-testid="textarea-mr-description"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => {
          toast({ title: "MR Created", description: "Merge request created successfully!" });
          onOpenChange(false);
        }} data-testid="button-create-mr">
          <Upload className="mr-2 h-4 w-4" />
          Create MR
        </Button>
      </div>
    </div>
  );

  const renderReviewCode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Pending Reviews (3)</h3>
        <Badge>Awaiting Review</Badge>
      </div>
      <div className="space-y-3">
        {[
          { id: 1, title: "feat: add authentication", author: "John Doe", changes: "+247 -89" },
          { id: 2, title: "fix: resolve memory leak", author: "Jane Smith", changes: "+12 -8" },
          { id: 3, title: "refactor: optimize database queries", author: "Bob Johnson", changes: "+156 -203" },
        ].map((mr) => (
          <div key={mr.id} className="p-4 border rounded-lg space-y-2" data-testid={`review-${mr.id}`}>
            <div className="font-medium">{mr.title}</div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>by {mr.author}</span>
              <span>{mr.changes}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-approve-${mr.id}`}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button size="sm" variant="outline" data-testid={`button-comment-${mr.id}`}>
                <Eye className="mr-1 h-3 w-3" />
                Comment
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Requirements Phase Actions
  const renderCreateTarget = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="target-name">Target Name</Label>
        <Input
          id="target-name"
          placeholder="Q1 2025 Release"
          data-testid="input-target-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="target-type">Target Type</Label>
        <Select defaultValue="epic">
          <SelectTrigger data-testid="select-target-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="milestone">Milestone</SelectItem>
            <SelectItem value="objective">Objective</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target-description">Description</Label>
        <Textarea
          id="target-description"
          placeholder="Describe the target goals..."
          className="h-32"
          data-testid="textarea-target-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input type="date" id="start-date" data-testid="input-start-date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input type="date" id="end-date" data-testid="input-end-date" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => {
          toast({ title: "Target Created", description: "New target created successfully!" });
          onOpenChange(false);
        }} data-testid="button-create-target">
          Create Target
        </Button>
      </div>
    </div>
  );

  const renderAssignReviewers = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Work Item</Label>
        <Select defaultValue="epic-1">
          <SelectTrigger data-testid="select-work-item">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="epic-1">Epic: User Authentication</SelectItem>
            <SelectItem value="story-1">Story: Login Page</SelectItem>
            <SelectItem value="req-1">Requirement: OAuth2 Support</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Available Team Members</Label>
        <div className="space-y-2">
          {["Alice Johnson", "Bob Smith", "Carol Williams", "David Brown"].map((name, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`reviewer-${idx}`}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <span>{name}</span>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-assign-${idx}`}>
                Assign
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLinkJira = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="jira-ticket">Jira Ticket ID</Label>
        <Input
          id="jira-ticket"
          placeholder="PROJ-1234"
          data-testid="input-jira-ticket"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="work-item">Link to Work Item</Label>
        <Select defaultValue="epic-1">
          <SelectTrigger data-testid="select-link-work-item">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="epic-1">Epic: User Management</SelectItem>
            <SelectItem value="story-1">Story: Profile Page</SelectItem>
            <SelectItem value="req-1">Requirement: API Integration</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="text-sm font-medium mb-2">Existing Links</div>
        <div className="space-y-2">
          {["PROJ-789: Authentication Module", "PROJ-456: Dashboard UI"].map((link, idx) => (
            <div key={idx} className="text-sm text-muted-foreground" data-testid={`existing-link-${idx}`}>
              → {link}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => {
          toast({ title: "Jira Linked", description: "Jira ticket linked successfully!" });
          onOpenChange(false);
        }} data-testid="button-link-jira">
          Link Ticket
        </Button>
      </div>
    </div>
  );

  // Design Phase Actions
  const renderReviewDesign = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Design Assets (4)</h3>
        <Badge>Pending Review</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Homepage Mockup", type: "Figma", status: "new" },
          { name: "Mobile App UI", type: "Sketch", status: "updated" },
          { name: "Brand Guidelines", type: "PDF", status: "new" },
          { name: "Icon Set", type: "SVG", status: "approved" },
        ].map((asset, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-2" data-testid={`design-${idx}`}>
            <div className="font-medium">{asset.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{asset.type}</span>
              <Badge variant={asset.status === "approved" ? "default" : "secondary"}>
                {asset.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-preview-design-${idx}`}>
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
              <Button size="sm" variant="outline" data-testid={`button-approve-design-${idx}`}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUploadDiagram = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="diagram-type">Diagram Type</Label>
        <Select defaultValue="architecture">
          <SelectTrigger data-testid="select-diagram-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="architecture">Architecture Diagram</SelectItem>
            <SelectItem value="flowchart">Flowchart</SelectItem>
            <SelectItem value="sequence">Sequence Diagram</SelectItem>
            <SelectItem value="erd">Entity Relationship</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="diagram-name">Diagram Name</Label>
        <Input
          id="diagram-name"
          placeholder="System Architecture v2.0"
          data-testid="input-diagram-name"
        />
      </div>
      <div className="border-2 border-dashed rounded-lg p-8 text-center" data-testid="upload-area">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your diagram here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PNG, JPG, SVG, PDF (Max 10MB)
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => {
          toast({ title: "Diagram Uploaded", description: "Architecture diagram uploaded successfully!" });
          onOpenChange(false);
        }} data-testid="button-upload-diagram">
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  );

  const renderExportFigma = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="figma-project">Figma Project</Label>
        <Select defaultValue="main">
          <SelectTrigger data-testid="select-figma-project">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Main Design System</SelectItem>
            <SelectItem value="mobile">Mobile App Designs</SelectItem>
            <SelectItem value="marketing">Marketing Assets</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Export Options</Label>
        <div className="space-y-2">
          {[
            { id: "components", label: "UI Components", checked: true },
            { id: "styles", label: "Color Styles", checked: true },
            { id: "icons", label: "Icon Library", checked: false },
            { id: "typography", label: "Typography", checked: true },
          ].map((option, idx) => (
            <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`export-option-${idx}`}>
              <span>{option.label}</span>
              <Switch defaultChecked={option.checked} data-testid={`switch-${option.id}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="text-sm font-medium mb-2">Export Format</div>
        <div className="flex gap-2">
          <Badge>SVG</Badge>
          <Badge>PNG @2x</Badge>
          <Badge>CSS</Badge>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => {
          toast({ title: "Exported to Figma", description: "Design assets exported to Figma successfully!" });
          onOpenChange(false);
        }} data-testid="button-export-figma">
          <Upload className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );

  // Maintenance Phase Actions
  const renderGotoReports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Performance Report", type: "System", date: "Oct 30, 2024" },
          { name: "Security Audit", type: "Security", date: "Oct 28, 2024" },
          { name: "Uptime Analysis", type: "Availability", date: "Oct 25, 2024" },
          { name: "Error Summary", type: "Errors", date: "Oct 22, 2024" },
        ].map((report, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-2" data-testid={`report-${idx}`}>
            <div className="font-medium">{report.name}</div>
            <div className="text-sm text-muted-foreground">{report.type}</div>
            <div className="text-xs text-muted-foreground">{report.date}</div>
            <Button size="sm" variant="outline" className="w-full" data-testid={`button-view-report-${idx}`}>
              <FileText className="mr-1 h-3 w-3" />
              View Report
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => {
          toast({ title: "Reports Dashboard", description: "Opening full reports dashboard..." });
          onOpenChange(false);
        }} data-testid="button-open-reports">
          View All Reports
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (actionType) {
      case "run-cicd":
        return renderRunCICD();
      case "view-test-report":
        return renderTestReport();
      case "publish-package":
        return renderPublishPackage();
      case "trigger-release":
        return renderTriggerRelease();
      case "manage-feature-flags":
        return renderFeatureFlags();
      case "open-monitoring":
        return renderMonitoring();
      case "push-code":
        return renderPushCode();
      case "create-mr":
        return renderCreateMR();
      case "review-code":
        return renderReviewCode();
      case "create-target":
        return renderCreateTarget();
      case "assign-reviewers":
        return renderAssignReviewers();
      case "link-jira":
        return renderLinkJira();
      case "review-design":
        return renderReviewDesign();
      case "upload-diagram":
        return renderUploadDiagram();
      case "export-figma":
        return renderExportFigma();
      case "goto-reports":
        return renderGotoReports();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-cicd-action">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">{getDialogTitle()}</DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
