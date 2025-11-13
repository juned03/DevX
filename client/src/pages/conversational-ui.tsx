import { useState } from "react";
import { Send, Mic, Paperclip, History, FileText, Bot, User, X, Cloud, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ============================================
// TYPE DEFINITIONS
// ============================================

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ContextItem = {
  id: string;
  name: string;
  type: string;
};

export default function ConversationalUI() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const { toast } = useToast();
  
  // Current input value
  const [input, setInput] = useState("");
  
  // Chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your Agile Story Assistant, here to help you create user stories, backlogs, tasks, and subtasks.

Let's make your backlog awesome! 🚀`,
      timestamp: new Date(),
    },
  ]);
  
  // Loading state for AI responses
  const [isLoading, setIsLoading] = useState(false);
  
  // Popup panel visibility states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  
  // Sample context items
  const [contextItems] = useState<ContextItem[]>([
    { id: "1", name: "Project Requirements.pdf", type: "Document" },
    { id: "2", name: "Database Schema", type: "Schema" },
    { id: "3", name: "API Endpoints", type: "Code" },
  ]);

  // Check if Azure DevOps integration is configured (using client settings)
  const { data: artifactOrgsData } = useQuery<{ 
    organizations: Array<{
      id: string;
      organizationUrl: string;
      projectName: string;
      patConfigured: boolean;
    }> 
  }>({
    queryKey: ['/api/artifact-organizations'],
  });

  // Check if ADO is fully configured (use first organization from client settings)
  const firstOrg = artifactOrgsData?.organizations?.[0];
  const hasAdoIntegration = !!(firstOrg?.patConfigured && firstOrg?.organizationUrl && firstOrg?.projectName);

  // ============================================
  // MESSAGE HANDLING
  // ============================================
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare messages for API (exclude system message, only user and assistant)
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content.replace(/\[CREATE_IN_ADO\]/g, '') // Remove marker from conversation history
      }));

      // Call backend API to chat with Azure AI Foundry
      const response = await apiRequest("POST", "/api/chat", {
        messages: conversationMessages
      });

      const data = await response.json() as { 
        message: string; 
        usage?: any;
        workItemCreated?: boolean;
        workItemId?: number;
      };

      // Create assistant message from response (keep the marker for button detection)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show success toast if work item was created (in case it happens without button click)
      if (data.workItemCreated && data.workItemId) {
        toast({
          title: "Success!",
          description: `Work item #${data.workItemId} created successfully in Azure DevOps`,
        });
      }
    } catch (error) {
      console.error("Error calling chat API:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from Tia Bot. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. Please check your Azure AI Foundry configuration and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating work item in ADO
  const handleCreateInADO = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setIsLoading(true);

    try {
      // Extract story details from the message content
      // For now, we'll let the AI do this by sending a follow-up message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: "Create this story in Azure DevOps",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Prepare conversation for API
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content.replace(/\[CREATE_IN_ADO\]/g, '')
      }));

      const response = await apiRequest("POST", "/api/chat", {
        messages: conversationMessages
      });

      const data = await response.json() as { 
        message: string;
        workItemCreated?: boolean;
        workItemId?: number;
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Only show success if the backend confirms work item was created
      if (data.workItemCreated && data.workItemId) {
        toast({
          title: "Success!",
          description: `Work item #${data.workItemId} created successfully in Azure DevOps`,
        });
      }
      // If not success, the assistant message will explain what happened
      // (e.g., asking for more info, reporting an error, etc.)
    } catch (error) {
      console.error("Error creating work item:", error);
      toast({
        title: "Error",
        description: "Failed to create work item in Azure DevOps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="relative flex h-full flex-col bg-background">
      
      {/* ============================================
          MAIN CHAT AREA
          Displays conversation messages
          ============================================ */}
      <div className="relative flex-1 overflow-hidden">
        {/* ADO Integration Indicator */}
        {hasAdoIntegration && (
          <div className="border-b px-4 md:px-6 py-2 bg-muted/30">
            <Badge variant="secondary" className="gap-1.5" data-testid="badge-ado-integration">
              <Cloud className="h-3 w-3" />
              Azure DevOps Connected
            </Badge>
          </div>
        )}
        
        <ScrollArea className="h-full px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-6 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                data-testid={`message-${message.role}-${message.id}`}
              >
                {/* AI Avatar - left side for assistant */}
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  )}
                >
                  {/* Extract ADO URL if present */}
                  {(() => {
                    const adoUrlRegex = /\[ADO_URL:(https:\/\/[^\]]+)\]/;
                    const adoUrlMatch = message.content.match(adoUrlRegex);
                    const contentWithoutMarkers = message.content
                      .replace(/\[CREATE_IN_ADO\]/g, '')
                      .replace(adoUrlRegex, '')
                      .trim();

                    return (
                      <>
                        {/* Markdown content */}
                        <div className={cn(
                          "text-sm leading-relaxed prose prose-sm max-w-none",
                          message.role === "user" 
                            ? "prose-invert" 
                            : "prose-slate dark:prose-invert"
                        )}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {contentWithoutMarkers}
                          </ReactMarkdown>
                        </div>

                        {/* ADO URL Button - Show when URL marker is present */}
                        {message.role === "assistant" && adoUrlMatch && (
                          <div className="mt-4 pt-3 border-t">
                            <Button
                              onClick={() => window.open(adoUrlMatch[1], '_blank')}
                              variant="outline"
                              className="w-full"
                              data-testid="button-view-in-ado"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View in Azure DevOps
                            </Button>
                          </div>
                        )}

                        {/* Create in ADO Button - Show when marker is present */}
                        {message.role === "assistant" && message.content.includes('[CREATE_IN_ADO]') && (
                          <div className={cn("mt-4 pt-3 border-t", adoUrlMatch && "border-t-0 pt-0 mt-2")}>
                            <Button
                              onClick={() => handleCreateInADO(message.id)}
                              disabled={isLoading}
                              className="w-full"
                              data-testid="button-create-in-ado"
                            >
                              <Cloud className="h-4 w-4 mr-2" />
                              Create Story in Azure DevOps
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  <p className="mt-2 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* User Avatar - right side for user */}
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-4 justify-start animate-in fade-in" data-testid="loading-indicator">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ============================================
            FLOATING BUTTONS - RIGHT SIDE (MIDDLE)
            Conversation History and Context buttons
            ============================================ */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          
          {/* Conversation History Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg hover-elevate bg-card"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            data-testid="button-conversation-history"
          >
            <History className="h-5 w-5" />
          </Button>

          {/* Context Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg hover-elevate bg-card"
            onClick={() => setIsContextOpen(!isContextOpen)}
            data-testid="button-context"
          >
            <FileText className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ============================================
          COLLAPSIBLE POPUP PANEL - CONVERSATION HISTORY
          Slides in from the right
          ============================================ */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-card border-l shadow-2xl z-20 transition-transform duration-300 ease-in-out",
          isHistoryOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">Conversation History</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHistoryOpen(false)}
              data-testid="button-close-history"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* History List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.filter(m => m.role === "user").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversation history yet
                </p>
              ) : (
                messages
                  .filter(m => m.role === "user")
                  .map((message) => (
                    <div
                      key={message.id}
                      className="rounded-lg border p-3 hover-elevate cursor-pointer"
                      data-testid={`history-item-${message.id}`}
                    >
                      <p className="text-sm line-clamp-2">{message.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {message.timestamp.toLocaleString()}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ============================================
          COLLAPSIBLE POPUP PANEL - CONTEXT
          Slides in from the right
          ============================================ */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-card border-l shadow-2xl z-20 transition-transform duration-300 ease-in-out",
          isContextOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">Context & References</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsContextOpen(false)}
              data-testid="button-close-context"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Context List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {contextItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover-elevate cursor-pointer"
                  data-testid={`context-item-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ============================================
          FLOATING INPUT BAR (BOTTOM)
          Text input, microphone, attachment, and send button
          ============================================ */}
      <div className="border-t bg-card px-4 py-4 md:px-6 shadow-2xl">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-lg">
            
            {/* Attachment Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full hover-elevate"
              data-testid="button-attachment"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Text Input Field */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your query…"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              data-testid="input-chat-message"
            />

            {/* Voice Input Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full hover-elevate"
              data-testid="button-voice-input"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full shadow-sm"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
