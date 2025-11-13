import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { SearchBar } from "@/components/search-bar";
import { DomainProvider } from "@/contexts/domain-context";
import { SDLCProjectProvider } from "@/context/sdlc-project-context";
import { SettingsProvider } from "@/contexts/settings-context";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Organizations from "@/pages/organizations";
import Projects from "@/pages/projects";
import GoldenRepos from "@/pages/golden-repos";
import GoldenRepoPreview from "@/pages/golden-repo-preview";
import CloudIntegration from "@/pages/cloud-integration";
import Workflow from "@/pages/workflow";
import SDLCPage from "@/pages/sdlc";
import ConversationalUI from "@/pages/conversational-ui";
import Settings from "@/pages/settings";
import HubArtifacts from "@/pages/hub-artifacts";
import HubIntegrations from "@/pages/hub-integrations";
import HubKnowledgeBase from "@/pages/hub-knowledge-base";
import HubPersonas from "@/pages/hub-personas";
import HubPrompts from "@/pages/hub-prompts";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/overview" component={Dashboard} />
      <Route path="/organizations" component={Organizations} />
      <Route path="/projects" component={Projects} />
      <Route path="/golden-repos" component={GoldenRepos} />
      <Route path="/golden-repos/preview" component={GoldenRepoPreview} />
      <Route path="/cloud-integration" component={CloudIntegration} />
      <Route path="/workflow" component={Workflow} />
      <Route path="/sdlc" component={SDLCPage} />
      <Route path="/chat" component={ConversationalUI} />
      <Route path="/hub/artifacts" component={HubArtifacts} />
      <Route path="/hub/integrations" component={HubIntegrations} />
      <Route path="/hub/knowledge-base" component={HubKnowledgeBase} />
      <Route path="/hub/personas" component={HubPersonas} />
      <Route path="/hub/prompts" component={HubPrompts} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <DomainProvider>
          <SDLCProjectProvider>
            <ThemeProvider defaultTheme="dark">
              <TooltipProvider>
                <Switch>
                  {/* Landing page - no sidebar */}
                  <Route path="/">
                    <Landing />
                  </Route>
                  
                  {/* All other routes - with sidebar */}
                  <Route>
                    <SidebarProvider style={style as React.CSSProperties}>
                      <div className="flex h-screen w-full">
                        <AppSidebar />
                        <div className="flex flex-1 flex-col">
                          <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
                            <div className="flex items-center gap-4">
                              <SidebarTrigger data-testid="button-sidebar-toggle" />
                              <SearchBar />
                            </div>
                            <div className="flex items-center gap-3">
                              <ThemeToggle />
                              <UserMenu name="Amy Stone" role="Premium Account" />
                            </div>
                          </header>
                          <main className="flex-1 overflow-auto">
                            <Router />
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </Route>
                </Switch>
                <Toaster />
                <HotToaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "hsl(var(--background))",
                      color: "hsl(var(--foreground))",
                      border: "1px solid hsl(var(--border))",
                    },
                  }}
                />
              </TooltipProvider>
            </ThemeProvider>
          </SDLCProjectProvider>
        </DomainProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
