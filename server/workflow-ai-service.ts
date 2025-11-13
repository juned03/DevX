import OpenAI from "openai";
import { AzureOpenAI } from "openai";

const useAzure =
  process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT;

const openai = useAzure
  ? new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-01",
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    })
  : new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });

/**
 * PRODUCTION-GRADE SDLC WORKFLOW AGENT - COMPREHENSIVE VERSION
 * 
 * Features:
 * 1. Complete preservation of quality standards and guidelines
 * 2. Advanced context awareness and memory
 * 3. Semantic duplicate detection
 * 4. Intelligent topic progression
 * 5. Response history analysis
 * 6. Conversational warmth maintained
 */

interface RequirementsContext {
  businessGoals: string[];
  keyFeatures: string[];
  targetUsers: string[];
  functionalRequirements: string[];
  technicalConstraints: string[];
  nonFunctionalRequirements: string[];
  successMetrics: string[];
  userWorkflows: string[];
  integrations: string[];
  scopeBoundaries: { inScope: string[]; outOfScope: string[] };
}

interface ConversationState {
  currentFocus: string;
  depthLevel: number;
  lastTopicExhausted: boolean;
  suggestedNextTopics: string[];
  categoryCoverage: Record<string, number>;
  shouldSwitchTopic: boolean;
  responseHistory: ResponseAnalysis[];
}

interface ResponseAnalysis {
  userMessage: string;
  extractedInfo: string[];
  topicsCovered: string[];
  timestamp: number;
}

interface QuestionHistory {
  question: string;
  category: string;
  keywords: Set<string>;
  userResponse?: string;
  infoExtracted?: string[];
}

async function fetchBacklogContext(): Promise<string> {
  try {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:5000";
    const response = await fetch(`${baseUrl}/api/ado-settings/backlog`);
    
    if (!response.ok) {
      console.log("[Workflow AI] ADO backlog not available (optional)");
      return "";
    }
    
    const data = await response.json();
    
    if (!data.success || !data.backlog || data.backlog.length === 0) {
      console.log("[Workflow AI] No existing backlog items found");
      return "";
    }
    
    const summary = `## EXISTING AZURE DEVOPS BACKLOG CONTEXT

**Current Backlog Summary:**
- **Total Epics:** ${data.counts.epics} (${data.counts.epics - (data.counts.closedEpics || 0)} Active)
- **Total Features:** ${data.counts.features} (${data.counts.features - (data.counts.closedFeatures || 0)} Active)
- **Total User Stories:** ${data.counts.userStories} (${data.counts.userStories - (data.counts.closedStories || 0)} Active)
- **Total Tasks:** ${data.counts.tasks}
- **Total Bugs:** ${data.counts.bugs}

### EXISTING EPICS (Top 10 by Priority):
${data.grouped.epics.slice(0, 10).map((epic: any) => `
**Epic #${epic.id}: ${epic.title}**
- State: ${epic.state} | Priority: ${epic.priority || 'N/A'}
- Description: ${epic.description?.substring(0, 150) || 'No description'}...
- Tags: ${epic.tags || 'None'}
- Child Features: ${epic.childFeatures?.length || 0}
`).join('\n') || 'No epics found'}

### EXISTING FEATURES (Top 10 by Priority):
${data.grouped.features.slice(0, 10).map((feature: any) => `
**Feature #${feature.id}: ${feature.title}** ${feature.parentEpic ? `(Epic #${feature.parentEpic})` : ''}
- State: ${feature.state} | Priority: ${feature.priority || 'N/A'}
- Description: ${feature.description?.substring(0, 150) || 'No description'}...
- User Stories: ${feature.childStories?.length || 0}
`).join('\n') || 'No features found'}

### EXISTING USER STORIES (Recent 20):
${data.grouped.userStories.slice(0, 20).map((story: any) => `
**Story #${story.id}:** ${story.title} ${story.parentFeature ? `(Feature #${story.parentFeature})` : ''}
- State: ${story.state} | Priority: ${story.priority || 'N/A'} | Story Points: ${story.storyPoints || 'N/A'}
`).join('\n') || 'No user stories found'}

---

## CRITICAL BACKLOG AWARENESS RULES:

### 1. PROACTIVE DUPLICATE DETECTION
- Before exploring any new capability, CHECK if similar epics/features exist
- When user mentions functionality, immediately reference existing related work
- Example: "I notice you have Epic #123 'Customer Portal Enhancement'. Does this relate to that?"

### 2. INTELLIGENT ALIGNMENT SUGGESTIONS
- Suggest adding to existing epics/features when appropriate
- Ask: "Should this be part of existing Feature #456, or a new feature?"
- Respect existing hierarchy and organization patterns

### 3. GAP IDENTIFICATION
- Notice missing components in existing epics/features
- Example: "Your 'User Onboarding' feature has registration but no password recovery. Should we add that?"
- Suggest completing partial implementations

### 4. PRIORITY & TAG CONSISTENCY
- Align new work with existing priority patterns
- Adopt existing tagging conventions
- Example: "Your authentication stories are Priority 1. Should these match?"

### 5. DEPENDENCY AWARENESS
- Identify potential dependencies on existing work
- Flag items that might be impacted by new requirements
- Ask about integration with existing features

**GOLDEN RULE:** If user's requirement overlaps >50% with existing work, ALWAYS ask about relationship before proceeding.
`;
    
    console.log(`[Workflow AI] Loaded backlog: ${data.totalCount} items`);
    return summary;
  } catch (error) {
    console.log("[Workflow AI] Could not fetch backlog:", error instanceof Error ? error.message : String(error));
    return "";
  }
}

/**
 * Extract keywords from text for semantic similarity
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'can', 'what', 'how',
    'when', 'where', 'why', 'who', 'which', 'this', 'that', 'these',
    'those', 'you', 'your', 'could', 'tell', 'me', 'about', 'please',
    'describe', 'explain', 'walk', 'through'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  return new Set(words);
}

/**
 * Calculate semantic similarity between questions
 */
function calculateQuestionSimilarity(q1: string, q2: string): number {
  const keywords1 = extractKeywords(q1);
  const keywords2 = extractKeywords(q2);
  
  if (keywords1.size === 0 || keywords2.size === 0) return 0;
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size;
}

/**
 * Check if question is duplicate
 */
function isDuplicateQuestion(
  newQuestion: string,
  questionHistory: QuestionHistory[],
  similarityThreshold: number = 0.55
): { isDuplicate: boolean; similarTo?: string; category?: string } {
  for (const hist of questionHistory) {
    const similarity = calculateQuestionSimilarity(newQuestion, hist.question);
    
    if (similarity > similarityThreshold) {
      return { 
        isDuplicate: true, 
        similarTo: hist.question,
        category: hist.category 
      };
    }
  }
  
  return { isDuplicate: false };
}

/**
 * Categorize question based on content
 */
function categorizeQuestion(question: string): string {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('goal') || lowerQ.includes('objective') || lowerQ.includes('why') || 
      lowerQ.includes('business value') || lowerQ.includes('driving this')) {
    return 'businessGoals';
  }
  if (lowerQ.includes('feature') || lowerQ.includes('functionality') || lowerQ.includes('capability') || 
      lowerQ.includes('what should')) {
    return 'keyFeatures';
  }
  if (lowerQ.includes('user') || lowerQ.includes('persona') || lowerQ.includes('who will') || 
      lowerQ.includes('who are')) {
    return 'targetUsers';
  }
  if (lowerQ.includes('workflow') || lowerQ.includes('process') || lowerQ.includes('journey') || 
      lowerQ.includes('step') || lowerQ.includes('walk me through')) {
    return 'userWorkflows';
  }
  if (lowerQ.includes('integrate') || lowerQ.includes('api') || lowerQ.includes('system') || 
      lowerQ.includes('platform') || lowerQ.includes('technology')) {
    return 'technicalConstraints';
  }
  if (lowerQ.includes('performance') || lowerQ.includes('security') || lowerQ.includes('scale') || 
      lowerQ.includes('non-functional') || lowerQ.includes('quality')) {
    return 'nonFunctionalRequirements';
  }
  if (lowerQ.includes('metric') || lowerQ.includes('measure') || lowerQ.includes('success') || 
      lowerQ.includes('kpi') || lowerQ.includes('how will you')) {
    return 'successMetrics';
  }
  if (lowerQ.includes('scope') || lowerQ.includes('not include') || lowerQ.includes('out of scope') || 
      lowerQ.includes('exclude')) {
    return 'scopeBoundaries';
  }
  
  return 'functionalRequirements';
}

/**
 * Analyze user response to extract covered topics
 */
function analyzeUserResponse(response: string, capturedRequirements: RequirementsContext): ResponseAnalysis {
  const lowerResponse = response.toLowerCase();
  const topicsCovered: string[] = [];
  const extractedInfo: string[] = [];
  
  // Detect what topics were covered in this response
  if (lowerResponse.includes('goal') || lowerResponse.includes('objective') || 
      lowerResponse.includes('solve') || lowerResponse.includes('achieve')) {
    topicsCovered.push('businessGoals');
    extractedInfo.push('Business goals/objectives mentioned');
  }
  
  if (lowerResponse.includes('feature') || lowerResponse.includes('capability') || 
      lowerResponse.includes('functionality') || lowerResponse.includes('need to') || 
      lowerResponse.includes('should be able to')) {
    topicsCovered.push('keyFeatures');
    extractedInfo.push('Features/capabilities mentioned');
  }
  
  if (lowerResponse.includes('user') || lowerResponse.includes('admin') || 
      lowerResponse.includes('manager') || lowerResponse.includes('customer') || 
      lowerResponse.includes('employee')) {
    topicsCovered.push('targetUsers');
    extractedInfo.push('User types/roles mentioned');
  }
  
  if (lowerResponse.includes('workflow') || lowerResponse.includes('process') || 
      lowerResponse.includes('step') || lowerResponse.match(/first.*then.*finally/i)) {
    topicsCovered.push('userWorkflows');
    extractedInfo.push('Workflow/process details provided');
  }
  
  if (lowerResponse.includes('integrate') || lowerResponse.includes('api') || 
      lowerResponse.includes('platform') || lowerResponse.includes('system') || 
      lowerResponse.includes('database')) {
    topicsCovered.push('technicalConstraints');
    extractedInfo.push('Technical requirements mentioned');
  }
  
  if (lowerResponse.includes('performance') || lowerResponse.includes('security') || 
      lowerResponse.includes('scale') || lowerResponse.includes('fast') || 
      lowerResponse.includes('secure')) {
    topicsCovered.push('nonFunctionalRequirements');
    extractedInfo.push('Non-functional requirements mentioned');
  }
  
  if (lowerResponse.includes('metric') || lowerResponse.includes('measure') || 
      lowerResponse.includes('success') || lowerResponse.includes('kpi') || 
      lowerResponse.includes('%') || lowerResponse.includes('increase') || 
      lowerResponse.includes('reduce')) {
    topicsCovered.push('successMetrics');
    extractedInfo.push('Success metrics mentioned');
  }
  
  if (lowerResponse.includes('not include') || lowerResponse.includes('out of scope') || 
      lowerResponse.includes('future phase') || lowerResponse.includes('later')) {
    topicsCovered.push('scopeBoundaries');
    extractedInfo.push('Scope boundaries mentioned');
  }
  
  return {
    userMessage: response,
    extractedInfo,
    topicsCovered,
    timestamp: Date.now()
  };
}

/**
 * Build comprehensive question history with responses
 */
function buildQuestionHistory(
  askedQuestions: string[],
  conversationHistory: Array<{ role: string; content: string }>
): QuestionHistory[] {
  const history: QuestionHistory[] = [];
  
  conversationHistory.forEach((msg, index) => {
    if (msg.role === 'assistant' && msg.content.includes('?')) {
      const question = msg.content;
      const userResponse = conversationHistory[index + 1]?.role === 'user' 
        ? conversationHistory[index + 1].content 
        : undefined;
      
      history.push({
        question,
        category: categorizeQuestion(question),
        keywords: extractKeywords(question),
        userResponse,
        infoExtracted: userResponse ? analyzeUserResponse(userResponse, {} as any).extractedInfo : undefined
      });
    }
  });
  
  return history;
}

/**
 * Advanced conversation context analysis
 */
function analyzeConversationContext(
  conversationHistory: Array<{ role: string; content: string }>,
  capturedRequirements: RequirementsContext,
  askedQuestions: string[]
): ConversationState {
  
  const userResponses = conversationHistory.filter(m => m.role === "user");
  const responseHistory: ResponseAnalysis[] = userResponses.map(r => 
    analyzeUserResponse(r.content, capturedRequirements)
  );

  // Assess category completeness with quality thresholds
  const categoryCompleteness = {
    businessGoals: (capturedRequirements.businessGoals?.length || 0) >= 1,
    keyFeatures: (capturedRequirements.keyFeatures?.length || 0) >= 2,
    targetUsers: (capturedRequirements.targetUsers?.length || 0) >= 1,
    functionalRequirements: (capturedRequirements.functionalRequirements?.length || 0) >= 2,
    technicalConstraints: (capturedRequirements.technicalConstraints?.length || 0) >= 1,
    nonFunctionalRequirements: (capturedRequirements.nonFunctionalRequirements?.length || 0) >= 1,
    successMetrics: (capturedRequirements.successMetrics?.length || 0) >= 1,
    userWorkflows: (capturedRequirements.userWorkflows?.length || 0) >= 1,
    integrations: true, // Optional
    scopeBoundaries: (capturedRequirements.scopeBoundaries?.inScope?.length || 0) > 0
  };

  // Identify uncovered and weak categories
  const uncoveredCategories: string[] = [];
  const weakCategories: string[] = [];
  
  Object.entries(categoryCompleteness).forEach(([category, isComplete]) => {
    if (!isComplete) {
      const count = Array.isArray(capturedRequirements[category as keyof RequirementsContext]) 
        ? (capturedRequirements[category as keyof RequirementsContext] as any[]).length 
        : 0;
      
      if (count === 0) {
        uncoveredCategories.push(category);
      } else {
        weakCategories.push(category);
      }
    }
  });

  // Track questions asked per category
  const categoryCoverage: Record<string, number> = {};
  const questionHistory = buildQuestionHistory(askedQuestions, conversationHistory);
  
  questionHistory.forEach(qh => {
    categoryCoverage[qh.category] = (categoryCoverage[qh.category] || 0) + 1;
  });

  // Determine current focus
  const lastQuestionCategory = questionHistory[questionHistory.length - 1]?.category || 'understanding';
  const currentFocus = lastQuestionCategory;

  // Calculate depth on current topic (last 3 questions)
  const recentCategories = questionHistory.slice(-3).map(qh => qh.category);
  const depthLevel = recentCategories.filter(cat => cat === currentFocus).length;

  // Check what topics were covered in recent user responses
  const recentResponseTopics = responseHistory.slice(-3).flatMap(r => r.topicsCovered);
  const topicsDiscussedRecently = new Set(recentResponseTopics);

  // Force topic switch if:
  // 1. Asked 3+ questions on same category
  // 2. Category already has good information
  // 3. There are uncovered categories
  // 4. User's recent responses covered multiple topics (comprehensive answer)
  const shouldSwitchTopic = 
    (depthLevel >= 3 && uncoveredCategories.length > 0) ||
    (depthLevel >= 2 && categoryCompleteness[currentFocus as keyof typeof categoryCompleteness] && uncoveredCategories.length > 0) ||
    (categoryCoverage[currentFocus] >= 3) || // Max 3 questions per category
    (topicsDiscussedRecently.size >= 3 && uncoveredCategories.length > 0); // User gave comprehensive answer

  // Determine if last topic is exhausted
  const lastUserMessage = userResponses[userResponses.length - 1]?.content || "";
  const lastTopicExhausted = 
    lastUserMessage.toLowerCase().includes("that's all") ||
    lastUserMessage.toLowerCase().includes("nothing else") ||
    lastUserMessage.toLowerCase().includes("that's it") ||
    (lastUserMessage.trim().toLowerCase() === "no" && questionHistory[questionHistory.length - 1]?.question.toLowerCase().includes("anything else"));

  // Priority-based next topic suggestions
  const suggestedNextTopics: string[] = [];
  
  // Priority 1: Critical uncovered categories
  if (uncoveredCategories.includes('businessGoals')) suggestedNextTopics.push('businessGoals');
  if (uncoveredCategories.includes('targetUsers')) suggestedNextTopics.push('targetUsers');
  if (uncoveredCategories.includes('keyFeatures')) suggestedNextTopics.push('keyFeatures');
  
  // Priority 2: Weak categories
  weakCategories.forEach(cat => {
    if (!suggestedNextTopics.includes(cat)) {
      suggestedNextTopics.push(cat);
    }
  });
  
  // Priority 3: Other uncovered
  uncoveredCategories.forEach(cat => {
    if (!suggestedNextTopics.includes(cat)) {
      suggestedNextTopics.push(cat);
    }
  });

  // Priority 4: Low coverage categories (asked <2 questions)
  Object.entries(categoryCoverage)
    .filter(([cat, count]) => count < 2 && !uncoveredCategories.includes(cat))
    .forEach(([cat]) => {
      if (!suggestedNextTopics.includes(cat)) {
        suggestedNextTopics.push(cat);
      }
    });

  return {
    currentFocus,
    depthLevel,
    lastTopicExhausted,
    suggestedNextTopics,
    categoryCoverage,
    shouldSwitchTopic,
    responseHistory
  };
}

export async function generateWorkflowConversationQuestion(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  capturedRequirements: RequirementsContext,
  currentPhase: string,
  askedQuestions: string[] = [],
  complianceGuidelines: any[] = [],
): Promise<{
  question: string;
  phase: string;
  quickReplies?: string[];
  capturedInfo?: RequirementsContext;
  readyToGenerate?: boolean;
  suggestedFollowUps?: string[];
}> {
  try {
    console.log("[Workflow AI] === COMPREHENSIVE ANALYSIS v3.0 ===");
    console.log("[Workflow AI] Questions asked:", askedQuestions.length);
    console.log("[Workflow AI] Conversation depth:", conversationHistory.length);
    
    const backlogContext = await fetchBacklogContext();
    const conversationState = analyzeConversationContext(
      conversationHistory,
      capturedRequirements,
      askedQuestions
    );
    
    console.log("[Workflow AI] State:", {
      currentFocus: conversationState.currentFocus,
      depthLevel: conversationState.depthLevel,
      shouldSwitch: conversationState.shouldSwitchTopic,
      suggestedTopics: conversationState.suggestedNextTopics.slice(0, 3),
      coverage: conversationState.categoryCoverage
    });

    const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
    const lastUserMessage = conversationHistory[conversationHistory.length - 1]?.content || "";
    const lastAIMessage = conversationHistory.length >= 2 
      ? conversationHistory[conversationHistory.length - 2]?.content || ""
      : "";

    const questionHistory = buildQuestionHistory(askedQuestions, conversationHistory);

    // ========== EXPLICIT GENERATION COMMAND ==========
    const explicitGenerationCommands = /(?:^|\s)(generate|create|build|make)\s+(?:the\s+)?(artifacts?|epics?|features?|stories|backlog)|^generate\s*$|^ready$/i;
    const userWantsToGenerateNow = explicitGenerationCommands.test(lastUserMessage.trim());

    if (userWantsToGenerateNow) {
      const hasMinimumInfo = 
        (capturedRequirements.businessGoals?.length || 0) > 0 ||
        (capturedRequirements.keyFeatures?.length || 0) > 0;

      if (hasMinimumInfo || conversationHistory.length > 4) {
        return {
          question: "Perfect! I'm now generating comprehensive Epics, Features, and User Stories with detailed acceptance criteria and subtasks.\n\nThis may take 30-60 seconds...",
          phase: "artifacts",
          quickReplies: [],
          readyToGenerate: true,
          capturedInfo: capturedRequirements,
        };
      }
    }

    // ========== GREETING DETECTION ==========
    const isEarlyInConversation = conversationHistory.length <= 2;
    const isGreeting = /^\s*(hey|hi|hello|hiya|howdy|greetings|good morning|good afternoon|good evening|sup|yo)[\s,!.?]*$/i.test(lastUserMessage.trim());

    if (isEarlyInConversation && isGreeting) {
      return {
        question: "Hello! 👋 I'm your AI Business Analyst assistant specialized in capturing enterprise requirements.\n\nI'll guide you through an intelligent conversation to create high-quality Epics, Features, and User Stories for Azure DevOps. I'll ask focused, context-aware questions that build on your responses without repeating myself.\n\nLet's start - what project or capability are you looking to build?",
        phase: "understanding",
        quickReplies: [
          "Building a new web application",
          "Enhancing an existing system",
          "Creating a mobile app",
          "Integrating multiple systems"
        ],
        capturedInfo: capturedRequirements,
        readyToGenerate: false,
      };
    }

    // ========== GENERATION CONFIRMATION ==========
    const previousAskedAboutGeneration = 
      lastAIMessage.toLowerCase().includes("would you like me to generate") ||
      lastAIMessage.toLowerCase().includes("proceed with") ||
      lastAIMessage.toLowerCase().includes("ready to generate");

    const isSimpleAffirmative = /^\s*(yes|yep|yeah|sure|okay|ok|please|go ahead|proceed|generate|let's go)[\s,!.?]*$/i.test(lastUserMessage.trim());
    
    const userConfirmedGeneration = previousAskedAboutGeneration && isSimpleAffirmative;

    if (userConfirmedGeneration) {
      return {
        question: "Perfect! Generating comprehensive artifacts with detailed acceptance criteria following Enhanced Given-When-Then format...\n\nThis may take 30-60 seconds.",
        phase: "artifacts",
        quickReplies: [],
        readyToGenerate: true,
        capturedInfo: capturedRequirements,
      };
    }

    // ========== "ADD MORE" DETECTION ==========
    const userWantsToAddMore =
      lastUserMessage.toLowerCase().includes("i have more") ||
      lastUserMessage.toLowerCase().includes("more to add") ||
      lastUserMessage.toLowerCase().includes("add more") ||
      lastUserMessage.toLowerCase() === "option 2";

    // ========== CATEGORY COMPLETENESS ==========
    const categoriesFilled = {
      businessGoals: (capturedRequirements.businessGoals?.length || 0) > 0,
      keyFeatures: (capturedRequirements.keyFeatures?.length || 0) >= 2,
      targetUsers: (capturedRequirements.targetUsers?.length || 0) > 0,
      functionalRequirements: (capturedRequirements.functionalRequirements?.length || 0) >= 2,
      technicalConstraints: (capturedRequirements.technicalConstraints?.length || 0) > 0,
      nonFunctionalRequirements: (capturedRequirements.nonFunctionalRequirements?.length || 0) > 0,
      successMetrics: (capturedRequirements.successMetrics?.length || 0) > 0,
      userWorkflows: (capturedRequirements.userWorkflows?.length || 0) > 0,
    };

    const categoriesFilledCount = Object.values(categoriesFilled).filter(Boolean).length;
    const totalCategories = Object.keys(categoriesFilled).length;

    // ========== IMPROVED STOPPING LOGIC ==========
    const hasGoodBreadth = categoriesFilledCount >= 5;
    const hasCriticalInfo = 
      categoriesFilled.businessGoals &&
      (categoriesFilled.keyFeatures || categoriesFilled.functionalRequirements) &&
      (categoriesFilled.targetUsers || categoriesFilled.userWorkflows);
    
    const reasonableQuestionCount = askedQuestions.length >= 6 && askedQuestions.length < 12;
    const tooManyQuestions = askedQuestions.length >= 10;

    const userSaidNo = /^(no|nope|nah|not really|nothing else|that's all|that's it|i'?m good|all set)[\s,!.?]*$/i.test(lastUserMessage.trim());

    const shouldOfferGeneration = 
      !userWantsToAddMore && (
        (tooManyQuestions && hasCriticalInfo) ||
        (reasonableQuestionCount && hasGoodBreadth) ||
        (categoriesFilledCount >= 6) ||
        (userSaidNo && hasCriticalInfo && askedQuestions.length >= 5)
      );

    if (shouldOfferGeneration) {
      console.log("[Workflow AI] Offering generation");
      
      const filledCategories = Object.entries(categoriesFilled)
        .filter(([_, v]) => v)
        .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim());
      
      return {
        question: `Excellent! I've gathered solid requirements across ${categoriesFilledCount} key areas:\n\n✅ ${filledCategories.join('\n✅ ')}\n\nI have enough information to generate high-quality Epics, Features, and User Stories with detailed acceptance criteria and subtasks.\n\n**Would you like me to proceed with artifact generation?**`,
        phase: currentPhase,
        quickReplies: ["Yes, generate artifacts now", "I have more details to add"],
        capturedInfo: capturedRequirements,
        readyToGenerate: false,
      };
    }

    // ========== BUILD COMPREHENSIVE SYSTEM PROMPT ==========
    const systemPrompt = `# 🎯 PRODUCTION-GRADE ENTERPRISE BA AGENT - COMPLETE EDITION

You are an **elite Business Analyst AI with 15+ years of experience** in Agile requirements gathering for Fortune 500 companies. Your expertise spans software engineering, product management, technical architecture, and stakeholder management.

## 🧠 YOUR CORE MISSION

Guide an **intelligent, warm, collaborative conversation** to extract enterprise-grade requirements for generating production-quality Epics, Features, and User Stories in Azure DevOps.

**Core Principles:**
1. **Intelligence Over Scripts** - Analyze context, don't follow rigid patterns
2. **Build on Context** - Every question references and builds upon ALL previous answers
3. **Breadth Over Depth** - Cover all categories before drilling deep
4. **Conversational Warmth** - Be friendly, collaborative, encouraging (not robotic)
5. **Strategic Thinking** - Consider what developers, QA, and product owners need
6. **Memory & Awareness** - Remember EVERYTHING user has shared across all responses

---

## 📊 COMPLETE CONVERSATION INTELLIGENCE

### Information Gathered So Far:
\`\`\`json
${JSON.stringify(capturedRequirements, null, 2)}
\`\`\`

### Conversation Analysis:
- **Questions Asked:** ${askedQuestions.length}
- **Categories Filled:** ${categoriesFilledCount}/${totalCategories}
- **Current Focus:** ${conversationState.currentFocus}
- **Depth on Current Topic:** ${conversationState.depthLevel}/3 ${conversationState.depthLevel >= 2 ? '⚠️ Consider switching topics' : ''}
- **Suggested Next Topics:** ${conversationState.suggestedNextTopics.slice(0, 3).join(', ')}

### Category Coverage Status:
${Object.entries(conversationState.categoryCoverage).map(([cat, count]) => 
  `- **${cat}:** ${count} question${count !== 1 ? 's' : ''} asked ${count >= 3 ? '🛑 LIMIT REACHED - SWITCH TOPICS' : count >= 2 ? '⚠️ Consider moving on' : '✅ Room for more'}`
).join('\n')}

### Questions Already Asked (ABSOLUTELY FORBIDDEN TO REPEAT):
${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### User Response History Analysis:
${conversationState.responseHistory.slice(-3).map((r, i) => `
**Response ${conversationState.responseHistory.length - 2 + i}:**
- Topics covered: ${r.topicsCovered.join(', ') || 'General'}
- Info extracted: ${r.extractedInfo.join(', ') || 'None'}
- Content: "${r.userMessage.substring(0, 100)}${r.userMessage.length > 100 ? '...' : ''}"
`).join('\n')}

---

## 🚨 CRITICAL ANTI-REPETITION & CONTEXT AWARENESS RULES

### RULE #1: ABSOLUTE ZERO-TOLERANCE FOR DUPLICATE QUESTIONS
**You MUST check these before asking ANYTHING:**
- ✅ Is this question semantically similar to ANY already-asked question?
- ✅ Did user ALREADY provide this information in ANY previous response?
- ✅ Have I asked about this category ${conversationState.categoryCoverage[conversationState.currentFocus] || 0} times already?
- ✅ Did user mention this topic in their detailed responses?

**FORBIDDEN:**
- ❌ Rephrasing the same question differently
- ❌ Asking "from a different angle" about covered topics
- ❌ Asking sub-questions about topics user already explained comprehensively
- ❌ Drilling deeper when you already have sufficient info for that category

**Example of What NOT to do:**
- Already asked: "What are your business goals?"
- User answered: "We want to reduce manual data entry by 50% and improve accuracy"
- ❌ DON'T ask: "What problems are you trying to solve?" ← SAME CONCEPT
- ❌ DON'T ask: "What objectives drive this project?" ← SAME CONCEPT
- ✅ DO ask: "Who will be using this system primarily?" ← NEW CATEGORY

### RULE #2: READ AND UNDERSTAND ALL PREVIOUS USER RESPONSES
${conversationHistory.filter(m => m.role === "user").slice(-5).map((msg, i) => `
**User's Response ${conversationHistory.filter(m => m.role === "user").length - 4 + i}:**
"${msg.content}"

What user ALREADY told you:
${analyzeUserResponse(msg.content, capturedRequirements).extractedInfo.join(', ') || 'Basic information'}
`).join('\n')}

**⚠️ Before asking your next question, verify:**
- Did user already cover this in their responses above?
- Can I extract more from what they've already shared?
- Am I asking for NEW information or repeating?

### RULE #3: MANDATORY TOPIC SWITCHING
${conversationState.shouldSwitchTopic ? `
🚨 **CRITICAL: YOU MUST SWITCH TOPICS NOW!**
- Current topic (${conversationState.currentFocus}) depth: ${conversationState.depthLevel}/3
- Questions on this topic: ${conversationState.categoryCoverage[conversationState.currentFocus] || 0}
- **YOU CANNOT ask about ${conversationState.currentFocus} again**
- **MUST ask about:** ${conversationState.suggestedNextTopics.slice(0, 3).join(' OR ')}
` : `
✅ You may continue current line of questioning OR switch to: ${conversationState.suggestedNextTopics.slice(0, 3).join(', ')}
`}

### RULE #4: BREADTH BEFORE DEPTH
- Ask 1-2 questions per category MAX before moving to next category
- Cover ALL ${totalCategories} categories before deep-diving
- Currently covered: ${categoriesFilledCount}/${totalCategories}
- **Priority: Cover uncovered categories first!**

### RULE #5: EXTRACT MAXIMUM VALUE FROM USER RESPONSES
User often provides information beyond what you asked. Example:

You asked: "What are your business goals?"
User said: "We want to improve efficiency for our sales team of 50 people who currently use spreadsheets"

**You now know:**
- Business Goal: Improve efficiency ✅
- Target Users: Sales team ✅
- Team Size: 50 people ✅
- Current Solution: Spreadsheets ✅
- Pain Point: Manual/inefficient process ✅

**Don't ask about these again!** Move to uncovered topics like: technical requirements, success metrics, workflows, etc.

---

## 🎯 ACCEPTANCE CRITERIA QUALITY STANDARDS (CRITICAL FOR ARTIFACT GENERATION)

${complianceGuidelines.length > 0 ? `
### 📜 COMPLIANCE GUIDELINES ACTIVE (${complianceGuidelines.length} documents)

**⚠️ MANDATORY:** These guidelines define the EXACT quality standards for all artifacts.

${complianceGuidelines.map((guideline: any, index: number) => `
#### Guideline ${index + 1}: ${guideline.name}
**Source:** ${guideline.path || 'Golden Repository'}

\`\`\`
${guideline.content}
\`\`\`

`).join('\n')}

**Your questions MUST gather information to meet these standards:**
- If guidelines require stakeholder mapping → Ask about project stakeholders and roles
- If guidelines require success metrics → Ask about KPIs and measurable outcomes
- If guidelines require technical sections → Ask about integrations, platforms, architecture
- If guidelines require comprehensive acceptance criteria → Ask about specific scenarios, data, validations, error handling
- If guidelines specify Enhanced Given-When-Then → Probe for exact actions, observables, timing, notifications

` : `
### STANDARD ENTERPRISE QUALITY EXPECTATIONS

Gather information to create artifacts that include:

**Epics:**
- Strategic alignment and business objectives
- Clear success metrics (quantifiable)
- Stakeholder mapping (Product Owner, Tech Lead, QA Lead)
- Timeline planning with milestones
- Risk identification and mitigation
- Explicit scope boundaries (in/out)

**Features:**
- Clear business value and ROI
- Technical feasibility assessment
- Dependencies and prerequisites
- Detailed deliverables list
- Acceptance criteria at feature level
- Parent Epic linkage

**User Stories (CRITICAL QUALITY):**
- **Format:** "As a [specific persona with context], I want [specific goal with details], so that [clear business value]"
- **7-Section Description:**
  1. Context & Background (2-3 sentences on why)
  2. Current State (pain points, manual processes)
  3. Desired State (improved experience)
  4. Key Functionality (bullets with specifics)
  5. User Interaction Flow (10-20 numbered steps)
  6. Technical Considerations (APIs, performance, security, dependencies)
  7. Out of Scope (what's NOT included)
  8. Success Metrics (quantifiable outcomes)

**Acceptance Criteria - Enhanced Given-When-Then (5 Components):**
Each criterion MUST have:
- **Title:** Descriptive name (5-8 words)
- **Given:** Specific role/user with permissions, exact screen/data state with example values
  - ❌ Bad: "User is logged in"
  - ✅ Good: "Claims Processor with 'Approve Claims' permission viewing claim #12345 in 'Pending Review' status with amount $5,000"
- **When:** Exact user action with parameters and interface elements
  - ❌ Bad: "User submits form"
  - ✅ Good: "Claims Processor clicks 'Approve' button, enters approval notes 'Medical documentation verified', and clicks 'Confirm Approval' in modal dialog"
- **Then:** Observable outcomes with timing, UI changes, data updates, status changes
  - ❌ Bad: "System updates status"
  - ✅ Good: "Within 2 seconds: Claim status updates to 'Approved' in database, approval timestamp recorded, claim moves to 'Approved Claims' dashboard, confirmation message displays: 'Claim #12345 approved successfully'"
- **And:** Secondary effects (emails, SMS, audit logs, integrations, error handling)
  - ✅ "Email sent to claimant at registered address with subject 'Claim Approved', SMS notification if opted-in, audit log entry created with approver ID and timestamp"

**Subtasks:**
- Granular, actionable tasks (1-8 hours each)
- Category prefixes: [Planning/Backend/Frontend/Database/Integration/Testing/Documentation/DevOps]
- Specific deliverables: Include API endpoints, component names, table names
- Proper estimation matching story points

**Personas (Use EXACTLY these 5):**
1. **persona-1:** Senior Developer (blue) - Technical implementation
2. **persona-2:** Business Analyst (purple) - Requirements and business logic
3. **persona-3:** QA Engineer (green) - Quality assurance and testing
4. **persona-4:** Product Manager (orange) - Product strategy
5. **persona-5:** DevOps Engineer (red) - Infrastructure and deployment

`}

### ASK QUESTIONS THAT GATHER THIS LEVEL OF DETAIL:

To create acceptance criteria with this quality, ask about:
- **Specific fields/data:** "What exact information does the user need to enter?"
- **Observable outcomes:** "What should users see immediately after this action?"
- **Error scenarios:** "What happens if the data is invalid or the API fails?"
- **Notifications:** "Who needs to be notified and through what channels?"
- **Audit/compliance:** "What needs to be logged for audit purposes?"
- **Timing/performance:** "How quickly should this complete?"
- **Validation rules:** "What are the validation requirements for each field?"
- **Edge cases:** "What unusual scenarios should we handle?"

---

${backlogContext ? `
## 📋 EXISTING BACKLOG CONTEXT

${backlogContext}

### INTELLIGENT USE OF BACKLOG CONTEXT:

**When user mentions functionality, IMMEDIATELY:**
1. Scan existing epics/features for similarities
2. If overlap found, ask: "I notice you have Epic #123 'X'. Is this related, or completely separate?"
3. Suggest alignment: "Should we extend Feature #456, or create new work?"
4. Identify gaps: "Your Feature #456 has A and B, but no C. Should we add that?"
5. Check priorities: "Your existing stories are Priority 1. Should these match?"

**Proactive Gap Analysis:**
- Notice patterns in existing backlog
- Suggest completing partial implementations
- Flag potential dependencies
- Recommend consistency in tagging and priorities

` : `
## ℹ️ NEW PROJECT - No Existing Backlog

This appears to be a fresh Azure DevOps project. You have creative freedom to design the backlog structure from scratch.
`}

---

## 💡 INTELLIGENT QUESTIONING STRATEGY

### Dynamic Question Selection (Your Mental Checklist):

**BEFORE generating each question, you MUST:**
1. ✅ Review ALL previous user responses (not just the last one)
2. ✅ Check what categories are still uncovered/weak
3. ✅ Verify you haven't asked this before (even in different words)
4. ✅ Confirm you're not drilling too deep on one topic
5. ✅ Ensure question will reveal info needed for detailed acceptance criteria
6. ✅ Ask about a NEW category if current one has 2+ questions

### Question Generation Priority:

**Priority 1: Critical Missing Categories (ask about these FIRST)**
${conversationState.suggestedNextTopics.slice(0, 3).map((topic, i) => 
  `${i + 1}. ${topic.replace(/([A-Z])/g, ' $1').trim()} ${
    !categoriesFilled[topic as keyof typeof categoriesFilled] ? '⚠️ COMPLETELY UNCOVERED' : '⚠️ WEAK - needs more'
  }`
).join('\n') || 'All major categories have some coverage'}

**Priority 2: Build on User's Last Response**
- Extract maximum value from what they just shared
- Ask natural follow-up that adds NEW dimension
- Don't repeat what they already told you

**Priority 3: Acceptance Criteria Depth**
- Ask about specifics that will create detailed AC
- Probe for data, workflows, validations, error handling
- Get observable outcomes and timing expectations

### Examples of SMART Questions:

**✅ GOOD (Contextual, Builds on Previous, New Topic):**
User previously said: "We need a CRM for our sales team of 50 people"
Already asked about: Business goals, users, key features
Your question: "You mentioned your sales team uses this. Walk me through a typical sales workflow - from when a lead first comes in to when the deal closes. What are the key steps?"
→ Asks about userWorkflows (new category), builds on known context, will reveal detailed process

**✅ GOOD (Proactive, References Context):**
User said: "Dashboard for managers to see team performance"
Your question: "For the manager dashboard, what specific metrics or KPIs should be displayed? Things like total deals closed, conversion rates, average deal size - what's most important for decision-making?"
→ Specific, will reveal successMetrics, helps create detailed acceptance criteria

**❌ BAD (Repetitive):**
Already asked: "What are your business objectives?"
Don't ask: "What goals are you trying to achieve?" ← SAME CONCEPT, rephrased

**❌ BAD (Too Deep, Ignoring Breadth):**
Already asked 3 questions about features
Don't ask: "Tell me more details about feature X's sub-functionality Y" ← TOO DEEP
Do ask: "What technical platforms or systems does this need to integrate with?" ← NEW CATEGORY

**❌ BAD (Ignoring User's Previous Detailed Answer):**
User already said: "Sales reps and managers will use it. Reps track leads, managers view reports"
Don't ask: "Who will be using this system?" ← THEY ALREADY TOLD YOU

---

## 🎨 CONVERSATIONAL WARMTH & COLLABORATION

**Tone Guidelines:**
- Be warm, friendly, encouraging (like a helpful colleague, not a robot)
- Acknowledge what user shares: "That's really helpful context!" / "Great, that gives me a clear picture"
- Show you're listening: "Based on what you've told me about X, I'm curious about Y..."
- Be concise but personable: 2-3 sentences before your question
- Use natural language, avoid jargon unless user does
- Celebrate progress: "Excellent! We're building a comprehensive picture..."

**Example Responses:**

**Warm Opening:**
"Perfect! A CRM for your sales team - that's a great fit for structured Agile development. Before we dive into features, help me understand the foundation..."

**Acknowledging Detail:**
"Wow, that's really comprehensive - thank you! I can already see how the workflow progresses through those stages. Now let me understand the technical side..."

**Encouraging:**
"This is shaping up really well! I have a clear picture of your users and main features. Let's talk about how you'll measure success..."

**Transitioning Topics:**
"Got it, those features make perfect sense for your use case. Switching gears a bit - let's talk about the technical environment..."

---

## 📤 RESPONSE FORMAT

Respond in this EXACT JSON structure:

\`\`\`json
{
  "question": "Your warm, contextual, intelligent question here (reference previous answers, ask about NEW category, be specific)",
  "phase": "understanding|refining|deepening|validating",
  "quickReplies": ["Option 1", "Option 2", "Option 3"], // Optional - only if genuinely helpful (2-4 options max)
  "readyToGenerate": false,
  "capturedInfo": {
    // ⚠️ MANDATORY: ALWAYS extract and return COMPLETE updated requirements
    // Parse user's latest response and ADD new info to existing arrays
    // NEVER return empty arrays if user provided relevant information
    // NEVER replace existing info, only ADD to it
    "businessGoals": ["existing goals", "newly mentioned goals"],
    "keyFeatures": ["existing features", "newly mentioned features"],
    "targetUsers": ["existing users", "newly mentioned users"],
    "functionalRequirements": ["existing reqs", "new reqs"],
    "technicalConstraints": ["existing constraints", "new constraints"],
    "nonFunctionalRequirements": ["existing NFRs", "new NFRs"],
    "successMetrics": ["existing metrics", "new metrics"],
    "userWorkflows": ["existing workflows", "new workflows"],
    "integrations": ["existing integrations", "new integrations"],
    "scopeBoundaries": {
      "inScope": ["items explicitly in scope"],
      "outOfScope": ["items explicitly out of scope"]
    }
  },
  "suggestedFollowUps": ["Potential next question 1", "Potential next question 2"]
}
\`\`\`

**EXTRACTION RULES (CRITICAL):**
- Parse user's response for ALL relevant information across ALL categories
- Add newly mentioned items to appropriate arrays
- Merge with existing capturedRequirements, don't replace
- If user mentions "sales team" → add to targetUsers
- If user mentions "improve efficiency" → add to businessGoals
- If user mentions "dashboard" → add to keyFeatures
- If user mentions "integrate with Salesforce" → add to technicalConstraints or integrations
- ALWAYS return complete capturedInfo object (never null/undefined)

---

## 🚀 QUALITY MANTRAS (Remember These Always)

1. **"Have I already asked about this concept?"** - Check before asking
2. **"What did user ALREADY tell me?"** - Review all responses
3. **"Am I covering breadth or going too deep?"** - Balance exploration
4. **"Will this create detailed acceptance criteria?"** - Think downstream
5. **"Am I being warm and collaborative?"** - Human connection matters
6. **"Is this the MOST valuable next question?"** - Prioritize impact

---

## ⚠️ FINAL PRE-FLIGHT CHECKLIST

Before you generate your response, verify:
- [ ] My question is NOT similar to any in askedQuestions list?
- [ ] User hasn't already answered this in previous responses?
- [ ] I'm not asking 3+ questions on same category?
- [ ] I'm asking about ${conversationState.suggestedNextTopics[0] || 'high-priority uncovered area'}?
- [ ] My question references user's previous context?
- [ ] My tone is warm and collaborative?
- [ ] I'm extracting ALL new info into capturedInfo?
- [ ] This will help create detailed acceptance criteria?

If ANY checkbox is unchecked, revise your question!

---

## 🎯 NOW GENERATE YOUR INTELLIGENT QUESTION

**User's last message:** "${lastUserMessage}"

**What you MUST do:**
1. Review ALL previous user responses (not just last one)
2. Identify what categories need coverage: ${conversationState.suggestedNextTopics.slice(0, 3).join(', ')}
3. ${conversationState.shouldSwitchTopic ? `🚨 MANDATORY: Switch away from ${conversationState.currentFocus} - ask about ${conversationState.suggestedNextTopics[0]}` : `Ask about most important uncovered/weak area`}
4. Reference context from user's previous answers
5. Be warm, specific, and collaborative
6. Extract ALL new information into capturedInfo

**Generate ONE brilliant question that moves us forward intelligently.** 🎯`;

    // ========== CALL AI WITH OPTIMIZED PARAMETERS ==========
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ];

    console.log("[Workflow AI] Calling AI with comprehensive context");

    const response = await openai.chat.completions.create({
      model: modelName,
      response_format: { type: "json_object" },
      messages,
      temperature: 0.65, // Balanced creativity and consistency
      top_p: 0.88,
      presence_penalty: 0.4, // Strong discouragement of repetition
      frequency_penalty: 0.4, // Strong discouragement of repetition
    });

    const content = response.choices[0]?.message?.content || "{}";
    console.log("[Workflow AI] AI response received");

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("[Workflow AI] JSON parse error:", parseError);
      throw new Error("Failed to parse AI response");
    }

    // ========== COMPREHENSIVE VALIDATION & DUPLICATE DETECTION ==========
    if (!result.question || typeof result.question !== "string" || result.question.trim() === "") {
      console.error("[Workflow AI] AI returned empty/invalid question");
      
      // Intelligent fallback based on missing categories
      if (conversationState.suggestedNextTopics.length > 0) {
        const nextTopic = conversationState.suggestedNextTopics[0];
        
        const fallbackQuestions: Record<string, string> = {
          'businessGoals': "What are the main business objectives or outcomes you're hoping to achieve with this project?",
          'targetUsers': "Who are the primary users who will interact with this system daily?",
          'keyFeatures': "What are the 2-3 most critical capabilities this system absolutely must have?",
          'functionalRequirements': "What specific tasks or actions should users be able to perform in the system?",
          'userWorkflows': "Could you walk me through a typical user journey from start to finish?",
          'technicalConstraints': "Are there any specific technologies, platforms, or existing systems this needs to work with?",
          'nonFunctionalRequirements': "What are your expectations around performance, security, or scalability?",
          'successMetrics': "How will you measure whether this project is successful? What are the key metrics?",
          'scopeBoundaries': "What features or capabilities are explicitly out of scope for the initial release?"
        };
        
        return {
          question: fallbackQuestions[nextTopic] || "Could you tell me more about what you're envisioning for this project?",
          phase: currentPhase,
          quickReplies: undefined,
          readyToGenerate: false,
          capturedInfo: capturedRequirements,
        };
      }
    }

    // Advanced duplicate detection with logging
    const duplicateCheck = isDuplicateQuestion(result.question, questionHistory, 0.55);
    
    if (duplicateCheck.isDuplicate) {
      console.warn("[Workflow AI] ⚠️ DUPLICATE QUESTION DETECTED!");
      console.warn("[Workflow AI] New question:", result.question);
      console.warn("[Workflow AI] Similar to:", duplicateCheck.similarTo);
      console.warn("[Workflow AI] Category:", duplicateCheck.category);
      
      // Force different topic
      const alternativeTopic = conversationState.suggestedNextTopics.find(
        t => t !== duplicateCheck.category && t !== conversationState.currentFocus
      ) || conversationState.suggestedNextTopics[0];
      
      console.log("[Workflow AI] Forcing switch to:", alternativeTopic);
      
      const topicQuestions: Record<string, string> = {
        'businessGoals': "What specific business outcomes or improvements are you expecting from this project?",
        'targetUsers': "Tell me about the different types of users - what are their roles and typical daily activities?",
        'keyFeatures': "What capabilities would deliver the most value to your users in the first release?",
        'functionalRequirements': "What information or data will users need to view, create, or update in the system?",
        'userWorkflows': "Walk me through the end-to-end process - what happens from start to finish in a typical scenario?",
        'technicalConstraints': "What technical environment are you working in? Any existing platforms, databases, or tools to integrate with?",
        'nonFunctionalRequirements': "Are there specific requirements around response times, concurrent users, data security, or compliance?",
        'successMetrics': "What measurable improvements or KPIs will indicate this project succeeded?",
        'scopeBoundaries': "What won't be included in the first version? What features are you deferring to later phases?"
      };
      
      result.question = topicQuestions[alternativeTopic] || 
        "Let me shift focus - what haven't we covered yet that's important for this project?";
      
      console.log("[Workflow AI] Replaced with:", result.question);
    }

    // Ensure phase is set
    if (!result.phase) {
      result.phase = currentPhase;
    }

    // ========== ENSURE CAPTURED INFO IS COMPLETE AND ENHANCED ==========
    if (!result.capturedInfo || Object.keys(result.capturedInfo).length === 0) {
      console.log("[Workflow AI] AI didn't extract info, using pattern-based extraction");
      const extracted = extractRequirementsFromMessage(lastUserMessage, capturedRequirements);
      
      result.capturedInfo = {
        businessGoals: extracted.businessGoals || capturedRequirements.businessGoals || [],
        keyFeatures: extracted.keyFeatures || capturedRequirements.keyFeatures || [],
        targetUsers: extracted.targetUsers || capturedRequirements.targetUsers || [],
        functionalRequirements: extracted.functionalRequirements || capturedRequirements.functionalRequirements || [],
        technicalConstraints: extracted.technicalConstraints || capturedRequirements.technicalConstraints || [],
        nonFunctionalRequirements: extracted.nonFunctionalRequirements || capturedRequirements.nonFunctionalRequirements || [],
        successMetrics: extracted.successMetrics || capturedRequirements.successMetrics || [],
        userWorkflows: extracted.userWorkflows || capturedRequirements.userWorkflows || [],
        integrations: extracted.integrations || capturedRequirements.integrations || [],
        scopeBoundaries: extracted.scopeBoundaries || capturedRequirements.scopeBoundaries || { inScope: [], outOfScope: [] }
      };
    } else {
      // Ensure all fields exist and merge with existing
      result.capturedInfo = {
        businessGoals: [...new Set([...(capturedRequirements.businessGoals || []), ...(result.capturedInfo.businessGoals || [])])],
        keyFeatures: [...new Set([...(capturedRequirements.keyFeatures || []), ...(result.capturedInfo.keyFeatures || [])])],
        targetUsers: [...new Set([...(capturedRequirements.targetUsers || []), ...(result.capturedInfo.targetUsers || [])])],
        functionalRequirements: [...new Set([...(capturedRequirements.functionalRequirements || []), ...(result.capturedInfo.functionalRequirements || [])])],
        technicalConstraints: [...new Set([...(capturedRequirements.technicalConstraints || []), ...(result.capturedInfo.technicalConstraints || [])])],
        nonFunctionalRequirements: [...new Set([...(capturedRequirements.nonFunctionalRequirements || []), ...(result.capturedInfo.nonFunctionalRequirements || [])])],
        successMetrics: [...new Set([...(capturedRequirements.successMetrics || []), ...(result.capturedInfo.successMetrics || [])])],
        userWorkflows: [...new Set([...(capturedRequirements.userWorkflows || []), ...(result.capturedInfo.userWorkflows || [])])],
        integrations: [...new Set([...(capturedRequirements.integrations || []), ...(result.capturedInfo.integrations || [])])],
        scopeBoundaries: {
          inScope: [...new Set([...(capturedRequirements.scopeBoundaries?.inScope || []), ...(result.capturedInfo.scopeBoundaries?.inScope || [])])],
          outOfScope: [...new Set([...(capturedRequirements.scopeBoundaries?.outOfScope || []), ...(result.capturedInfo.scopeBoundaries?.outOfScope || [])])]
        }
      };
    }

    // Log what was captured
    const newInfoCount = Object.values(result.capturedInfo).reduce((sum, val) => {
      if (Array.isArray(val)) return sum + val.length;
      if (typeof val === 'object' && val !== null) return sum + Object.values(val).flat().length;
      return sum;
    }, 0);
    
    console.log("[Workflow AI] Captured info items:", newInfoCount);
    console.log("[Workflow AI] Categories with data:", Object.entries(result.capturedInfo).filter(([k, v]) => 
      Array.isArray(v) ? v.length > 0 : (typeof v === 'object' && Object.values(v).some(arr => (arr as any[]).length > 0))
    ).map(([k]) => k));

    console.log("[Workflow AI] === ANALYSIS COMPLETE ===");
    return result;

  } catch (error) {
    console.error("[Workflow AI] Critical error:", error);
    
    if (error instanceof Error) {
      console.error("[Workflow AI] Error details:", error.message, error.stack);
    }
    
    // Production-grade fallback
    const fallbackTopic = conversationState?.suggestedNextTopics?.[0] || 'keyFeatures';
    const fallbackQuestions: Record<string, string> = {
      'businessGoals': "Let's continue - what business problem or opportunity is driving this project?",
      'targetUsers': "Who will be the main users of this system?",
      'keyFeatures': "What are the essential features or capabilities you need?",
      'userWorkflows': "Can you describe how users would typically interact with the system?",
      'technicalConstraints': "Are there any technical requirements or constraints I should know about?",
      'nonFunctionalRequirements': "What are your expectations for performance, security, or scalability?",
      'successMetrics': "How will you measure success for this project?",
    };
    
    return {
      question: fallbackQuestions[fallbackTopic] || "Let's continue - could you tell me more about what you're building?",
      phase: currentPhase,
      quickReplies: undefined,
      readyToGenerate: false,
      capturedInfo: capturedRequirements,
    };
  }
}

/**
 * Validates requirements completeness
 */
export function validateRequirementsCompleteness(
  requirements: RequirementsContext
): { isComplete: boolean; missingAreas: string[]; warnings: string[] } {
  const missingAreas: string[] = [];
  const warnings: string[] = [];

  // Critical requirements
  if (!requirements.businessGoals || requirements.businessGoals.length === 0) {
    missingAreas.push("Business Goals/Objectives");
  }
  if (!requirements.targetUsers || requirements.targetUsers.length === 0) {
    missingAreas.push("Target Users/Personas");
  }
  if (!requirements.keyFeatures || requirements.keyFeatures.length < 2) {
    missingAreas.push("Key Features (need at least 2)");
  }

  // Important but not critical
  if (!requirements.functionalRequirements || requirements.functionalRequirements.length < 2) {
    warnings.push("More functional requirement details would improve quality");
  }
  if (!requirements.successMetrics || requirements.successMetrics.length === 0) {
    warnings.push("Success metrics help prioritize features");
  }
  if (!requirements.userWorkflows || requirements.userWorkflows.length === 0) {
    warnings.push("User workflow details improve story quality");
  }

  const isComplete = missingAreas.length === 0;
  return { isComplete, missingAreas, warnings };
}

/**
 * Enhanced extraction with better pattern matching and deduplication
 */
export function extractRequirementsFromMessage(
  message: string,
  existingRequirements: RequirementsContext
): Partial<RequirementsContext> {
  const extracted: Partial<RequirementsContext> = {};
  const lowerMessage = message.toLowerCase();

  // Helper function to check if item already exists (semantic matching)
  const isDuplicate = (newItem: string, existingList: string[]): boolean => {
    const newLower = newItem.toLowerCase();
    return existingList.some(existing => {
      const existingLower = existing.toLowerCase();
      return existingLower.includes(newLower) || 
             newLower.includes(existingLower) ||
             calculateQuestionSimilarity(newItem, existing) > 0.7;
    });
  };

  // Business goals patterns (enhanced)
  const goalPatterns = [
    /(?:goal|objective|aim|purpose|trying to|want to|need to|solve|improve|achieve|reduce|increase)\s+(?:is\s+)?(.+?)(?:\.|,|and\s+(?:also|we)|$)/gi,
    /(?:because|so that|in order to)\s+(.+?)(?:\.|,|$)/gi,
    /(?:we're looking to|looking to|hoping to|aiming to)\s+(.+?)(?:\.|,|$)/gi
  ];
  
  const goals: string[] = [];
  goalPatterns.forEach(pattern => {
    const matches = Array.from(message.matchAll(pattern));
    matches.forEach(match => {
      if (match[1] && match[1].length > 10 && match[1].length < 200) {
        const goal = match[1].trim();
        if (!isDuplicate(goal, existingRequirements.businessGoals || [])) {
          goals.push(goal);
        }
      }
    });
  });
  
  if (goals.length > 0) {
    extracted.businessGoals = [...(existingRequirements.businessGoals || []), ...goals];
  }

  // Feature patterns (enhanced)
  const featurePatterns = [
    /(?:feature|functionality|capability|function|ability to|can|should|must|need|want|require)\s+(?:to\s+)?(.+?)(?:\.|,|and\s+(?:also|we)|$)/gi,
    /(?:build|create|develop|implement|add|include|have)\s+(?:a\s+)?(.+?)(?:\.|,|and|$)/gi,
    /(?:system should|app should|platform should|solution should)\s+(.+?)(?:\.|,|$)/gi
  ];
  
  const features: string[] = [];
  featurePatterns.forEach(pattern => {
    const matches = Array.from(message.matchAll(pattern));
    matches.forEach(match => {
      if (match[1] && match[1].length > 5 && match[1].length < 150) {
        const feature = match[1].trim();
        if (!isDuplicate(feature, existingRequirements.keyFeatures || [])) {
          features.push(feature);
        }
      }
    });
  });
  
  if (features.length > 0) {
    extracted.keyFeatures = [...(existingRequirements.keyFeatures || []), ...features];
  }

  // User/persona patterns (enhanced)
  const userPatterns = [
    /(?:users?|personas?|customers?|clients?|admins?|administrators?|managers?|employees?|staff|team members?|people)\s+(?:are|is|will be|include|like|such as|who)\s+(.+?)(?:\.|,|and\s+(?:also)?|$)/gi,
    /(?:for|targeting|serving)\s+(.+?)\s+(?:users?|customers?|people|employees?)(?:\.|,|$)/gi,
    /(?:role of|roles? like|types? of users?)\s+(?:include|are|such as)\s+(.+?)(?:\.|,|$)/gi
  ];
  
  const users: string[] = [];
  userPatterns.forEach(pattern => {
    const matches = Array.from(message.matchAll(pattern));
    matches.forEach(match => {
      if (match[1] && match[1].length > 3 && match[1].length < 100) {
        const user = match[1].trim();
        if (!isDuplicate(user, existingRequirements.targetUsers || [])) {
          users.push(user);
        }
      }
    });
  });
  
  // Also check for standalone user type mentions
  const userTypeKeywords = ['admin', 'administrator', 'manager', 'employee', 'customer', 'user', 'developer', 'analyst', 'executive', 'sales', 'support', 'engineer'];
  userTypeKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      const existing = existingRequirements.targetUsers || [];
      if (!existing.some(u => u.toLowerCase().includes(keyword))) {
        users.push(keyword.charAt(0).toUpperCase() + keyword.slice(1) + 's');
      }
    }
  });
  
  if (users.length > 0) {
    extracted.targetUsers = [...(existingRequirements.targetUsers || []), ...users];
  }

  // Technical constraints (enhanced)
  if (lowerMessage.includes('integrate') || lowerMessage.includes('api') || 
      lowerMessage.includes('database') || lowerMessage.includes('platform') ||
      lowerMessage.includes('system') || lowerMessage.includes('technology') ||
      lowerMessage.includes('azure') || lowerMessage.includes('aws') || 
      lowerMessage.includes('cloud') || lowerMessage.includes('server')) {
    
    const techMatches = message.match(/(?:integrate with|using|built on|platform|database|system|technology|framework|language|tool)\s+(.+?)(?:\.|,|and|$)/gi);
    if (techMatches) {
      const techConstraints = techMatches
        .map(m => m.trim())
        .filter(t => t.length > 5 && t.length < 150)
        .filter(t => !isDuplicate(t, existingRequirements.technicalConstraints || []));
      
      if (techConstraints.length > 0) {
        extracted.technicalConstraints = [
          ...(existingRequirements.technicalConstraints || []),
          ...techConstraints
        ];
      }
    }
  }

  // Success metrics (enhanced)
  const metricPatterns = [
    /(?:measure|metric|kpi|target|goal is|success|track)\s+(.+?)(?:\.|,|$)/gi,
    /(?:increase|decrease|improve|reduce|achieve|reach)\s+(.+?)\s+(?:by|to|from)\s+(.+?)(?:\.|,|$)/gi,
    /(\d+%|\d+\s*percent)/gi
  ];
  
  const metrics: string[] = [];
  metricPatterns.forEach(pattern => {
    const matches = Array.from(message.matchAll(pattern));
    matches.forEach(match => {
      if (match[1] && match[1].length > 5 && match[1].length < 150) {
        const metric = match[1].trim();
        if (!isDuplicate(metric, existingRequirements.successMetrics || [])) {
          metrics.push(metric);
        }
      }
    });
  });
  
  if (metrics.length > 0) {
    extracted.successMetrics = [...(existingRequirements.successMetrics || []), ...metrics];
  }

  // Workflow/process mentions (enhanced)
  if (lowerMessage.includes('workflow') || lowerMessage.includes('process') || 
      lowerMessage.includes('step') || lowerMessage.includes('journey') ||
      lowerMessage.includes('first') && lowerMessage.includes('then')) {
    
    const workflowMatches = message.match(/(?:workflow|process|journey|steps?|first.*then.*(?:finally)?)\s*:?\s*(.{20,}?)(?:\.|$)/gi);
    if (workflowMatches && workflowMatches.length > 0) {
      const workflow = workflowMatches[0].trim();
      if (!isDuplicate(workflow, existingRequirements.userWorkflows || [])) {
        extracted.userWorkflows = [
          ...(existingRequirements.userWorkflows || []),
          workflow
        ];
      }
    }
  }

  // Scope boundaries
  if (lowerMessage.includes('not include') || lowerMessage.includes('out of scope') || 
      lowerMessage.includes('exclude') || lowerMessage.includes('won\'t have') ||
      lowerMessage.includes('don\'t need')) {
    
    const outOfScopeMatches = message.match(/(?:not include|out of scope|exclude|won't have|don't need)\s+(.+?)(?:\.|,|$)/gi);
    if (outOfScopeMatches) {
      const outOfScope = outOfScopeMatches.map(m => m.trim());
      extracted.scopeBoundaries = {
        inScope: existingRequirements.scopeBoundaries?.inScope || [],
        outOfScope: [...(existingRequirements.scopeBoundaries?.outOfScope || []), ...outOfScope]
      };
    }
  }

  return extracted;
}

export default {
  generateWorkflowConversationQuestion,
  validateRequirementsCompleteness,
  extractRequirementsFromMessage,
};