import { useEffect, useState, useRef } from "react";
import { nanoid } from "nanoid";
import { History, MessageCircle, Send, Bot, User, Paperclip, Sparkles, MessageSquarePlus, Loader2 } from "lucide-react";
import { useWorkflow } from "@/context/workflow-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Users, Zap, Target, Package } from "lucide-react";
import type { ConversationMessage, ConversationPhase } from "@shared/schema";

export function Step1ConversationalRefinement() {
  const {
    conversationMessages,
    addConversationMessage,
    conversationPhase,
    setConversationPhase,
    capturedRequirements,
    updateCapturedRequirements,
    isConversationLoading,
    setIsConversationLoading,
    askedQuestions,
    addAskedQuestion,
    uploadedFiles,
    addUploadedFile,
    setCurrentStep,
    setStep1Complete,
    setRequirement,
    setGuidelines,
    setEpics,
    setFeatures,
    setUserStories,
    setPersonas,
    complianceGuidelines,
    selectedPersonaIds,
  } = useWorkflow();

  const { toast } = useToast();
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");

  // Initialize conversation with welcome message
  useEffect(() => {
    if (conversationMessages.length === 0) {
      const welcomeMessage: ConversationMessage = {
        id: nanoid(),
        role: "assistant",
        content: `Hello! I'm Tia Bot, your agile backlog assistant.\n\nI'll help you create detailed epics, user stories, and tasks through a collaborative conversation. I'll ask thoughtful questions to understand your project deeply, building on everything you share to create high-quality, actionable artifacts.\n\nReady to get started? Tell me about your project!`,
        timestamp: new Date(),
      };
      addConversationMessage(welcomeMessage);
    }
  }, [conversationMessages.length, addConversationMessage]);

  const handleSendMessage = async (message: string) => {
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: nanoid(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    addConversationMessage(userMessage);

    // Call conversation API with the new message included
    // (quick replies will be cleared in getNextQuestion)
    await getNextQuestion(userMessage);
  };

  const handleQuickReply = async (reply: string) => {
    // Clear quick replies immediately when user selects one
    setQuickReplies([]);
    // Treat quick reply as a regular message
    await handleSendMessage(reply);
  };

  const getNextQuestion = async (latestUserMessage: ConversationMessage) => {
    try {
      setIsConversationLoading(true);
      // Clear previous quick replies immediately when fetching new question
      setQuickReplies([]);

      // Prepare conversation history for API - INCLUDE the latest user message
      const conversationHistory = [
        ...conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: latestUserMessage.role,
          content: latestUserMessage.content,
        },
      ];

      // Call conversation API with askedQuestions to prevent repetition
      const res = await apiRequest("POST", "/api/workflow/conversation", {
        conversationHistory,
        capturedRequirements,
        currentPhase: conversationPhase,
        askedQuestions,
      });
      
      const response: {
        question: string;
        phase: string;
        quickReplies?: string[];
        capturedInfo?: any;
        readyToGenerate?: boolean;
      } = await res.json();

      // Check if AI determined we have enough information to generate artifacts
      if (response.readyToGenerate) {
        // Add final message to conversation
        const finalMessage: ConversationMessage = {
          id: nanoid(),
          role: "assistant",
          content: response.question,
          timestamp: new Date(),
        };
        addConversationMessage(finalMessage);
        
        // Show choice dialog instead of auto-transitioning
        setShowChoiceDialog(true);
        
        return; // Exit early, don't continue with normal flow
      }

      // Update phase if changed
      if (response.phase && response.phase !== conversationPhase) {
        setConversationPhase(response.phase as any);
      }

      // Update captured requirements if new info was extracted
      if (response.capturedInfo) {
        const updates: any = {};
        
        // Normalize function: convert objects to strings
        const normalizeItem = (item: any): string => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            // Extract meaningful string from object
            return item.persona || item.name || item.role || item.description || JSON.stringify(item);
          }
          return String(item);
        };
        
        // Merge arrays for each field
        Object.entries(response.capturedInfo).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            const existing = (capturedRequirements as any)[key] || [];
            // Normalize new items to strings
            const normalizedNewItems = value.map(normalizeItem);
            // Add only new items (avoid duplicates) - now comparing strings
            const newItems = normalizedNewItems.filter((item: string) => !existing.includes(item));
            if (newItems.length > 0) {
              updates[key] = [...existing, ...newItems];
            }
          }
        });

        if (Object.keys(updates).length > 0) {
          updateCapturedRequirements(updates);
        }
      }

      // Set quick replies if provided
      if (response.quickReplies && response.quickReplies.length > 0) {
        setQuickReplies(response.quickReplies);
      }

      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        id: nanoid(),
        role: "assistant",
        content: response.question,
        timestamp: new Date(),
        quickReplies: response.quickReplies,
      };
      addConversationMessage(aiMessage);
      
      // Track this question to prevent repetition
      addAskedQuestion(response.question);
    } catch (error) {
      console.error("Error getting next question:", error);
      toast({
        title: "Error",
        description: "Failed to get next question. Please try again.",
        variant: "destructive",
      });

      // Add error message to conversation
      const errorMessage: ConversationMessage = {
        id: nanoid(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Could you please try sending that again?",
        timestamp: new Date(),
      };
      addConversationMessage(errorMessage);
    } finally {
      setIsConversationLoading(false);
    }
  };

  // Handler for generating artifacts when user chooses to proceed
  const handleGenerateArtifacts = async () => {
    try {
      setIsGenerating(true);
      setShowChoiceDialog(false);
      setGenerationProgress(0);
      setGenerationStep("Preparing requirements...");
      
      // Prepare comprehensive requirement text from conversation and captured data
      const conversationContext = conversationMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n");

      const capturedInfo = `
Business Goals: ${capturedRequirements.businessGoals.join(", ") || "Not specified"}
Target Users: ${capturedRequirements.targetUsers.join(", ") || "Not specified"}
Key Features: ${capturedRequirements.keyFeatures.join(", ") || "Not specified"}
Technical Constraints: ${capturedRequirements.technicalConstraints.join(", ") || "Not specified"}
Functional Requirements: ${capturedRequirements.functionalRequirements.join(", ") || "Not specified"}
Non-Functional Requirements: ${capturedRequirements.nonFunctionalRequirements.join(", ") || "Not specified"}
Edge Cases: ${capturedRequirements.edgeCases.join(", ") || "Not specified"}
Priority Items: ${capturedRequirements.priorityItems.join(", ") || "Not specified"}
      `.trim();

      const requirementText = `${conversationContext}\n\n=== Captured Requirements ===\n${capturedInfo}`;

      // CRITICAL: Save requirement to workflow context for wiki generation in Step 2
      setRequirement(requirementText);

      // Step 1: Generate AI Design Guidelines (50% progress)
      setGenerationProgress(10);
      setGenerationStep("Generating AI Design Guidelines...");

      const guidelinesRes = await apiRequest("POST", "/api/workflow/generate-guidelines", {
        input: requirementText,
      });
      const guidelinesData = await guidelinesRes.json();
      setGuidelines(guidelinesData.guidelines);
      
      setGenerationProgress(50);
      setGenerationStep("Guidelines created! Now generating artifacts...");

      // Step 2: Generate Agile Artifacts (50% progress)
      setGenerationProgress(60);
      setGenerationStep("Generating Epics, Features, and User Stories...");

      const artifactsRes = await apiRequest("POST", "/api/workflow/generate-artifacts", {
        requirement: requirementText,
        complianceGuidelines,
        selectedPersonaIds,
      });
      const artifactsData = await artifactsRes.json();
      
      setEpics(artifactsData.epics || []);
      setFeatures(artifactsData.features || []);
      setUserStories(artifactsData.userStories || []);
      setPersonas(artifactsData.personas || []);

      setGenerationProgress(90);
      setGenerationStep("Finalizing artifacts...");

      // Mark step 1 as complete and transition to step 2
      setStep1Complete(true);
      setGenerationProgress(100);
      setGenerationStep("Complete! Redirecting...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(2);

      toast({
        title: "Success!",
        description: "Artifacts generated successfully.",
      });
    } catch (error) {
      console.error("Error generating artifacts:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate artifacts. Please try again.",
        variant: "destructive",
      });
      setShowChoiceDialog(true); // Re-show dialog on error
      setGenerationProgress(0);
      setGenerationStep("");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler for continuing to refine requirements
  const handleContinueRefining = () => {
    setShowChoiceDialog(false);
    
    // Add a message to indicate we're continuing
    const continueMessage: ConversationMessage = {
      id: nanoid(),
      role: "assistant",
      content: "Great! Let's continue refining your requirements. What else would you like to discuss or clarify?",
      timestamp: new Date(),
    };
    addConversationMessage(continueMessage);
    
    toast({
      title: "Continuing Conversation",
      description: "Let's gather more details to make your artifacts even better!",
    });
  };

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages, isConversationLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isConversationLoading) return;
    handleSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => addUploadedFile(file));
    }
  };

  // Phase data for context panel
  const PHASES = [
    { id: "understanding", title: "Understanding Requirements", description: "Gathering business goals", icon: <Target className="h-4 w-4" /> },
    { id: "refining", title: "Refining Details", description: "Exploring features and constraints", icon: <Zap className="h-4 w-4" /> },
    { id: "personas", title: "Creating Personas", description: "Identifying user types", icon: <Users className="h-4 w-4" /> },
    { id: "artifacts", title: "Generating Artifacts", description: "Finalizing requirements", icon: <Package className="h-4 w-4" /> },
  ];

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === conversationPhase);
  const progressPercentage = ((currentPhaseIndex + 1) / PHASES.length) * 100;

  const getPhaseStatus = (phaseId: ConversationPhase) => {
    const phaseIndex = PHASES.findIndex((p) => p.id === phaseId);
    if (phaseIndex < currentPhaseIndex) return "completed";
    if (phaseIndex === currentPhaseIndex) return "current";
    return "pending";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] h-[calc(100vh-12rem)] gap-4">
      {/* Left Panel: Chat (60%) */}
      <div className="relative flex flex-col bg-background rounded-2xl shadow-lg border overflow-hidden">
        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 px-4 md:px-8" ref={scrollRef}>
        <div className="mx-auto max-w-4xl space-y-6 py-8">
          {conversationMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              data-testid={`message-${message.role}-${message.id}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-10 w-10 shrink-0 shadow-md" data-testid="avatar-assistant">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-md",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-['Inter']">
                  {message.content}
                </p>
                <p className="mt-2 text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <Avatar className="h-10 w-10 shrink-0 shadow-md" data-testid="avatar-user">
                  <AvatarFallback className="bg-muted">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isConversationLoading && (
            <div className="flex gap-3 md:gap-4 animate-in fade-in duration-300" data-testid="typing-indicator">
              <Avatar className="h-10 w-10 shrink-0 shadow-md">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl bg-card border px-5 py-4 shadow-md">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Reply Chips */}
      {quickReplies && quickReplies.length > 0 && !isConversationLoading && (
        <div className="border-t bg-muted/30 px-4 md:px-8 py-4">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick replies:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply)}
                  data-testid={`quick-reply-${index}`}
                  className="rounded-full hover-elevate active-elevate-2 shadow-sm"
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background px-4 md:px-8 py-6 shadow-lg">
        <div className="mx-auto max-w-4xl flex gap-3 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            data-testid="input-file-upload"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isConversationLoading}
            data-testid="button-attach-file"
            className="shrink-0 rounded-full shadow-sm hover-elevate"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your query…"
            disabled={isConversationLoading}
            data-testid="input-message"
            className="min-h-[48px] max-h-[120px] resize-none rounded-2xl shadow-sm font-['Inter'] text-base"
            rows={1}
          />

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isConversationLoading}
            data-testid="button-send-message"
            className="shrink-0 rounded-full h-12 w-12 shadow-md"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

        {/* Conversation History Button (Floating in left panel) */}
        <div className="absolute right-4 md:right-6 top-4 z-10">
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                data-testid="button-view-history"
                className="h-12 w-12 rounded-full shadow-lg hover-elevate active-elevate-2 bg-background"
              >
                <History className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Conversation History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {conversationMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start a conversation to see your history.
                  </p>
                ) : (
                  conversationMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 items-start",
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                      data-testid={`history-message-${message.role}-${message.id}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className={message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                          {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "flex-1 rounded-xl px-4 py-3 shadow-sm",
                        message.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-card border"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-2 text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Right Panel: Context & Progress (40%) */}
      <div className="hidden lg:flex flex-col bg-background rounded-2xl shadow-lg border overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Context & Progress
          </h2>
        </div>
        
        <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                {/* Progress Tracker */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Progress</h3>
                    <Badge variant="outline" className="text-xs">
                      {currentPhaseIndex + 1}/{PHASES.length}
                    </Badge>
                  </div>
                  <Progress value={progressPercentage} className="h-3" data-testid="progress-bar" />
                  
                  <div className="space-y-2.5">
                    {PHASES.map((phase) => {
                      const status = getPhaseStatus(phase.id as ConversationPhase);
                      return (
                        <div
                          key={phase.id}
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-lg transition-all border",
                            status === "current" && "bg-primary/5 border-primary/30 shadow-sm",
                            status === "completed" && "border-primary/20",
                            status === "pending" && "border-muted"
                          )}
                          data-testid={`phase-${phase.id}`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className={cn("h-5 w-5", status === "current" ? "text-primary fill-primary/20" : "text-muted-foreground")} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={cn(status === "current" && "text-primary")}>
                                {phase.icon}
                              </div>
                              <p className={cn("text-sm font-semibold truncate", status === "current" && "text-primary")}>
                                {phase.title}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Captured Insights */}
                <div className="space-y-5">
                  <h3 className="text-base font-semibold">Captured Insights</h3>
                  
                  {capturedRequirements.businessGoals.length === 0 && 
                   capturedRequirements.targetUsers.length === 0 && 
                   capturedRequirements.keyFeatures.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Target className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No insights captured yet
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Start the conversation to see requirements here
                      </p>
                    </div>
                  ) : (
                    <>
                      {capturedRequirements.businessGoals.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-semibold">Business Goals</p>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {capturedRequirements.businessGoals.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {capturedRequirements.businessGoals.map((goal, index) => (
                              <Badge key={index} variant="default" className="text-xs px-3 py-1" data-testid={`goal-${index}`}>
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {capturedRequirements.targetUsers.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-semibold">Target Users</p>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {capturedRequirements.targetUsers.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {capturedRequirements.targetUsers.map((user, index) => (
                              <Badge key={index} variant="default" className="text-xs px-3 py-1" data-testid={`user-${index}`}>
                                {user}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {capturedRequirements.keyFeatures.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-semibold">Key Features</p>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {capturedRequirements.keyFeatures.length}
                            </Badge>
                          </div>
                          <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                            {capturedRequirements.keyFeatures.map((feature, index) => (
                              <div key={index} className="text-xs flex items-start gap-2" data-testid={`feature-${index}`}>
                                <span className="text-primary mt-0.5">•</span>
                                <span className="flex-1">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
        </ScrollArea>
      </div>

      {/* Progress Overlay During Generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <h3 className="font-semibold text-lg">Generating Artifacts</h3>
                <p className="text-sm text-muted-foreground">{generationStep}</p>
              </div>
              
              <div className="space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {generationProgress}% complete
                </p>
              </div>
              
              <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg p-3">
                This process typically takes 30-70 seconds. Please don't close this window.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Choice Dialog - Generate or Continue Refining */}
      <Dialog open={showChoiceDialog} onOpenChange={setShowChoiceDialog}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-choice">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Ready to Generate Artifacts?
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              I've gathered comprehensive information about your project. You can now:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-3">
              {/* Generate Artifacts Option */}
              <Button
                onClick={handleGenerateArtifacts}
                disabled={isGenerating}
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 text-left"
                data-testid="button-generate-artifacts"
              >
                {isGenerating ? (
                  <>
                    <div className="flex items-center gap-2 w-full">
                      <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                      <span className="font-semibold">Generating Artifacts...</span>
                    </div>
                    <span className="text-xs text-primary-foreground/80 leading-relaxed">
                      This may take a minute. Please wait...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 w-full">
                      <Sparkles className="h-5 w-5 flex-shrink-0" />
                      <span className="font-semibold">Generate Artifacts Now</span>
                    </div>
                    <span className="text-xs text-primary-foreground/90 leading-relaxed">
                      Create AI Design Guidelines, Epics, Features, User Stories, and Personas
                    </span>
                  </>
                )}
              </Button>

              {/* Continue Refining Option */}
              <Button
                variant="outline"
                onClick={handleContinueRefining}
                disabled={isGenerating}
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 text-left"
                data-testid="button-continue-refining"
              >
                <div className="flex items-center gap-2 w-full">
                  <MessageSquarePlus className="h-5 w-5 flex-shrink-0" />
                  <span className="font-semibold">Continue Refining</span>
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Keep the conversation going to add more details
                </span>
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">💡 Tip:</p>
              <p>
                The more details you provide, the more accurate and comprehensive your artifacts will be.
                You can always generate now and refine later!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
