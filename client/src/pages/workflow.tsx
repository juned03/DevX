import { WorkflowProvider, useWorkflow } from "@/context/workflow-context";
import { StepTracker } from "@/components/workflow/step-tracker";
import { Step1ConversationalRefinement } from "@/components/workflow/step1-conversational-refinement";
import { Step2GeneratedContent } from "@/components/workflow/step2-generated-content";
import { Step3DevOpsPush } from "@/components/workflow/step3-devops-push";
import { ComplianceGuidelinesModal } from "@/components/workflow/compliance-guidelines-modal";
import { PersonaSelectorModal } from "@/components/workflow/persona-selector-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, FileText, Edit2, X, Users as UsersIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSDLCProject } from "@/context/sdlc-project-context";

function WorkflowContent() {
  const { currentStep, resetWorkflow, complianceGuidelines, removeComplianceGuideline, clearComplianceGuidelines, selectedPersonaIds, setSelectedPersonaIds } = useWorkflow();
  const { projectConfig } = useSDLCProject();
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);

  // Show modal automatically on first load if ADO credentials exist
  useEffect(() => {
    if (projectConfig && !hasShownInitialModal && complianceGuidelines.length === 0) {
      setShowGuidelinesModal(true);
      setHasShownInitialModal(true);
    }
  }, [projectConfig, hasShownInitialModal, complianceGuidelines.length]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">AI-Powered SDLC Workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Transform requirements into actionable agile artifacts with AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPersonaModal(true)}
            data-testid={selectedPersonaIds.length > 0 ? "button-edit-personas" : "button-select-personas"}
          >
            {selectedPersonaIds.length > 0 ? (
              <>
                <UsersIcon className="h-4 w-4 mr-2" />
                Edit Personas ({selectedPersonaIds.length})
              </>
            ) : (
              <>
                <UsersIcon className="h-4 w-4 mr-2" />
                Select Personas
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuidelinesModal(true)}
            data-testid={complianceGuidelines.length > 0 ? "button-edit-guidelines" : "button-select-guidelines"}
          >
            {complianceGuidelines.length > 0 ? (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Guidelines
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Select Guidelines
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={resetWorkflow}
            data-testid="button-reset-workflow"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Workflow
          </Button>
        </div>
      </div>

      {/* Selected Personas Display */}
      {selectedPersonaIds.length > 0 && (
        <div className="border rounded-lg p-4 bg-card" data-testid="selected-personas-display">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">
                {selectedPersonaIds.length} Persona{selectedPersonaIds.length > 1 ? 's' : ''} Selected
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPersonaIds([])}
              data-testid="button-clear-all-personas"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPersonaIds.map((personaId) => {
              // In production, fetch persona details from API
              const personaNames: Record<string, string> = {
                "1": "Sarah Chen - Product Manager",
                "2": "Alex Rodriguez - Software Developer",
                "3": "Emily Watson - QA Engineer",
                "4": "Michael Kim - UX Designer"
              };
              return (
                <Badge
                  key={personaId}
                  variant="secondary"
                  className="gap-1 pr-1"
                  data-testid={`badge-persona-${personaId}`}
                >
                  <UsersIcon className="h-3 w-3" />
                  <span>{personaNames[personaId] || `Persona ${personaId}`}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setSelectedPersonaIds(selectedPersonaIds.filter(id => id !== personaId))}
                    data-testid={`button-remove-persona-${personaId}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Compliance Guidelines Display */}
      {complianceGuidelines.length > 0 && (
        <div className="border rounded-lg p-4 bg-card" data-testid="compliance-guidelines-display">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">
                {complianceGuidelines.length} Compliance Guideline{complianceGuidelines.length > 1 ? 's' : ''} Active
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearComplianceGuidelines}
              data-testid="button-clear-all-guidelines"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {complianceGuidelines.map((guideline) => (
              <Badge
                key={guideline.id}
                variant="secondary"
                className="gap-1 pr-1"
                data-testid={`badge-guideline-${guideline.name}`}
              >
                <FileText className="h-3 w-3" />
                <span>{guideline.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeComplianceGuideline(guideline.id)}
                  data-testid={`button-remove-guideline-${guideline.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <StepTracker />

      {currentStep === 1 && <Step1ConversationalRefinement />}
      {currentStep === 2 && <Step2GeneratedContent />}
      {currentStep === 3 && <Step3DevOpsPush />}

      <ComplianceGuidelinesModal
        open={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
      
      <PersonaSelectorModal
        open={showPersonaModal}
        onClose={() => setShowPersonaModal(false)}
        selectedPersonaIds={selectedPersonaIds}
        onConfirm={(ids) => setSelectedPersonaIds(ids)}
      />
    </div>
  );
}

export default function Workflow() {
  return (
    <WorkflowProvider>
      <WorkflowContent />
    </WorkflowProvider>
  );
}
