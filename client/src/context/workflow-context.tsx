import { createContext, useContext, useState, ReactNode } from "react";
import type { 
  Epic, 
  Feature, 
  UserStory, 
  Persona,
  WikiPage,
  ConversationMessage,
  ConversationPhase,
  CapturedRequirements,
  ExportFormat,
} from "@shared/schema";

interface AzureConfig {
  organization: string;
  project: string;
  repository: string;
  branch: string;
  pat?: string;
}

export interface ComplianceGuideline {
  id: string;
  name: string;
  path: string;
  content: string;
}

interface WorkflowContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  sessionId: string;
  
  requirement: string;
  setRequirement: (req: string) => void;
  
  guidelines: string | null;
  setGuidelines: (guidelines: string) => void;
  
  complianceGuidelines: ComplianceGuideline[];
  setComplianceGuidelines: (guidelines: ComplianceGuideline[]) => void;
  addComplianceGuideline: (guideline: ComplianceGuideline) => void;
  removeComplianceGuideline: (id: string) => void;
  clearComplianceGuidelines: () => void;
  
  epics: Epic[];
  setEpics: (epics: Epic[]) => void;
  
  features: Feature[];
  setFeatures: (features: Feature[]) => void;
  
  userStories: UserStory[];
  setUserStories: (stories: UserStory[]) => void;
  
  personas: Persona[];
  setPersonas: (personas: Persona[]) => void;
  
  selectedPersonaIds: string[];
  setSelectedPersonaIds: (ids: string[]) => void;
  
  wikiPages: WikiPage[];
  setWikiPages: (pages: WikiPage[]) => void;
  
  azureConfig: AzureConfig;
  setAzureConfig: (config: AzureConfig) => void;
  
  selectedEpics: Set<string>;
  toggleEpic: (id: string) => void;
  
  selectedFeatures: Set<string>;
  toggleFeature: (id: string) => void;
  
  selectedStories: Set<string>;
  toggleStory: (id: string) => void;
  
  selectedWikiPages: Set<string>;
  toggleWikiPage: (id: string) => void;
  
  selectAll: () => void;
  deselectAll: () => void;
  
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  
  isPushing: boolean;
  setIsPushing: (pushing: boolean) => void;
  
  step1Complete: boolean;
  setStep1Complete: (complete: boolean) => void;
  
  step3Complete: boolean;
  setStep3Complete: (complete: boolean) => void;
  
  // Conversational workflow state
  conversationMessages: ConversationMessage[];
  setConversationMessages: (messages: ConversationMessage[]) => void;
  addConversationMessage: (message: ConversationMessage) => void;
  
  conversationPhase: ConversationPhase;
  setConversationPhase: (phase: ConversationPhase) => void;
  
  capturedRequirements: CapturedRequirements;
  setCapturedRequirements: (requirements: CapturedRequirements) => void;
  updateCapturedRequirements: (updates: Partial<CapturedRequirements>) => void;
  
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  
  isConversationLoading: boolean;
  setIsConversationLoading: (loading: boolean) => void;
  
  summaryConfirmed: boolean;
  setSummaryConfirmed: (confirmed: boolean) => void;
  
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  addUploadedFile: (file: File) => void;
  
  askedQuestions: string[];
  setAskedQuestions: (questions: string[]) => void;
  addAskedQuestion: (question: string) => void;
  
  resetWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const DEFAULT_AZURE_CONFIG: AzureConfig = {
  organization: "",
  project: "",
  repository: "",
  branch: "",
};

const DEFAULT_CAPTURED_REQUIREMENTS: CapturedRequirements = {
  businessGoals: [],
  targetUsers: [],
  keyFeatures: [],
  technicalConstraints: [],
  functionalRequirements: [],
  nonFunctionalRequirements: [],
  edgeCases: [],
  priorityItems: [],
  excludedTopics: [],
  impliedNeeds: [],
};

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [requirement, setRequirement] = useState("");
  const [guidelines, setGuidelines] = useState<string | null>(null);
  const [complianceGuidelines, setComplianceGuidelines] = useState<ComplianceGuideline[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [azureConfig, setAzureConfig] = useState<AzureConfig>(DEFAULT_AZURE_CONFIG);
  const [selectedEpics, setSelectedEpics] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [selectedWikiPages, setSelectedWikiPages] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [step1Complete, setStep1Complete] = useState(false);
  const [step3Complete, setStep3Complete] = useState(false);
  
  // Conversational workflow state
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>("understanding");
  const [capturedRequirements, setCapturedRequirements] = useState<CapturedRequirements>(DEFAULT_CAPTURED_REQUIREMENTS);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("none");
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const toggleEpic = (id: string) => {
    setSelectedEpics(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStory = (id: string) => {
    setSelectedStories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleWikiPage = (id: string) => {
    setSelectedWikiPages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedEpics(new Set(epics.map(e => e.id)));
    setSelectedFeatures(new Set(features.map(f => f.id)));
    setSelectedStories(new Set(userStories.map(s => s.id)));
    setSelectedWikiPages(new Set(wikiPages.map(w => w.id)));
  };

  const deselectAll = () => {
    setSelectedEpics(new Set());
    setSelectedFeatures(new Set());
    setSelectedStories(new Set());
    setSelectedWikiPages(new Set());
  };

  const addConversationMessage = (message: ConversationMessage) => {
    setConversationMessages(prev => [...prev, message]);
  };

  const updateCapturedRequirements = (updates: Partial<CapturedRequirements>) => {
    setCapturedRequirements(prev => ({ ...prev, ...updates }));
  };

  const addUploadedFile = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
  };
  
  const addAskedQuestion = (question: string) => {
    setAskedQuestions(prev => [...prev, question]);
  };

  const addComplianceGuideline = (guideline: ComplianceGuideline) => {
    setComplianceGuidelines(prev => [...prev, guideline]);
  };

  const removeComplianceGuideline = (id: string) => {
    setComplianceGuidelines(prev => prev.filter(g => g.id !== id));
  };

  const clearComplianceGuidelines = () => {
    setComplianceGuidelines([]);
  };

  const resetWorkflow = () => {
    setSessionId(crypto.randomUUID());
    setCurrentStep(1);
    setRequirement("");
    setGuidelines(null);
    setComplianceGuidelines([]);
    setEpics([]);
    setFeatures([]);
    setUserStories([]);
    setPersonas([]);
    setSelectedPersonaIds([]);
    setWikiPages([]);
    setAzureConfig(DEFAULT_AZURE_CONFIG);
    setSelectedEpics(new Set());
    setSelectedFeatures(new Set());
    setSelectedStories(new Set());
    setSelectedWikiPages(new Set());
    setIsGenerating(false);
    setIsPushing(false);
    setStep1Complete(false);
    setStep3Complete(false);
    setConversationMessages([]);
    setConversationPhase("understanding");
    setCapturedRequirements(DEFAULT_CAPTURED_REQUIREMENTS);
    setExportFormat("none");
    setIsConversationLoading(false);
    setSummaryConfirmed(false);
    setUploadedFiles([]);
    setAskedQuestions([]);
  };

  return (
    <WorkflowContext.Provider
      value={{
        sessionId,
        currentStep,
        setCurrentStep,
        requirement,
        setRequirement,
        guidelines,
        setGuidelines,
        complianceGuidelines,
        setComplianceGuidelines,
        addComplianceGuideline,
        removeComplianceGuideline,
        clearComplianceGuidelines,
        epics,
        setEpics,
        features,
        setFeatures,
        userStories,
        setUserStories,
        personas,
        setPersonas,
        selectedPersonaIds,
        setSelectedPersonaIds,
        wikiPages,
        setWikiPages,
        azureConfig,
        setAzureConfig,
        selectedEpics,
        toggleEpic,
        selectedFeatures,
        toggleFeature,
        selectedStories,
        toggleStory,
        selectedWikiPages,
        toggleWikiPage,
        selectAll,
        deselectAll,
        isGenerating,
        setIsGenerating,
        isPushing,
        setIsPushing,
        step1Complete,
        setStep1Complete,
        step3Complete,
        setStep3Complete,
        conversationMessages,
        setConversationMessages,
        addConversationMessage,
        conversationPhase,
        setConversationPhase,
        capturedRequirements,
        setCapturedRequirements,
        updateCapturedRequirements,
        exportFormat,
        setExportFormat,
        isConversationLoading,
        setIsConversationLoading,
        summaryConfirmed,
        setSummaryConfirmed,
        uploadedFiles,
        setUploadedFiles,
        addUploadedFile,
        askedQuestions,
        setAskedQuestions,
        addAskedQuestion,
        resetWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
