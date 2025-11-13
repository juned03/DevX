import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Workflow, Database, Sparkles, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Brand */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">DevPlatform</h1>
          </div>

          {/* Headline */}
          <h2 className="mb-6 text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
            Streamline Your SDLC with{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Development
          </h2>

          {/* Subheadline */}
          <p className="mb-10 text-xl text-muted-foreground">
            A multi-tenant platform that transforms requirements into agile artifacts,
            integrates seamlessly with Azure DevOps, and accelerates your development workflow.
          </p>

          {/* CTA Button */}
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="group gap-2" data-testid="button-get-started" asChild>
              <Link href="/overview">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" data-testid="button-view-demo" asChild>
              <Link href="/overview">
                View Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 max-w-6xl">
          <h3 className="mb-12 text-center text-3xl font-bold">
            Everything You Need to Build Better Software
          </h3>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-lg border bg-card p-6 transition-all hover-elevate">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 text-xl font-semibold">AI-Powered Workflow</h4>
              <p className="text-muted-foreground">
                Transform requirements into detailed epics, features, and user stories with our intelligent AI assistant.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-lg border bg-card p-6 transition-all hover-elevate">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 text-xl font-semibold">Azure DevOps Integration</h4>
              <p className="text-muted-foreground">
                Seamlessly sync with Azure DevOps to manage work items, repositories, and pipelines.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-lg border bg-card p-6 transition-all hover-elevate">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 text-xl font-semibold">SDLC Phase Management</h4>
              <p className="text-muted-foreground">
                Track progress through all 6 phases with automated unlocking and real-time progress calculation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-lg border bg-card p-6 transition-all hover-elevate">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 text-xl font-semibold">Enterprise Security</h4>
              <p className="text-muted-foreground">
                AES-256-GCM encryption for credentials, comprehensive validation, and secure data isolation.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-lg border bg-card p-6 transition-all hover-elevate">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 text-xl font-semibold">Golden Repository Templates</h4>
              <p className="text-muted-foreground">
                Access pre-configured repositories across 5 business domains with live ADO integration.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-lg border bg-card p-6 transition-all hover-elevate">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 text-xl font-semibold">Real-Time Collaboration</h4>
              <p className="text-muted-foreground">
                Multi-tenant architecture with comprehensive Hub features for teams and organizations.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mx-auto mt-24 max-w-5xl rounded-2xl border bg-card/50 p-12">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">80%</div>
              <div className="text-muted-foreground">Faster Artifact Generation</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">6</div>
              <div className="text-muted-foreground">Automated SDLC Phases</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Azure DevOps Compatible</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mx-auto mt-24 max-w-3xl text-center">
          <h3 className="mb-4 text-3xl font-bold">Ready to Transform Your Development Process?</h3>
          <p className="mb-8 text-lg text-muted-foreground">
            Join teams that are building better software faster with DevPlatform.
          </p>
          <Button size="lg" className="group gap-2" data-testid="button-get-started-bottom" asChild>
            <Link href="/overview">
              Get Started Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 DevPlatform. Multi-tenant web development platform for enterprise teams.</p>
        </div>
      </footer>
    </div>
  );
}
