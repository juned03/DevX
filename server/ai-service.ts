import OpenAI from "openai";
import { AzureOpenAI } from "openai";
import { storage } from "./storage";

// Use Azure OpenAI if configured, otherwise fall back to Replit AI Integration
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

// ============================================
// CRITICAL FIXES FOR CONTEXT INTEGRATION
// ============================================

export async function generateDesignGuidelines(
  requirement: string,
  capturedRequirements?: {
    businessGoals?: string[];
    targetUsers?: string[];
    keyFeatures?: string[];
    technicalConstraints?: string[];
    functionalRequirements?: string[];
    nonFunctionalRequirements?: string[];
  }
): Promise<string> {
  try {
    console.log("[AI Service] Generating design guidelines for:", requirement.substring(0, 120));
    console.log("[AI Service] Captured requirements:", JSON.stringify(capturedRequirements, null, 2));

    const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";

    // ============================================
    // FIX 1: Enhanced Context Builder with Rich Detail Extraction
    // ============================================
    const buildEnhancedContext = (): string => {
      if (!capturedRequirements) {
        console.warn("[AI Service] No captured requirements provided!");
        return "";
      }

      let context = "\n## 🎯 CRITICAL PROJECT CONTEXT (MUST INTEGRATE INTO ALL DESIGNS)\n\n";
      
      // Extract detailed information from the requirement text
      const extractDetailedInfo = (text: string, keywords: string[]): string[] => {
        const details: string[] = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (keywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
            // Extract bullet points or numbered items
            const match = line.match(/^[-•*\d.)\s]*(.+)$/);
            if (match && match[1].trim().length > 10) {
              details.push(match[1].trim());
            }
          }
        }
        return details;
      };

      // Business Goals - drive visual priorities and CTAs
      if (capturedRequirements.businessGoals && capturedRequirements.businessGoals.length > 0) {
        context += "**Business Goals (inform color schemes, UI hierarchy, feature prominence):**\n";
        capturedRequirements.businessGoals.forEach((goal, idx) => {
          context += `${idx + 1}. ${goal}\n`;
          // Extract any additional details from the requirement text
          const goalDetails = extractDetailedInfo(requirement, [goal]);
          if (goalDetails.length > 0) {
            goalDetails.forEach(detail => context += `   - ${detail}\n`);
          }
        });
        context += "\n";
      }
      
      // Target Users - drive terminology, complexity, and interaction patterns
      if (capturedRequirements.targetUsers && capturedRequirements.targetUsers.length > 0) {
        context += "**Target Users & Their Specific Needs (inform terminology, workflows, UI complexity):**\n";
        capturedRequirements.targetUsers.forEach((user, idx) => {
          context += `${idx + 1}. **${user}**\n`;
          
          // Extract role-specific details from requirement text
          const userKeywords = user.split(/[,/]/).map(u => u.trim());
          const roleDetails = extractDetailedInfo(requirement, [...userKeywords, 'role:', 'tasks:', 'key tasks']);
          
          if (roleDetails.length > 0) {
            context += `   Role & Responsibilities:\n`;
            roleDetails.slice(0, 5).forEach(detail => context += `   - ${detail}\n`);
          } else {
            // Fallback: try to extract any mentions of this user type
            const regex = new RegExp(`${userKeywords[0]}[^.]*?(?:can|should|must|will|needs to|responsible for)[^.]*\\.`, 'gi');
            const matches = requirement.match(regex);
            if (matches && matches.length > 0) {
              matches.slice(0, 3).forEach(match => context += `   - ${match.trim()}\n`);
            }
          }
        });
        context += "\n";
      }
      
      // Key Features - must be prominent in layouts
      if (capturedRequirements.keyFeatures && capturedRequirements.keyFeatures.length > 0) {
        context += "**Key Features & Capabilities (must be emphasized in layouts and prompts):**\n";
        capturedRequirements.keyFeatures.forEach((feature, idx) => {
          context += `${idx + 1}. **${feature}**\n`;
          
          // Extract feature details
          const featureKeywords = feature.split(/[,&]/).map(f => f.trim()).filter(f => f.length > 3);
          const featureDetails = extractDetailedInfo(requirement, featureKeywords);
          
          if (featureDetails.length > 0) {
            featureDetails.slice(0, 4).forEach(detail => context += `   - ${detail}\n`);
          }
        });
        context += "\n";
      }
      
      // Functional Requirements - drive screen structure and workflows
      if (capturedRequirements.functionalRequirements && capturedRequirements.functionalRequirements.length > 0) {
        context += "**Functional Requirements & Detailed Workflows (map to specific screens/components):**\n";
        capturedRequirements.functionalRequirements.forEach((req, idx) => {
          context += `\n${idx + 1}. **${req}**\n`;
          
          // Parse if it's a JSON string
          if (typeof req === 'string' && req.includes('userRole')) {
            try {
              const parsed = JSON.parse(req);
              context += `   [${parsed.userRole}]: ${parsed.functionality.join(', ')}\n`;
            } catch {
              // Not JSON, extract details
              const reqKeywords = req.split(/[,&]/).map(r => r.trim()).filter(r => r.length > 3);
              const reqDetails = extractDetailedInfo(requirement, [...reqKeywords, 'tasks:', 'processes:', 'features:']);
              
              if (reqDetails.length > 0) {
                context += `   Implementation Details:\n`;
                reqDetails.slice(0, 6).forEach(detail => context += `   - ${detail}\n`);
              }
            }
          } else {
            // Extract details for this functional requirement
            const reqKeywords = String(req).split(/[,&]/).map(r => r.trim()).filter(r => r.length > 3);
            const reqDetails = extractDetailedInfo(requirement, [...reqKeywords, 'tasks:', 'processes:', 'features:']);
            
            if (reqDetails.length > 0) {
              context += `   Implementation Details:\n`;
              reqDetails.slice(0, 6).forEach(detail => context += `   - ${detail}\n`);
            }
          }
        });
        context += "\n";
      }
      
      // Technical Constraints - affect implementation approach
      if (capturedRequirements.technicalConstraints && capturedRequirements.technicalConstraints.length > 0) {
        context += "**Technical Constraints & Architecture (must be reflected in design decisions):**\n";
        capturedRequirements.technicalConstraints.forEach((constraint, idx) => {
          context += `${idx + 1}. ${constraint}\n`;
          
          // Extract technical details
          const techKeywords = String(constraint).split(/[,&]/).map(t => t.trim()).filter(t => t.length > 3);
          const techDetails = extractDetailedInfo(requirement, [...techKeywords, 'integration:', 'platform:', 'system:']);
          
          if (techDetails.length > 0) {
            techDetails.slice(0, 4).forEach(detail => context += `   - ${detail}\n`);
          }
        });
        context += "\n";
      }
      
      // Non-Functional Requirements - affect component specs
      if (capturedRequirements.nonFunctionalRequirements && capturedRequirements.nonFunctionalRequirements.length > 0) {
        context += "**Non-Functional Requirements (inform performance, security, accessibility):**\n";
        capturedRequirements.nonFunctionalRequirements.forEach((req, idx) => {
          context += `${idx + 1}. ${req}\n`;
          
          // Extract NFR details
          const nfrKeywords = String(req).split(/[,&]/).map(n => n.trim()).filter(n => n.length > 3);
          const nfrDetails = extractDetailedInfo(requirement, nfrKeywords);
          
          if (nfrDetails.length > 0) {
            nfrDetails.slice(0, 3).forEach(detail => context += `   - ${detail}\n`);
          }
        });
        context += "\n";
      }

      // Add a domain-specific context section
      const domain = detectDomain(requirement);
      if (domain !== 'General') {
        context += `**Domain Context: ${domain}**\n`;
        context += `Design must use ${domain.toLowerCase()}-specific terminology, workflows, and visual patterns.\n\n`;
      }

      console.log("[AI Service] Enhanced context length:", context.length);
      console.log("[AI Service] Context includes detailed workflows:", context.includes('Implementation Details') || context.includes('Role & Responsibilities'));
      return context;
    };

    const requirementsContext = buildEnhancedContext();

    // ============================================
    // FIX 2: More Explicit System Prompt
    // ============================================
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `You are a Senior UI/UX Design System Architect specializing in production-ready Figma Make AI prompts.

CORE MISSION: Generate comprehensive, copy-paste ready Figma Make guidelines that produce pixel-perfect, interactive prototypes DEEPLY TAILORED TO THE SPECIFIC PROJECT CONTEXT.

⚠️ CRITICAL REQUIREMENT: You MUST deeply integrate the provided DETAILED project context (business goals, target users WITH their specific roles and tasks, features WITH implementation details, technical constraints, workflows) into EVERY section of your output. 

🚫 FORBIDDEN: Generic templates, placeholder text, vague references. Every design decision must be JUSTIFIED by the specific context provided.

SUCCESS CRITERIA:
✓ Production-grade visuals matching the SPECIFIC project domain
✓ User-specific terminology and workflows EXTRACTED from detailed user role descriptions
✓ Feature-driven layout priorities based on ACTUAL feature implementation details
✓ Constraint-aware implementation notes using SPECIFIC technical stack mentioned
✓ Complete interaction patterns & micro-animations
✓ Responsive layouts (mobile/tablet/desktop)
✓ WCAG 2.1 AA accessibility compliance
✓ Real, domain-specific data patterns (no Lorem Ipsum - use actual examples from context)
✓ Developer-friendly specs (exact measurements, colors)

DESIGN PHILOSOPHY: Follow enterprise patterns from Linear, GitHub, Atlassian, Microsoft Fluent, Salesforce Lightning.

CONTEXT INTEGRATION MANDATE:
- When you see "Claims Processors review FNOL data" → Design a Claims Intake screen with FNOL review workflow
- When you see "Multi-Channel Data Capture via API/web/email" → Show multi-channel input components in layouts
- When you see "Microservices on AWS with Docker/Kubernetes" → Reference cloud-native, scalable architecture in technical notes
- When you see "Legal teams perform audits" → Include audit trail components and compliance-focused UI elements

FIGMA MAKE COMPATIBILITY:
- Precise, descriptive language
- Exact measurements (px/rem/Tailwind classes)
- All component states (hover/focus/active/disabled/loading/error)
- Color values (HEX/RGB/HSL)
- Realistic content examples FROM THE PROJECT DOMAIN (extracted from context)
- Animation timing & easing
- Reference actual user workflows and feature details provided in context`
        },
        {
          role: "user",
          content: `Generate production-ready Figma Make AI guidelines for: "${requirement}"

${requirementsContext}

⚠️ MANDATORY INTEGRATION REQUIREMENTS:

**YOU MUST USE THE DETAILED CONTEXT ABOVE - NOT GENERIC TEMPLATES**

The context provided includes:
- Specific user roles WITH their actual tasks and responsibilities
- Features WITH implementation details (not just feature names)
- Functional requirements WITH workflows and processes
- Technical constraints WITH specific platforms/tools mentioned

**HOW TO INTEGRATE CONTEXT:**

1. **Executive Summary**: 
   - Reference SPECIFIC business goals from context (not "improve efficiency" but "Reduce claim processing time from 30 days to 15 days")
   - Mention primary user roles BY NAME from context (e.g., "Claims Adjusters," "Legal Teams")
   - Explain how design supports ACTUAL stated goals

2. **Color System**: 
   - Justify colors based on domain (e.g., Insurance: blues for trust, greens for approved claims, reds for denials)
   - Consider user environment from context (e.g., field workers need high contrast)

3. **Typography**: 
   - Adjust based on user expertise mentioned in context
   - If "limited tech experience" → larger, clearer fonts
   - If "expert users" → denser information, smaller fonts OK

4. **Layout & Information Architecture**: 
   - Create layouts for EACH functional requirement module mentioned (e.g., "Claims Intake & FNOL," "Workflow Automation & Triage")
   - Use ACTUAL terminology from context (not "Form Screen" but "First Notice of Loss (FNOL) Intake Screen")
   - Structure based on SPECIFIC workflows described

5. **Component Library**: 
   - Add components needed for SPECIFIC features (e.g., if "photo/video upload" mentioned → add file upload component with camera integration)
   - Adapt complexity to target user characteristics from context
   - Include domain-specific components (e.g., "Claim Status Badge," "Policy Verification Card")

6. **Figma Prompt Templates** (MOST CRITICAL): 
   - Generate 3-5 prompts for screens mapping to ACTUAL functional requirements
   - Use EXACT terminology from context (e.g., "FNOL," "Triage," "Adjuster Assignment")
   - Include REALISTIC workflow examples from the detailed context:
     * If context says "Claims Processors review incoming FNOL data for completeness" 
       → Show FNOL review checklist with completeness indicators
     * If context says "Multi-Channel Data Capture via API, web forms, email"
       → Show multi-channel intake interface with source indicators
   - Reference SPECIFIC user roles from context in each prompt
   - Apply SPECIFIC technical constraints (e.g., "cloud-native microservices" → mention API-driven components)

**EXAMPLE TRANSFORMATION:**

❌ WRONG (Generic):
"Create a dashboard for users to view their data"

✅ CORRECT (Context-Specific):
"Create production-ready Claims Adjuster Dashboard for Claims Adjusters/Investigators:

BUSINESS CONTEXT: This dashboard enables Claims Adjusters to conduct thorough investigations, determine coverage based on policy wording, and assess liability/damage using AI tools, supporting the business goal of 'Reduce claim processing cycle time by 40%'.

LAYOUT:
- Left sidebar (256px): Active claims queue with priority indicators (High-Risk flagged in red)
- Main content area (fluid): Selected claim details with tabs: Investigation | Coverage Analysis | Damage Assessment | Payment Authorization
- Right panel (320px): AI-powered damage estimation tool with photo analysis

CONTENT (REALISTIC INSURANCE DOMAIN):
- Claim #CLM-2025-00142: 2019 Honda Accord, Rear-end collision, Policy #POL-89234
- Coverage: Collision coverage confirmed ($500 deductible), Liability limits: $250K/$500K
- Damage estimate: $4,250 (AI preliminary) → Adjuster review required
- Investigation status: Police report received ✓, Photos uploaded (8) ✓, Witness statement pending
- Timeline: FNOL received 2 days ago, Target resolution: 13 days remaining

INTERACTIONS:
- Click claim row → Load full claim file with all documents, photos, communications
- AI Damage Tool: Upload photo → Instant preliminary estimate with confidence score
- Coverage Determination: Policy lookup integration → Real-time coverage validation
- Approve/Reject/Escalate actions with authority level checks (Supervisor approval required for >$10K)

TECHNICAL NOTES: Cloud-native, API-driven components for real-time updates, Mobile-responsive for field adjusters

COLORS: Primary #1E40AF (Insurance Blue) | Success #10B981 (Approved) | Warning #F59E0B (Review Needed) | Error #EF4444 (Denied)
"

**DELIVERABLE STRUCTURE:**

Generate the complete Figma Make Prompt Guide following this EXACT structure with ALL specifications FILLED WITH context-specific details:

# 🎯 FIGMA MAKE PROMPT GUIDE FOR [Extract Project Name from Context]

## EXECUTIVE SUMMARY
[2-3 sentences: Application purpose, target users from context, design philosophy. MUST explicitly reference captured business goals and explain how design decisions support them]

Example: "This [domain] system is designed for [specific users from context] to [achieve specific business goals]. The design prioritizes [key design decision] to support [specific goal], focusing on [user need] through [approach]."

## 1. COLOR SYSTEM & THEMING
**Primary:** [Brand HEX/RGB/HSL - justify choice based on industry/user context from requirements]
**Neutral:** Gray 50 #F9FAFB / 100 #F3F4F6 / 200 #E5E7EB / 300 #D1D5DB / 600 #6B7280 / 900 #111827
**Semantic:** Success #10B981 | Warning #F59E0B | Error #EF4444 | Info #3B82F6
**States:** Hover (90% opacity) | Disabled (40% opacity)
**WCAG:** 4.5:1 minimum for text | 3:1 for UI elements and large text
[If technical constraints mention specific needs (outdoor use, low-light, accessibility), address here with specific color adjustments]

## 2. TYPOGRAPHY SYSTEM
**Fonts:** 'Inter' (primary), system-ui, -apple-system, sans-serif | 'JetBrains Mono' for code blocks
**Scale:**
- Display: 60px (desktop) / 48px (mobile) - Hero headings
- H1: 36px / 1.2 line-height / 600 weight - Page titles
- H2: 30px / 1.3 / 600 - Section headings
- H3: 24px / 1.4 / 600 - Subsection headings
- H4: 20px / 1.5 / 600 - Card titles
- H5: 18px / 1.5 / 600 - Small headings
- H6: 16px / 1.5 / 600 - Labels
- Body Large: 18px / 1.6 / 400 - Feature text
- Body: 16px / 1.6 / 400 - Default body text
- Body Small: 14px / 1.5 / 400 - Secondary text
- Caption: 12px / 1.4 / 400 - Metadata, timestamps
[Adjust sizes based on SPECIFIC user characteristics from context - larger for less tech-savvy users, denser for experts]
**Mobile:** Reduce Display/H1-H2 by 20-40%

## 3. LAYOUT & SPACING SYSTEM
**Grid:**
- Desktop: 1440px max-width / 12 columns / 32px gap
- Tablet: 768-1439px / 8-12 columns / 24px gap
- Mobile: <768px / 4 columns / 16px gap
**Spacing Scale (8pt):** 4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px
**Component Padding:**
- Input fields: 12px vertical × 16px horizontal
- Buttons: 12px vertical × 24px horizontal
- Cards: 24px all sides
- Modal: 32px all sides
- Page container: 48px (desktop) / 24px (mobile)
[Note any mobile-first or responsive priorities from technical constraints]
**Z-index Layers:** Base 0 | Sticky nav 10 | Dropdown 50 | Modal backdrop 100 | Modal content 110 | Tooltip 200 | Toast 300

## 4. COMPREHENSIVE COMPONENT LIBRARY
[Include ALL standard components PLUS domain-specific components needed for ACTUAL features listed in context]

**Buttons** (Primary/Secondary/Ghost/Icon):
- **Medium (default):** 40px height × 12px vertical 24px horizontal padding, 14px medium text, 8px border radius
- **Small:** 32px height, 8px vertical 16px horizontal padding, 12px text
- **Large:** 48px height, 16px vertical 32px horizontal padding, 16px text
- **States:** Default | Hover (darker bg, shadow) | Active (pressed) | Focus (2px ring offset) | Disabled (40% opacity) | Loading (spinner)
[If target users need larger targets per context: Increase to 48-56px height]

**Form Elements:**
- **Text Input:** 40px height, 12px vertical 16px horizontal padding, 1.5px border #E5E7EB, 8px radius, 16px text
- **States:** Focus (brand color border + 3px ring) | Error (red border + error message) | Success (green checkmark) | Disabled (gray bg)
- **Dropdown:** Same as input + chevron icon, dropdown panel max-height 280px with scroll
- **Checkbox/Radio:** 20×20px, 2px border, 4px radius (checkbox) / 50% radius (radio)
- **Toggle Switch:** 44px width × 24px height, 12px border radius (pill), animated transition 200ms
- **Textarea:** 120px minimum height, vertical resize enabled
[Add field types based on functional requirements: file upload, date picker, multi-select, autocomplete]

**Cards:**
- **Standard:** White background, 1px border #E5E7EB, 12px border radius, 24px padding
- **Hover:** Shadow 0 4px 12px rgba(0,0,0,0.1), translate-y -2px, 200ms transition
- **Interactive:** Cursor pointer, focus ring on keyboard navigation
[Adapt structure based on key features - e.g., add photo upload zone, status indicators, action buttons as needed]

**Navigation:**
- **Top Bar:** 64px height, white background, border-bottom 1px, contains logo + search + user actions
- **Sidebar:** 256px width (expanded), 64px width (collapsed), 40px item height, smooth 200ms transition
- **Active State:** #E0EFFF background, brand color text, 3px left border accent
- **Mobile:** Hamburger menu, slide-in drawer, overlay backdrop
[Structure based on user roles from context - different nav items per role, role-specific sections]

**Data Display:**
- **Table:** Header #F9FAFB 48px height | Rows 56px height, zebra striping, hover #F3F4F6 background
- **Columns:** Left-align text, right-align numbers, center-align actions, sortable headers with icons
- **Pagination:** 10/25/50/100 items per page options
- **List:** 64px item height, 16px padding, divider lines, hover state
- **Badge:** 4px vertical 12px horizontal padding, 12px text, full border radius (pill), semantic colors
[Customize columns based on functional requirements - show domain-specific data fields]

**Modals & Overlays:**
- **Modal:** Max-width 600px (small) / 800px (medium) / 1200px (large), 32px padding, 16px border radius, backdrop blur
- **Header:** 24px title, close button top-right, optional subtitle
- **Footer:** Action buttons right-aligned, cancel left
- **Toast Notification:** 360px width, top-right position, 16px padding, 4px left border (semantic color), auto-dismiss 5s, close button
- **Tooltip:** Max-width 280px, dark background (#1F2937), white text, 8px vertical 12px horizontal padding, 500ms show delay
- **Dropdown Menu:** Min-width 200px, 8px padding, shadow-lg, max-height 400px with scroll

**Feedback States:**
- **Loading Spinner:** 20px / 32px / 48px sizes, brand color, 800ms rotation animation
- **Skeleton Loader:** #F3F4F6 to #E5E7EB shimmer gradient, 1.5s animation, matches content shape
- **Progress Bar:** 8px height, 4px border radius, brand color fill, animated transitions
- **Empty State:** 240×180px illustration, 20px heading, 14px description, primary CTA button
[Customize empty state messaging to project domain]

**Domain-Specific Components:** [Add based on context]
Example for Insurance: Claim Status Badge, Policy Verification Card, FNOL Intake Form, Damage Photo Gallery, Adjuster Assignment Widget

## 5. INTERACTION PATTERNS & ANIMATIONS
**Duration:** 100ms (instant) | 150ms (fast) | 250ms (normal) | 400ms (slow)
**Easing:** ease-out (entrances) | ease-in (exits) | ease-in-out (movement/transformation)
**Patterns:**
- **Button:** Hover (background darker + shadow-md + lift 2px, 150ms) | Active (scale 0.98) | Focus (2px ring, instant)
- **Form Field:** Focus (border color change + ring grow, 150ms) | Error (shake animation 400ms, red border)
- **Card:** Hover (shadow-lg + lift 4px, 250ms ease-out)
- **Modal:** Backdrop fade-in 200ms + content scale from 0.95 to 1.0 300ms ease-out
- **Dropdown:** Scale from 0.95 + fade-in 150ms ease-out
- **Page Transition:** Fade 200ms + slight slide 20px
**Micro-interactions:**
- Button click: Ripple effect from click point
- Toggle switch: Sliding knob with spring animation
- Checkbox: Checkmark draw animation 200ms
- Success action: Subtle bounce + green flash
**Accessibility:** Respect prefers-reduced-motion media query
[Add haptic feedback patterns if mobile-heavy usage indicated in context]

## 6. INFORMATION ARCHITECTURE & PAGE LAYOUTS
[Generate ASCII diagrams for layouts that map to EACH functional requirement module from context]
[Each layout MUST address specific user needs and workflows from captured requirements]

**[Primary User Role from Context] Dashboard:**
[Structure based on their specific functional requirements and tasks]
\`\`\`
┌────────────────────────────────────────────────────────────────┐
│  Top Bar: Logo | Search | Notifications | User Menu       [64h]│
├────────┬───────────────────────────────────────────────────────┤
│        │  Main Content Area                                     │
│  Side  │  ┌──────────────────────────────────────────────────┐ │
│  Nav   │  │  Page Header (Title + Actions)              [80h]│ │
│        │  └──────────────────────────────────────────────────┘ │
│ [256w] │  ┌──────────────────────────────────────────────────┐ │
│        │  │  Key Metrics / KPI Cards                    [120h]│ │
│        │  │  [Card 1] [Card 2] [Card 3] [Card 4]             │ │
│        │  └──────────────────────────────────────────────────┘ │
│        │  ┌──────────────────────────────────────────────────┐ │
│        │  │  Primary Data Table / List                       │ │
│        │  │  [Filterable, Sortable, Paginated]               │ │
│        │  │  Based on [specific workflow from context]       │ │
│        │  └──────────────────────────────────────────────────┘ │
└────────┴───────────────────────────────────────────────────────┘
\`\`\`

**[Functional Requirement Module] Screen:**
[Layout supporting specific feature from requirements - use ACTUAL terminology]
\`\`\`
[Create specific layout based on workflow described in context]
\`\`\`

**Mobile Layout (<768px):**
- Stack all columns vertically
- Hamburger menu for navigation
- Full-width components
- Bottom navigation bar for primary actions
- Swipe gestures for common actions

**Navigation Structure:** [Choose based on user roles and workflows from context]
- Top-level: [Primary sections based on user roles]
- Sub-navigation: [Feature-specific areas]
- Quick actions: [Frequently used tasks from context]

**Responsive Behavior:** Mobile <768px | Tablet 768-1439px | Desktop 1440px+

## 7. ACCESSIBILITY & INCLUSIVE DESIGN (WCAG 2.1 AA)
**Color Contrast:** 4.5:1 minimum for normal text | 3:1 for large text (18px+) and UI components
**Focus Indicators:** 2-3px solid outline, brand color, 2-4px offset from element, 3-4px box-shadow ring for depth
**Touch Targets:** 44×44px minimum (mobile), 40×40px acceptable (desktop), 8px spacing between targets
[Increase to 56-80px if users have dexterity challenges or use in field conditions per context]
**Keyboard Navigation:**
- Tab / Shift+Tab: Move between focusable elements
- Enter / Space: Activate buttons, toggle checkboxes
- Escape: Close modals, dropdowns, cancel actions
- Arrow keys: Navigate within menus, lists, date pickers
**ARIA Labels:**
- aria-label for icon-only buttons
- aria-labelledby for complex components
- aria-describedby for help text and errors
- role attributes for custom components
- aria-live regions for dynamic content updates
**Screen Reader Support:**
- Semantic HTML (header, nav, main, section, article, aside, footer)
- Proper heading hierarchy (h1-h6)
- Alt text for all images (descriptive, not decorative)
- Form labels properly associated
**Motion & Animation:** Respect prefers-reduced-motion, provide static alternatives
**Text:** 16px minimum, 1.5-1.7 line-height, max 75 characters per line for readability
**Color Independence:** Never rely on color alone - use icons, text labels, patterns
[Apply non-functional requirements from context - security, compliance, performance needs]

## 8. ICONOGRAPHY & VISUAL ELEMENTS
**Icon Library:** Heroicons (recommended) or Lucide Icons (alternative)
**Sizes:** 12px (inline) / 16px (small) / 20px (medium) / 24px (large) / 32px (featured) / 48px (hero)
**Stroke:** Outlined style, 1.5-2px stroke width for consistency
**Colors:**
- Default: #6B7280 (gray-500)
- Hover: #111827 (gray-900)
- Active: Brand color (e.g., #0066CC)
- Disabled: #D1D5DB (gray-300)
**Common Icons:**
- Navigation: home, menu, search, settings, user, bell (notifications)
- Actions: add, edit, delete, download, upload, share, copy, more (⋯)
- UI: chevron-up/down/left/right, arrow-up/down/left/right, close (×), check (✓), info (ⓘ)
- Status: success (✓), warning (⚠), error (✕), pending (○)
[Add domain-specific icons based on key features from context]
Example for Insurance: claim-file, policy-document, damage-photo, approval-stamp, investigation-magnifier

**Illustrations & Empty States:**
- Size: 240×180px (standard), 320×240px (large)
- Style: Simple, friendly, on-brand colors
- Empty State Structure: Illustration + 20px heading + 14px description + primary CTA button
- Messaging: [Customize to project domain - use actual terminology]
Example: "No claims found" vs "No pending investigations" vs "No active policies"

**Error States:**
- Icon + clear error message + suggested action / retry button
- Inline for forms, modal for critical errors, toast for non-blocking errors

**Avatars:**
- Sizes: 24px (inline) / 32px (list) / 40px (card) / 64px (profile card) / 96px (profile header)
- Style: Circular, initials on colored background if no photo, 1px border

## 9. FIGMA MAKE AI PROMPT TEMPLATES ⚠️ CRITICAL SECTION
[Generate 3-5 copy-paste ready prompts that directly map to functional requirements from context]
[MUST use actual terminology, user roles, and workflows from captured context - NO generic placeholders]

### Prompt 1: [Actual Functional Requirement Screen from Context]
\`\`\`
Create production-ready [screen name using EXACT terminology from context] for [specific user role from context]:

BUSINESS CONTEXT: This screen enables [user role] to [accomplish SPECIFIC functional requirement from context], supporting the business goal: [ACTUAL goal from context].

LAYOUT:
- [Specific structure with exact measurements based on workflow]
- [Components addressing functional requirements - list 4-6 key elements]
- [User-appropriate complexity level based on user characteristics from context]

CONTENT (REALISTIC EXAMPLES FROM [DOMAIN] DOMAIN):
- [Use ACTUAL terminology from project context]
- [Show realistic workflow: step-by-step based on functional requirements]
- [Example data relevant to domain - realistic names, numbers, statuses]
- [3-5 specific examples that match the actual use case]

INTERACTIONS:
- [Specific to user capabilities and tasks from context]
- [Include technical constraint considerations - API calls, real-time updates, offline support]
- [List 4-6 key interactions with expected behavior]

TECHNICAL NOTES: [Apply SPECIFIC technical constraints from context - cloud-native, microservices, mobile-responsive, etc.]

COLORS: Primary [HEX from color system] | Success #10B981 | Warning #F59E0B | Error #EF4444 | Background #FFFFFF | Text #111827

RESPONSIVE: [Based on technical constraints - if mobile-first specified, detail mobile layout first]

ACCESSIBILITY: WCAG 2.1 AA compliant - 4.5:1 contrast, keyboard navigation, ARIA labels, screen reader support, [apply any specific non-functional requirements]

Include all states (hover/focus/active/disabled/loading/error), realistic [domain] content matching [specific user role] workflows, smooth animations (150-250ms ease-out), professional polish with 8pt spacing grid.
\`\`\`

### Prompt 2: [Another Key Feature Screen from Context]
[Similar detailed structure with DIFFERENT functional requirement - use ACTUAL terminology]

### Prompt 3: [Another User Role Screen from Context]
[Tailored to DIFFERENT user from target users list - show their specific workflow]

[Include 2-3 more prompts if you have sufficient functional requirements in context]

## 10. RESPONSIVE DESIGN BREAKPOINTS
**Mobile (<768px):**
- Single column layout
- 16px container padding
- 48×48px minimum touch targets
- Hamburger navigation menu
- Stack all elements vertically
- Full-width forms and buttons
- Bottom navigation bar for primary actions
- Simplified tables (convert to cards)

**Tablet (768-1439px):**
- 2-column grids for content
- 32px container padding
- Collapsible sidebar navigation
- Hybrid touch + mouse interactions
- Medium-density information display

**Desktop (1440px+):**
- Multi-column layouts (2-4 columns)
- 48px container padding
- Persistent sidebar navigation
- Hover states for all interactive elements
- High-density information display
- Multi-panel layouts (list + detail views)

[Prioritize based on technical constraints - if mobile-first specified in context, design mobile → tablet → desktop]

**Component Responsive Behavior:**
- **Tables:** Horizontal scroll (mobile) | Stacked cards (alternative) | Full table (desktop)
- **Modals:** Fullscreen (mobile) | Centered with backdrop (tablet/desktop)
- **Forms:** Full-width (mobile) | Max 640px centered (desktop)
- **Navigation:** Drawer (mobile) | Collapsible sidebar (tablet) | Fixed sidebar (desktop)
- **Cards:** 1 column (mobile) | 2 columns (tablet) | 3-4 columns (desktop)

## 11. PRODUCTION CHECKLIST
**Design Quality:**
☐ Colors pass WCAG AA contrast requirements (4.5:1 text, 3:1 UI elements)
☐ All component states defined (minimum 6 per interactive component: default, hover, focus, active, disabled, loading)
☐ Typography scale consistent (16px minimum, 1.5+ line-height)
☐ Spacing follows 8pt grid system throughout
☐ Touch targets meet requirements (44×44px mobile, 40×40px desktop minimum)
☐ Focus indicators visible (2-3px outline + ring shadow)
☐ All icons have consistent stroke width and style

**Interaction & Behavior:**
☐ Keyboard navigation fully functional (Tab, Enter, Escape, Arrows)
☐ Animations respect prefers-reduced-motion
☐ Loading states defined for all async operations
☐ Error states with clear messages and recovery actions
☐ Empty states with helpful messaging and CTAs

**Content & Context:**
☐ Responsive layouts tested at 3 breakpoints (mobile, tablet, desktop)
☐ Realistic [domain-specific] content used (no Lorem Ipsum or generic placeholders)
☐ Actual terminology from project context throughout
☐ User workflows match functional requirements from context

**Technical Requirements:**
☐ Technical constraints from context addressed in design
☐ Non-functional requirements met (security, performance, compliance)
☐ Integration points identified for APIs and external systems
☐ Offline capabilities considered if mentioned in context

**Accessibility (WCAG 2.1 AA):**
☐ Semantic HTML structure used
☐ ARIA labels for all interactive elements
☐ Alt text for all meaningful images
☐ Form labels properly associated
☐ Screen reader tested (or documented for testing)

## 12. FINAL INSTRUCTIONS & USAGE GUIDELINES

**When Using These Guidelines in Figma Make AI:**

**Context Integration Checklist:**
✅ Reference SPECIFIC business goals in layout priorities and feature prominence
✅ Use terminology from target user roles consistently (avoid generic "user" or "admin")
✅ Map every screen to functional requirements from context
✅ Apply technical constraints as implementation notes in prompts
✅ Reflect non-functional requirements in component specifications
✅ Use realistic, domain-specific content examples (actual workflow steps, realistic data)
✅ Design for ACTUAL user characteristics (tech-savvy vs novice, mobile vs desktop, field vs office)

**Best Practices for Prompt Engineering:**
• **Always specify exact measurements** (px/rem values) and color codes (HEX/RGB)
• **Include ALL component states** - never skip disabled, loading, or error states
• **Provide realistic content examples** - use domain terminology and actual workflow scenarios
• **Mention WCAG AA compliance** explicitly with contrast ratios and keyboard navigation
• **Specify animation details** - duration, easing function, and trigger conditions
• **Reference user roles and workflows** from captured context in every prompt
• **Apply technical constraints** - mention API-driven, cloud-native, offline-first as relevant
• **Include non-functional requirements** - security, performance, scalability needs

**Template for Final Figma Make Prompt:**
"Create production-ready [screen name using actual terminology from context] for [specific user role with their responsibilities] following these design guidelines:

**Purpose:** This screen enables [user role] to [specific functional requirement], supporting the business goal of [actual goal from context].

**Layout:** [Detailed structure with measurements] including [specific components based on workflow].

**Content:** Use realistic [domain] terminology and data:
• [Specific example 1 from context]
• [Specific example 2 from context]
• [Specific example 3 from context]

**Interactions:** [List 4-6 key interactions based on user tasks from context]

**Technical:** [Apply constraints from context - e.g., API-driven components, real-time updates, cloud-native architecture]

**Design System:** Follow [COLOR SYSTEM], [TYPOGRAPHY SYSTEM], [SPACING SYSTEM] from guidelines above. Include all component states (default, hover, focus, active, disabled, loading, error), WCAG AA accessibility (4.5:1 contrast, visible focus indicators, keyboard navigation), responsive layouts for [prioritize based on constraints], smooth animations (150-250ms ease-out), and professional polish with consistent 8pt spacing, appropriate shadows (shadow-sm/md/lg), and clear typography hierarchy."

**Common Mistakes to Avoid:**
❌ Using generic placeholders like "Lorem ipsum" or "User Dashboard"
❌ Forgetting to specify component states beyond default
❌ Ignoring captured context - designing generic screens without domain specificity
❌ Missing measurements - saying "large button" instead of "48px height button"
❌ Overlooking accessibility - no focus states or keyboard navigation mentioned
❌ Generic user roles - "admin" instead of "Claims Supervisor with approval authority"
❌ Vague interactions - "user clicks button" instead of "Click 'Submit FNOL' → Validation → API call → Success toast → Navigate to claim details"

**Quality Validation:**
Before submitting to Figma Make, verify your prompt includes:
1. ✅ SPECIFIC terminology from project context (not generic terms)
2. ✅ ACTUAL user role names and their responsibilities
3. ✅ REALISTIC content examples matching the domain
4. ✅ EXACT measurements (px values for all spacing, sizing)
5. ✅ ALL component states explicitly listed
6. ✅ Technical constraints from context applied
7. ✅ Accessibility requirements specified (WCAG AA)
8. ✅ Animation timings and easing functions

---

⚠️ **CRITICAL REMINDER:** Every section of this guide MUST reflect the captured project context. Generic outputs that don't integrate specific business goals, actual user roles with their tasks, detailed functional requirements, and technical constraints will NOT produce effective Figma Make prototypes that match stakeholder expectations. Always extract and use SPECIFIC details from the context provided. Every screen, component, and interaction should map to ACTUAL requirements, not generic assumptions.`
        }
      ],
      temperature: 0.7, // Slightly higher for more creative context integration
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    if (!content) {
      console.error("[AI Service] AI returned empty content for design guidelines");
      throw new Error("Empty AI response for design guidelines.");
    }

    // ============================================
    // FIX 3: Validation of Generated Content
    // ============================================
    const validateContextIntegration = (content: string): boolean => {
      if (!capturedRequirements) return true;

      const validationChecks = [];

      // Check if business goals are referenced
      if (capturedRequirements.businessGoals && capturedRequirements.businessGoals.length > 0) {
        const hasBusinessGoalReference = capturedRequirements.businessGoals.some(goal => 
          content.toLowerCase().includes(goal.toLowerCase().substring(0, 20))
        );
        validationChecks.push({ check: 'Business Goals Referenced', passed: hasBusinessGoalReference });
      }

      // Check if target users are mentioned
      if (capturedRequirements.targetUsers && capturedRequirements.targetUsers.length > 0) {
        const hasUserReference = capturedRequirements.targetUsers.some(user => 
          content.toLowerCase().includes(user.toLowerCase().substring(0, 15))
        );
        validationChecks.push({ check: 'Target Users Mentioned', passed: hasUserReference });
      }

      // Check if key features are present
      if (capturedRequirements.keyFeatures && capturedRequirements.keyFeatures.length > 0) {
        const hasFeatureReference = capturedRequirements.keyFeatures.some(feature => 
          content.toLowerCase().includes(feature.toLowerCase().substring(0, 15))
        );
        validationChecks.push({ check: 'Key Features Included', passed: hasFeatureReference });
      }

      const failedChecks = validationChecks.filter(v => !v.passed);
      
      if (failedChecks.length > 0) {
        console.warn("[AI Service] Context integration validation warnings:", failedChecks);
        console.warn("[AI Service] Generated content may be too generic!");
      }

      console.log("[AI Service] Context integration validation:", validationChecks);
      
      // Return true but log warnings - don't block the response
      return true;
    };

    validateContextIntegration(content);

    console.log("[AI Service] Design guidelines successfully generated. Length:", content.length);
    console.log("[AI Service] Contains 'FIGMA MAKE':", content.includes('FIGMA MAKE'));
    console.log("[AI Service] Contains business context:", 
      capturedRequirements?.businessGoals?.[0] 
        ? content.includes(capturedRequirements.businessGoals[0].substring(0, 20)) 
        : 'N/A'
    );

    return content;
  } catch (error: any) {
    console.error("[AI Service] Failed to generate design guidelines.");
    console.error("[AI Service] Error details:", {
      message: error.message,
      type: error.constructor.name,
      code: error.code,
      status: error.status
    });
    
    if (error.response) {
      console.error("[AI Service] API Response:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw new Error(`Failed to generate design guidelines: ${error.message || 'Unknown error'}`);
  }
}

// ============================================
// RECOMMENDED: Add helper to extract domain from requirements
// ============================================
export function extractDomainContext(capturedRequirements: any): string {
  // Extract domain keywords from requirements
  const allText = JSON.stringify(capturedRequirements).toLowerCase();
  
  // Domain detection patterns
  const domainPatterns = {
    insurance: ['insurance', 'claim', 'policy', 'claimant', 'adjuster'],
    healthcare: ['patient', 'medical', 'hospital', 'doctor', 'healthcare'],
    finance: ['bank', 'financial', 'payment', 'transaction', 'account'],
    ecommerce: ['product', 'cart', 'checkout', 'order', 'shipping'],
    construction: ['construction', 'site', 'contractor', 'building', 'project'],
  };

  for (const [domain, keywords] of Object.entries(domainPatterns)) {
    const matchCount = keywords.filter(keyword => allText.includes(keyword)).length;
    if (matchCount >= 2) {
      return domain;
    }
  }

  return 'general';
}

export async function generateDesignContent(
  designType: string,
  requirementDocument: string,
  adoBacklogContext?: {
    epics: any[];
    features: any[];
    userStories: any[];
    tasks: any[];
    bugs: any[];
  }
): Promise<string> {
  try {
    console.log(
      "[AI Service] Generating design content for:",
      designType,
    );
    console.log(
      "[AI Service] ADO backlog context provided:",
      adoBacklogContext ? "Yes" : "No"
    );

    const modelName = useAzure
      ? process.env.AZURE_OPENAI_DEPLOYMENT!
      : "gpt-4o";

    // Prepare ADO context section
    let adoContextSection = "";
    if (adoBacklogContext) {
      const { epics, features, userStories, tasks, bugs } = adoBacklogContext;
      const hasAnyData = epics.length > 0 || features.length > 0 || userStories.length > 0 || tasks.length > 0 || bugs.length > 0;
      
      if (hasAnyData) {
        adoContextSection = "\n\n## Azure DevOps Context\n\n";
        adoContextSection += "The following items have been retrieved from Azure DevOps and should inform your design:\n\n";
        
        if (epics.length > 0) {
          adoContextSection += `### Epics (${epics.length})\n`;
          epics.slice(0, 5).forEach((epic: any) => {
            adoContextSection += `- **${epic.title}**: ${epic.description || 'No description'}\n`;
          });
          if (epics.length > 5) adoContextSection += `... and ${epics.length - 5} more epics\n`;
          adoContextSection += "\n";
        }
        
        if (features.length > 0) {
          adoContextSection += `### Features (${features.length})\n`;
          features.slice(0, 10).forEach((feature: any) => {
            adoContextSection += `- **${feature.title}**: ${feature.description || 'No description'}\n`;
          });
          if (features.length > 10) adoContextSection += `... and ${features.length - 10} more features\n`;
          adoContextSection += "\n";
        }
        
        if (userStories.length > 0) {
          adoContextSection += `### User Stories (${userStories.length})\n`;
          userStories.slice(0, 15).forEach((story: any) => {
            const cleanDesc = story.description?.replace(/<[^>]*>/g, '') || 'No description';
            adoContextSection += `- **${story.title}**: ${cleanDesc.substring(0, 150)}...\n`;
          });
          if (userStories.length > 15) adoContextSection += `... and ${userStories.length - 15} more user stories\n`;
          adoContextSection += "\n";
        }
        
        if (tasks.length > 0) {
          adoContextSection += `### Tasks (${tasks.length})\n`;
          tasks.slice(0, 10).forEach((task: any) => {
            const cleanDesc = task.description?.replace(/<[^>]*>/g, '') || 'No description';
            adoContextSection += `- **${task.title}**: ${cleanDesc.substring(0, 100)}...\n`;
          });
          if (tasks.length > 10) adoContextSection += `... and ${tasks.length - 10} more tasks\n`;
          adoContextSection += "\n";
        }
        
        if (bugs.length > 0) {
          adoContextSection += `### Bugs (${bugs.length})\n`;
          bugs.slice(0, 10).forEach((bug: any) => {
            const cleanDesc = bug.description?.replace(/<[^>]*>/g, '') || 'No description';
            adoContextSection += `- **${bug.title}**: ${cleanDesc.substring(0, 100)}...\n`;
          });
          if (bugs.length > 10) adoContextSection += `... and ${bugs.length - 10} more bugs\n`;
          adoContextSection += "\n";
        }
        
        console.log("[AI Service] ADO context prepared, size:", adoContextSection.length);
      }
    }

    // Design type-specific prompts
    const designPrompts: Record<string, string> = {
      "System Architecture": `You are a senior solutions architect. Generate comprehensive System Architecture documentation based on the requirements provided.

Include the following sections:

1. **Architecture Overview**
   - High-level architecture description
   - Key architectural patterns (e.g., microservices, monolithic, event-driven)
   - Technology stack recommendations

2. **System Components**
   - Frontend components and their responsibilities
   - Backend services and APIs
   - Data storage components
   - Third-party integrations

3. **Component Interactions**
   - Data flow diagrams (describe in text)
   - API contracts and communication patterns
   - Authentication and authorization flow

4. **Scalability & Performance**
   - Load balancing strategy
   - Caching mechanisms
   - Database optimization approaches

5. **Security Architecture**
   - Security layers and protocols
   - Data encryption strategies
   - Access control mechanisms

6. **Deployment Architecture**
   - Infrastructure setup
   - CI/CD pipeline design
   - Monitoring and logging strategy

Format as comprehensive architecture documentation.`,

      "Database Design": `You are a database architect. Generate comprehensive Database Design documentation based on the requirements provided.

Include the following sections:

1. **Database Schema Overview**
   - Database type selection (SQL vs NoSQL)
   - Schema design philosophy
   - Normalization approach

2. **Entity-Relationship Model**
   - Core entities and their attributes
   - Relationships between entities (one-to-one, one-to-many, many-to-many)
   - Primary and foreign key definitions

3. **Table Definitions**
   - Detailed table structures with columns, data types, and constraints
   - Indexes for performance optimization
   - Unique constraints and validations

4. **Data Integrity**
   - Referential integrity rules
   - Cascading delete/update strategies
   - Check constraints and business rules

5. **Query Optimization**
   - Expected query patterns
   - Index strategy
   - Partitioning recommendations

6. **Data Migration Strategy**
   - Schema versioning approach
   - Migration scripts planning
   - Rollback strategies

Format as comprehensive database design documentation.`,

      "Component Design": `You are a senior frontend architect. Generate comprehensive Component Design documentation based on the requirements provided.

Include the following sections:

1. **Component Architecture**
   - Component hierarchy and structure
   - Component categorization (containers, presentational, utility)
   - Reusability strategy

2. **Core Components**
   - List of main UI components
   - Component responsibilities and props
   - State management approach

3. **Component Specifications**
   - Input/output interfaces for each component
   - Event handling patterns
   - Error handling within components

4. **Styling Strategy**
   - CSS methodology (CSS Modules, Styled Components, Tailwind, etc.)
   - Theme configuration
   - Responsive design approach

5. **Component Communication**
   - Parent-child communication patterns
   - Global state management
   - Context usage strategies

6. **Testing Strategy**
   - Unit testing approach for components
   - Integration testing patterns
   - Accessibility testing requirements

Format as comprehensive component design documentation.`,
    };

    const systemPrompt = designPrompts[designType] || designPrompts["System Architecture"];

    const userPrompt = `Generate detailed ${designType} documentation based on these requirements:

${requirementDocument}${adoContextSection}

${adoContextSection ? 'IMPORTANT: Incorporate the Azure DevOps context above into your design. Ensure the design aligns with the epics, features, and user stories provided. Reference specific work items where relevant.' : ''}

Provide comprehensive, production-ready documentation that can be used by the development team.`;

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log("[AI Service] Design content generated, length:", content.length);

    if (!content) {
      throw new Error("AI returned empty response for design content");
    }

    return content;
  } catch (error) {
    console.error("[AI Service] Error generating design content:", error);
    if (error instanceof Error) {
      console.error("[AI Service] Error details:", error.message, error.stack);
    }
    throw error;
  }
}

export async function generateCodeFromUserStories(
  userStories: Array<{
    id: string;
    title: string;
    description: string;
    acceptanceCriteria?: string;
  }>,
  projectName: string,
): Promise<string> {
  try {
    console.log(
      "[AI Service] Generating code from user stories for project:",
      projectName,
    );

    const modelName = useAzure
      ? process.env.AZURE_OPENAI_DEPLOYMENT!
      : "gpt-4o";

    // Create a formatted list of user stories
    const storiesText = userStories
      .map(
        (story, index) => `
### User Story ${index + 1}: ${story.title}
**Description:** ${story.description}
${story.acceptanceCriteria ? `**Acceptance Criteria:** ${story.acceptanceCriteria}` : ""}
`,
      )
      .join("\n");

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `You are a senior full-stack developer. Generate production-ready, well-structured code based on user stories. 

Follow these guidelines:
1. Use modern TypeScript/JavaScript best practices
2. Include proper error handling and validation
3. Add meaningful comments for complex logic
4. Structure code with clear separation of concerns
5. Include necessary imports and dependencies
6. Follow RESTful API design principles for backend code
7. Use React best practices for frontend components
8. Include type definitions where appropriate

Generate clean, maintainable code that directly implements the user story requirements.`,
        },
        {
          role: "user",
          content: `Generate initial code implementation for the "${projectName}" project based on these user stories:

${storiesText}

Please generate:
1. A main application file (app.ts or index.ts) that sets up the basic structure
2. Key components or modules based on the user stories
3. API routes or handlers if applicable
4. Type definitions and interfaces
5. Basic configuration and setup code

Format the output as a structured code file that can be used as the initial codebase. Include file separators to show different modules/files if needed.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log("[AI Service] Code generated, length:", content.length);

    if (!content) {
      throw new Error("AI returned empty response for code generation");
    }

    return content;
  } catch (error) {
    console.error("[AI Service] Error generating code:", error);
    if (error instanceof Error) {
      console.error("[AI Service] Error details:", error.message, error.stack);
    }
    throw error;
  }
}

export async function classifyUserIntent(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<boolean> {
  try {
    console.log("[AI Service] Classifying user intent for:", userMessage);

    const modelName = useAzure
      ? process.env.AZURE_OPENAI_DEPLOYMENT!
      : "gpt-4o";

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `You are an intent classifier. Your job is to determine if the user is explicitly requesting to generate artifacts (epics, features, user stories, backlog).

Respond with ONLY "YES" or "NO".

YES examples:
- "create user stories"
- "generate artifacts"
- "let's proceed with generation"
- "not a problem, let's generate"
- "let's not waste time, generate artifacts"
- "ready to create epics"
- "go ahead and generate"

NO examples:
- "let's not generate yet"
- "don't create artifacts"
- "not ready"
- "shouldn't proceed"
- "wait, don't generate"
- "I need more time"

Focus on the OVERALL INTENT, not individual words. If the user clearly wants artifact generation despite using words like "not" in other contexts, answer YES.`,
        },
        {
          role: "user",
          content: `Based on this conversation, is the user requesting artifact generation?

Recent conversation:
${conversationHistory
  .slice(-3)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Latest user message: "${userMessage}"

Answer ONLY with YES or NO:`,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const answer =
      response.choices[0]?.message?.content?.trim().toUpperCase() || "NO";
    const isReady = answer === "YES";

    console.log(
      "[AI Service] Intent classification result:",
      answer,
      "→",
      isReady,
    );
    return isReady;
  } catch (error) {
    console.error("[AI Service] Error classifying intent:", error);
    return false; // Default to not ready on error
  }
}
// ============================================================================
// 🧠 Helper: Generate contextual quick replies (Copilot-style UX)
// ============================================================================
function generateQuickReplies(questionText: string): string[] {
  if (!questionText) return [];
  const q = questionText.toLowerCase();
  const includesAny = (arr: string[]) => arr.some((k) => q.includes(k));

  // --- Yes / No style questions ---
  if (
    includesAny([
      "do you need",
      "do you want",
      "should we",
      "would you like",
      "is this",
      "will this",
      "can users",
      "does this",
    ])
  ) {
    return ["Yes", "No", "Not sure yet"];
  }

  // --- Target users ---
  if (
    includesAny([
      "who will use",
      "who are the",
      "target user",
      "target audience",
      "primary user",
      "main user",
      "personas",
    ])
  ) {
    return [
      "Customers",
      "Employees",
      "Administrators",
      "Multiple user types",
      "Let me explain...",
    ];
  }

  // --- Platform / device type ---
  if (includesAny(["platform", "mobile", "web app", "desktop", "tablet"])) {
    return ["Web", "Mobile", "Desktop", "Web & Mobile", "All platforms"];
  }

  // --- Timeline / delivery ---
  if (
    includesAny(["timeline", "how long", "deadline", "release", "delivery"])
  ) {
    return [
      "1–3 months",
      "3–6 months",
      "6–12 months",
      "12+ months",
      "Flexible",
    ];
  }

  // --- Priority / importance ---
  if (includesAny(["priority", "important", "critical", "urgent"])) {
    return ["High", "Medium", "Low"];
  }

  // --- Team size ---
  if (includesAny(["team size", "people involved", "how many people"])) {
    return ["1–10", "11–50", "51–200", "200+", "Not sure"];
  }

  // --- Authentication ---
  if (includesAny(["login", "authentication", "sign in", "user accounts"])) {
    return ["Required", "Not required", "Social login only"];
  }

  // --- Integration / API ---
  if (includesAny(["integration", "api", "external service", "third-party"])) {
    return ["Yes, will integrate", "No integrations", "Not sure yet"];
  }

  // --- MVP scope ---
  if (includesAny(["mvp", "initial release", "first version"])) {
    return [
      "Basic core features",
      "Include analytics",
      "Include authentication",
      "Not sure yet",
    ];
  }

  // --- Business goals ---
  if (includesAny(["goal", "objective", "main outcome", "business purpose"])) {
    return [
      "Improve efficiency",
      "Enhance UX",
      "Automate workflow",
      "Reduce cost",
      "Increase revenue",
    ];
  }

  return [];
}

export async function generateConversationQuestion(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  capturedRequirements: any,
  currentPhase: string,
  askedQuestions: string[] = [],
): Promise<{
  question: string;
  phase: string;
  quickReplies?: string[];
  capturedInfo?: any;
  readyToGenerate?: boolean;
}> {
  try {
    console.log("[AI Service] Generating conversation question");
    console.log("[AI Service] Current phase:", currentPhase);
    console.log(
      "[AI Service] Conversation history length:",
      conversationHistory.length,
    );

    const modelName = useAzure
      ? process.env.AZURE_OPENAI_DEPLOYMENT!
      : "gpt-4o";

    // Detect if user is asking a counter-question or seeking clarification
    const lastUserMessage =
      conversationHistory[conversationHistory.length - 1]?.content || "";
    const isCounterQuestion =
      lastUserMessage.includes("?") ||
      lastUserMessage.toLowerCase().includes("what do you mean") ||
      lastUserMessage.toLowerCase().includes("can you explain") ||
      lastUserMessage.toLowerCase().includes("clarify") ||
      lastUserMessage.toLowerCase().includes("could you") ||
      lastUserMessage.toLowerCase().includes("what is");

    console.log(
      "[AI Service] User asking counter-question:",
      isCounterQuestion,
    );
    console.log(
      "[AI Service] Previously asked questions:",
      askedQuestions.length,
    );

    // Detect if this is a greeting or casual conversation starter
    const isGreeting =
      conversationHistory.length <= 3 &&
      /^(hey|hi|hello|sup|yo|what's up|howdy|greetings|good morning|good afternoon|good evening)/i.test(
        lastUserMessage.trim(),
      );

    // Detect if user is asking about capabilities / help
    // CRITICAL: Only detect help questions at the START of conversation (first 5 messages)
    // Mid-conversation, user responses should never trigger help fallbacks
    const isHelpQuestion = conversationHistory.length <= 5 && (
      /what can you (help|do|assist)/i.test(lastUserMessage) ||
      /what (do you|can you) do/i.test(lastUserMessage) ||
      /how (do|can) (i|you) use this/i.test(lastUserMessage) ||
      /^(help|show me|tell me about)/i.test(lastUserMessage.trim()) ||
      lastUserMessage.toLowerCase().includes("capabilities") ||
      lastUserMessage.toLowerCase().includes("what is this for") ||
      lastUserMessage.toLowerCase() === "what can you help with?"
    );

    // Detect if user wants to start refinement session
    const isStartRequest =
      lastUserMessage.toLowerCase() === "start new refinement session" ||
      lastUserMessage.toLowerCase() === "start refining a requirement" ||
      lastUserMessage.toLowerCase() === "start refining" ||
      lastUserMessage.toLowerCase().includes("let's start") ||
      lastUserMessage.toLowerCase().includes("let's begin") ||
      /can (we|i) start/i.test(lastUserMessage) ||
      /ready to (start|begin|refine)/i.test(lastUserMessage) ||
      /shall we (start|begin)/i.test(lastUserMessage) ||
      (/^(start|begin|let'?s (start|begin))/i.test(lastUserMessage.trim()) && conversationHistory.length <= 5);

    console.log("[AI Service] Help question detected:", isHelpQuestion);
    console.log("[AI Service] Start request detected:", isStartRequest);

    // Build working memory from conversation and captured requirements
    const workingMemory = {
      projectType: capturedRequirements.businessGoals[0] || "Not yet defined",
      confirmedUsers: capturedRequirements.targetUsers || [],
      confirmedFeatures: capturedRequirements.keyFeatures || [],
      confirmedGoals: capturedRequirements.businessGoals || [],
      excludedTopics: capturedRequirements.excludedTopics || [], // Topics user explicitly said "no" to
      impliedNeeds: capturedRequirements.impliedNeeds || [], // Things we can infer from context
      technicalContext: capturedRequirements.technicalConstraints || [],
      functionalReqs: capturedRequirements.functionalRequirements || [],
      nonFunctionalReqs: capturedRequirements.nonFunctionalRequirements || [],
      currentPhase,
      questionsAsked: askedQuestions.length,
      totalInfoGathered: Object.values(capturedRequirements)
        .flat()
        .filter(Boolean).length,
    };

    // Detect explicit "no" responses to mark topics as closed
    const userSaidNo =
      /^(no|nope|nah|not really|don't need|not applicable|skip|none)/i.test(
        lastUserMessage.trim(),
      );

    // Detect confirmation responses
    const userConfirmed =
      /^(yes|yeah|yep|correct|that's right|that's accurate|sounds good|looks good|exactly)/i.test(
        lastUserMessage.trim(),
      );

    // CRITICAL: Detect when user explicitly confirms they want to generate artifacts
    // This should immediately trigger artifact generation, NOT ask more questions
    const userConfirmedGeneration =
      lastUserMessage.toLowerCase().includes("yes, generate artifacts") ||
      lastUserMessage.toLowerCase().includes("yes generate") ||
      lastUserMessage.toLowerCase().includes("please generate artifacts") ||
      lastUserMessage.toLowerCase().includes("generate the artifacts") ||
      lastUserMessage.toLowerCase().includes("let's generate") ||
      (lastUserMessage.toLowerCase().includes("yes") && 
       lastUserMessage.toLowerCase().includes("artifact")) ||
      lastUserMessage.toLowerCase() === "option 1" ||
      lastUserMessage.toLowerCase() === "option 2";

    // Check if the previous AI message asked about generating artifacts
    const previousAIMessage = conversationHistory.length >= 2 
      ? conversationHistory[conversationHistory.length - 2]?.content || ""
      : "";
    const previousAskedAboutGeneration = 
      previousAIMessage.toLowerCase().includes("would you like me to generate") ||
      previousAIMessage.toLowerCase().includes("generate the agile artifacts");

    // If user confirmed generation after being asked, return readyToGenerate immediately
    if (userConfirmedGeneration && previousAskedAboutGeneration) {
      console.log("[AI Service] User confirmed artifact generation - returning readyToGenerate=true");
      return {
        question: "Perfect! Let me generate the artifacts based on our discussion. This may take a moment...",
        phase: "artifacts",
        quickReplies: [],
        readyToGenerate: true,
        capturedInfo: undefined,
      };
    }

    const systemPrompt = `# Interactive Agile Story Assistant

## ROLE & PURPOSE:
You are an intelligent, friendly, and highly interactive AI assistant designed to help users create Agile user stories, backlogs, tasks, and subtasks.
     
    ## GREETINGS, HELP, AND META-INTENTS HANDLING

    Before asking any project or refinement-related question, always check if the user's last message is a **greeting, thank-you, or help/meta-intent**.

    ### 1. Greetings
    If the user says something like "hi", "hello", "hey", "good morning", or similar:
    - Respond warmly and naturally.
    - Do **not** jump directly into requirement or discovery questions.
    - Instead, introduce yourself briefly and offer next-step options.
    - Keep it light, conversational, and friendly.

    **Example Response:**
    "Hey there! I'm Tia, your Interactive Agile Story Assistant. I help you turn ideas or requirements into clear, professional user stories with acceptance criteria and test cases. Would you like to start refining a requirement, or would you like to know more about how I can help?"

    After the user confirms or chooses an option, only then begin requirement gathering.

    ### 2. Help / What can you do
    If the user asks "what can you do", "how do I use this", or "help":
    - Provide a short capability summary in 3–4 bullet points.
    - Then ask what they’d like to do first.

    **Example:**
    "Sure! Here’s what I can help you with:
    • Refine raw requirements into user stories  
    • Generate detailed Agile artifacts for Jira or Azure DevOps  
    • Ask clarifying questions step by step  
    • Export stories with epics, acceptance criteria, and subtasks

    Would you like to start refining a requirement or explore the process first?"

    ### 3. Thanks / Appreciation
    If the user says "thanks", "thank you", or similar:
    - Acknowledge politely.
    - Offer a natural continuation (e.g., “Anytime! Would you like to keep refining or wrap up this session?”).

    ### 4. Unknown or Unclear Messages
    If the message doesn’t fit refinement flow and isn’t clear:
    - Respond with gentle clarification.
    **Example:** “Got it — could you please tell me if you want to start refining a new backlog item or continue from where we left off?”


Your main goal is to make the conversation feel human, natural, and context-aware, while guiding the user step-by-step to create clear and complete user stories with title, description, acceptance criteria, and test cases.

## CORE BEHAVIOR GUIDELINES:

### 1. Human-Like Tone:
- Always sound warm, polite, and conversational
- Avoid robotic or overly formal language  
- Use phrases like "Got it!", "That's great!", "Sounds interesting!", "Let's refine that a bit…"
- Be concise yet engaging - keep responses short (3-5 sentences max) but meaningful and well-structured
- Avoid long paragraphs unless summarizing the final story

### 2. Interactive Flow:
- **Never ask multiple broad questions at once** - guide the conversation step-by-step
- Each message should:
  • **Acknowledge what the user just said** - show you're listening and understood
  • **Ask the next most relevant question** to move the story forward
  • **Reference context from earlier messages** - maintain conversational continuity

**Example of Good Flow:**
"Got it! You mentioned this is for the Dashboard UI. Could you please tell me who the primary users of this dashboard will be?"

### 3. Context Awareness:
- **Always remember the conversation context** - project type, users, features, and previous answers
- **Avoid repeating questions** that were already answered
- **Rephrase or summarize** the user's input before moving forward
- **Adapt your tone** to match the user's style (casual or formal)

### 4. Clarification When Needed:
If the user provides incomplete or unclear information, ask gentle, specific follow-ups.

**Example:**
"Could you clarify what kind of data you'd like to display on the dashboard — for example, metrics, tasks, or performance stats?"

### 5. Be Concise Yet Engaging:
Keep responses short (3-5 sentences max) but meaningful. Avoid long paragraphs unless providing the final user story.

### 6. Stay Goal-Oriented:
Keep the conversation focused on creating complete, high-quality user stories, but make the process smooth, friendly, and engaging. Always think from a product and user experience perspective, ensuring the story has purpose and business value.

### QUICK REPLY SUGGESTIONS
Whenever possible, include **quickReplies (chips)** in your JSON response to make interaction faster.  
Use them like Microsoft Copilot-style suggestions:
- For yes/no questions → ["Yes", "No", "Not sure yet"]
- For user type questions → ["Customers", "Employees", "Administrators"]
- For platform questions → ["Web", "Mobile", "Desktop", "All platforms"]
- For timeline questions → ["1–3 months", "3–6 months", "Flexible"]
- For priority questions → ["High", "Medium", "Low"]
- For team size questions → ["1–10", "11–50", "51–200", "200+"]
- For authentication questions → ["Required", "Not required", "Social login only"]
- For integration questions → ["Yes, will integrate", "No integrations", "Not sure yet"]
- For MVP scope questions → ["Basic core features", "Include analytics", "Include authentication"]
- For business goal questions → ["Improve efficiency", "Enhance UX", "Automate workflow"]

## HANDLING DIFFERENT USER INPUTS:

${
  isGreeting
    ? `### GREETING DETECTED:
The user just greeted you with a simple greeting like "hi" or "hello". 

CRITICAL INSTRUCTION: Do NOT jump directly into requirement questions. Instead:
1. Greet them warmly back
2. Introduce yourself briefly as Tia, the Interactive Agile Story Assistant
3. Explain what you can help with in 1-2 sentences
4. Offer them choices or options for what they'd like to do next

Example response:
"Hey there! I'm Tia, your Interactive Agile Story Assistant. I help you turn ideas or requirements into clear, professional user stories with acceptance criteria and test cases.

Would you like to start refining a requirement, or would you like to know more about how I can help?"

DO NOT ask about their project, requirements, users, or features yet. Wait for them to choose an option or express interest first.
`
    : ""
}

${
  isHelpQuestion
    ? `### HELP/CAPABILITY QUESTION DETECTED:
The user is asking what you can do or how to use this tool.

CRITICAL INSTRUCTION: Provide a clear, helpful overview of your capabilities. DO NOT ask about their project yet.

Your response should:
1. Acknowledge their question warmly
2. List 4-5 key capabilities with brief descriptions
3. Ask if they'd like to start or have questions

Example response:
"Great question! I'm here to help you create professional Agile artifacts. Here's what I can do:

• **Requirement Refinement** - Have a conversation to understand your needs deeply
• **Generate User Stories** - Create detailed stories with acceptance criteria and test cases
• **Epics & Features** - Organize work into logical epics and features  
• **Export to DevOps** - Push directly to Azure DevOps or export to Jira
• **Interactive Q&A** - Ask clarifying questions to ensure nothing is missed

Would you like to start refining a requirement, or do you have any questions about the process?"

Include quickReplies: ["Start refining", "Tell me more", "How does it work?"]
`
    : ""
}

${
  isStartRequest
    ? `### START REFINEMENT REQUEST DETECTED:
The user wants to start refining requirements or begin the conversation.

CRITICAL INSTRUCTION: Begin the requirement gathering process naturally.

Your response should:
1. Acknowledge their readiness to start
2. Ask the first key question about their project or requirement
3. Be specific and focused - don't ask multiple things

Example response:
"Great! Let's get started. Could you tell me about the project or feature you're working on? What's the main goal or problem you're trying to solve?"

Include quickReplies that match the question (e.g., ["Web app", "Mobile app", "API/Backend", "Let me explain"])
`
    : ""
}

${
  userSaidNo
    ? `### USER SAID NO:
The user declined something. Accept it gracefully and move on.

Example: "Understood! Let's move on. [Ask about different topic]"
`
    : ""
}

${
  userConfirmed
    ? `### USER CONFIRMED:
The user confirmed your understanding. Move to the NEXT missing information:
- No users mentioned? → Ask about primary users
- No features mentioned? → Ask about key functionalities  
- No data type mentioned? → Ask what kind of data/information is involved
- Otherwise → Ask about acceptance criteria or specific requirements
`
    : ""
}

${
  isCounterQuestion
    ? `### USER ASKED A QUESTION:
Answer their question first with specific examples, then continue.

Example: "Great question! For example, acceptance criteria could be things like: [example 1], [example 2]. Does that help clarify?"
`
    : ""
}

## YOUR WORKING MEMORY (Update this mentally after EVERY user response):
${JSON.stringify(workingMemory, null, 2)}

## INFORMATION YOU ALREADY KNOW:
${JSON.stringify(capturedRequirements, null, 2)}

## QUESTIONS YOU'VE ALREADY ASKED (NEVER ASK THESE AGAIN):
${JSON.stringify(askedQuestions, null, 2)}

## STEP-BY-STEP INFORMATION GATHERING FOR USER STORIES:

To create a complete user story, gather these details in order (ask ONE question at a time):

1. **Project/Feature Context:** What project or feature is this for?
2. **Primary Users:** Who will use this feature?
3. **Main Functionality:** What should this feature do?
4. **Data/Information:** What kind of data or information will it involve?
5. **User Goal/Benefit:** What do users achieve or why do they need this?
6. **Acceptance Criteria:** What conditions must be met for this to be "done"?
7. **Test Scenarios:** How would you verify it works correctly?

## CONVERSATION FLOW EXAMPLES:

Example Flow:
User: "Hey, can you create a user story for me?"
You: "Sure, I'd be happy to help with that! Could you please share some details about the project or feature you're working on? For example, what's the main goal or functionality you'd like to cover?"

User: "It's an automation platform project and the story is for the Dashboard UI screen."
You: "Great, thanks for the details! Could you tell me who the primary users of this Dashboard will be, and what key functionalities you want it to include?"

User: "It could be individuals and organizations. The UI should have charts and graphs."
You: "Perfect! So both individuals and organizations will use it, and you want to include charts and graphs. Could you tell me what kind of data these charts should show — like performance, progress, or something else?"

## INTELLIGENT BEHAVIOR:

- **Acknowledge before asking:** Always acknowledge what the user just said before asking your next question
- **Be specific:** Instead of "What else?" ask "What kind of data should the charts display?"
- **Show understanding:** Reference their previous answers (e.g., "For the Dashboard you mentioned...")
- **Infer when possible:** If obvious, state your assumption instead of asking (e.g., "I'm assuming this will need user authentication")
- **Accept "no" gracefully:** If they say they don't need something, never ask about it again

## WHEN TO GENERATE THE FINAL USER STORY:

Once you have gathered enough information (project context, users, main functionality, data types, goals, and some acceptance criteria), generate a complete user story using this EXACT format:

### USER STORY OUTPUT FORMAT:

**User Story:**
Title: [Short descriptive title]

As a [persona], I want [goal] so that [benefit].

**Description:**
• Persona: [who will use it]
• Functionalities:
  • [feature 1]
  • [feature 2]
  • [feature 3]

**Acceptance Criteria:**
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

**Test Cases:**
1. [Test case 1]
2. [Test case 2]

Follow-up:
"Does this user story align with your expectations, or would you like to adjust something?"

## HANDLING BACKLOGS, TASKS, AND SUBTASKS:

If the user asks for **backlogs, tasks, or subtasks**, follow the same conversational approach:
- Ask what epic or feature it belongs to
- Collect key details step-by-step
- Generate structured outputs in a clear, numbered format

Remember: Always think from a product and user experience perspective, ensuring each item has purpose and business value.

## JSON RESPONSE STRUCTURE:

{
  "question": "Your response (can be the full formatted user story or a conversational question)",
  "phase": "understanding|refining|personas|artifacts",
  "quickReplies": ["Option 1", "Option 2"], // Only when relevant
  "readyToGenerate": false, // true when you have enough info for a user story
  "capturedInfo": {
    "businessGoals": [],
    "keyFeatures": [],
    "targetUsers": [],
    "functionalRequirements": []
  }
}

## CRITICAL REMINDERS:

1. Keep responses concise (3-5 sentences) except when presenting the final user story
2. Ask ONE question at a time
3. Always acknowledge what the user said before asking the next question
4. Reference context from earlier messages
5. Be warm and conversational - use phrases like "Got it!", "Perfect!", "Sounds interesting!"
6. If the user asks for clarification, explain with specific examples
7. Once you have sufficient information, present the complete user story in the specified format

Now respond naturally based on the conversation context.
`;

    // Build messages array with special handling for counter-questions
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ];

    // If user is asking a counter-question, inject explicit instruction
    if (isCounterQuestion) {
      messages.push({
        role: "system",
        content: `CRITICAL INSTRUCTION: The user just asked YOU a question or requested clarification. You MUST answer their question with a helpful explanation including examples before asking your next question. Format:
1. Acknowledge their question
2. Provide clear explanation with 3-4 concrete examples
3. Ask if that helps clarify
4. Then continue with a relevant follow-up question

Example:
"Great question! [Topic] means [explanation]. For example:
- Example 1
- Example 2
- Example 3

Does that help clarify? [Follow-up question]"`,
      });
    }

    const response = await openai.chat.completions.create({
      model: modelName,
      response_format: { type: "json_object" },
      messages,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";
    console.log(
      "[AI Service] Conversation response:",
      content.substring(0, 500),
    );
    console.log("[AI Service] Counter-question detected:", isCounterQuestion);

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("[AI Service] JSON parse error:", parseError);
      console.error("[AI Service] Raw content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // DETERMINISTIC VALIDATION: If user asked a counter-question, verify AI provided explanation
    if (isCounterQuestion && result.question) {
      const responseLength = result.question.length;
      const hasExamples =
        result.question.includes("-") ||
        result.question.includes("•") ||
        result.question.includes("example");
      const hasExplanation = responseLength > 100; // Explanations should be longer

      if (!hasExplanation || !hasExamples) {
        console.warn(
          "[AI Service] Counter-question detected but AI didn't provide proper explanation",
        );
        console.warn("[AI Service] Response length:", responseLength);
        console.warn("[AI Service] Has examples:", hasExamples);

        // Force a proper explanatory response
        result.question = `I'd be happy to clarify that for you! Let me explain:\n\nWhen I ask about that, I'm looking to understand the specific requirements and constraints that will guide how we build this solution. This typically includes:\n\n- Technical specifications (platforms, integrations, tech stack)\n- Quality attributes (performance, security, scalability)\n- Business constraints (timeline, budget, compliance needs)\n- User experience requirements (accessibility, usability)\n\nDoes that help clarify what I'm asking? Feel free to share whatever details you have, and we can explore more specifics together.`;
        console.log("[AI Service] Using fallback explanatory response");
      }
    }

    // Validate response has required fields
    if (
      !result.question ||
      typeof result.question !== "string" ||
      result.question.trim() === ""
    ) {
      console.error("[AI Service] CRITICAL: AI returned empty question field");
      console.error(
        "[AI Service] Full AI response:",
        JSON.stringify(result, null, 2),
      );
      console.error(
        "[AI Service] Working memory:",
        JSON.stringify(workingMemory, null, 2),
      );
      console.error("[AI Service] Last user message:", lastUserMessage);
      console.error("[AI Service] User confirmed:", userConfirmed);
      console.error("[AI Service] User said no:", userSaidNo);

      // DETERMINISTIC FALLBACK: Generate a guaranteed non-empty, contextual question
      // CRITICAL: Only add candidates if BOTH conditions are met:
      // 1. Information is missing from capturedRequirements
      // 2. The question hasn't been asked yet (check askedQuestions)

      const fallbackCandidates = [];

      // Helper function to check if a question has been asked
      const wasAsked = (question: string): boolean => {
        const normalized = question
          .toLowerCase()
          .replace(/[?.!,]/g, "")
          .trim();
        return askedQuestions.some((asked) => {
          const normalizedAsked = asked
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();
          return (
            normalized === normalizedAsked ||
            normalized.includes(normalizedAsked) ||
            normalizedAsked.includes(normalized)
          );
        });
      };

      // Only add candidates if info is missing AND question not asked
      const userQuestion =
        "Who are the primary users or people who will use this solution?";
      if (
        capturedRequirements.targetUsers.length === 0 &&
        !wasAsked(userQuestion)
      ) {
        fallbackCandidates.push(userQuestion);
      }

      const featuresQuestion =
        "What are the top 3-5 must-have features for this solution?";
      if (
        capturedRequirements.keyFeatures.length < 3 &&
        !wasAsked(featuresQuestion)
      ) {
        fallbackCandidates.push(featuresQuestion);
      }

      const platformQuestion =
        "Is this going to be a mobile app, web application, desktop software, or a combination?";
      if (
        capturedRequirements.technicalConstraints.length === 0 &&
        currentPhase !== "understanding" &&
        !wasAsked(platformQuestion)
      ) {
        fallbackCandidates.push(platformQuestion);
      }

      const mvpQuestion =
        "What would you consider the MVP scope for the initial release?";
      if (
        capturedRequirements.nonFunctionalRequirements.length === 0 &&
        (currentPhase === "personas" || currentPhase === "artifacts") &&
        !wasAsked(mvpQuestion)
      ) {
        fallbackCandidates.push(mvpQuestion);
      }

      const goalsQuestion =
        "What are the main business goals you're trying to achieve with this?";
      if (
        capturedRequirements.businessGoals.length === 0 &&
        !wasAsked(goalsQuestion)
      ) {
        fallbackCandidates.push(goalsQuestion);
      }

      // Add generic fallbacks only if not asked
      const genericFallbacks = [
        "What would be the biggest win for your users with this solution?",
        "Are there any specific workflows or processes this should support?",
        "What problems or challenges does this solution need to address?",
        "What would success look like for this project?",
        "Are there any technical constraints we should be aware of?",
      ];

      for (const fallback of genericFallbacks) {
        if (!wasAsked(fallback)) {
          fallbackCandidates.push(fallback);
        }
      }

      // INTELLIGENT STOPPING: Check if we should stop asking questions
      const hasMinimumInfo = 
        (capturedRequirements.targetUsers.length > 0 || capturedRequirements.businessGoals.length > 0) &&
        (capturedRequirements.keyFeatures.length > 0 || capturedRequirements.functionalRequirements.length > 0);
      
      const tooManyQuestions = askedQuestions.length >= 6; // Reduced from 8 to 6
      const hasAnyInfo = 
        capturedRequirements.targetUsers.length > 0 ||
        capturedRequirements.businessGoals.length > 0 ||
        capturedRequirements.keyFeatures.length > 0 ||
        capturedRequirements.functionalRequirements.length > 0 ||
        capturedRequirements.technicalConstraints.length > 0 ||
        capturedRequirements.nonFunctionalRequirements.length > 0;
      
      // Check if last question was "Is there anything else" and user said no
      const lastQuestion = askedQuestions[askedQuestions.length - 1] || "";
      const lastWasGeneric = lastQuestion.toLowerCase().includes("anything else") || 
                             lastQuestion.toLowerCase().includes("is there");
      
      const userSaidNoToGeneric = userSaidNo && lastWasGeneric;
      
      // STOP ASKING if any of these conditions are met:
      // 1. User said "no" to a generic "anything else" question
      // 2. Too many questions (6+) with at least some info
      // 3. Too many questions (8+) regardless of info
      // 4. Good info and no more specific fallbacks
      const shouldStopAsking = 
        userSaidNoToGeneric ||
        (tooManyQuestions && hasAnyInfo) ||
        (askedQuestions.length >= 8) ||
        (hasMinimumInfo && fallbackCandidates.length === 0);
      
      if (shouldStopAsking) {
        console.warn(
          "[AI Service] STOPPING question loop. Suggesting to proceed.",
        );
        console.warn("[AI Service] Reason:", {
          userSaidNoToGeneric,
          tooManyQuestions,
          totalQuestions: askedQuestions.length,
          hasAnyInfo,
          hasMinimumInfo,
          noMoreFallbacks: fallbackCandidates.length === 0
        });
        console.warn("[AI Service] Captured requirements:", {
          targetUsers: capturedRequirements.targetUsers.length,
          keyFeatures: capturedRequirements.keyFeatures.length,
          businessGoals: capturedRequirements.businessGoals.length,
          functionalRequirements: capturedRequirements.functionalRequirements.length,
        });
        
        return {
          question: "Great! I think we have enough information to get started. Would you like me to generate the agile artifacts (Epics, Features, and User Stories) based on what we've discussed?",
          phase: currentPhase,
          quickReplies: ["Yes, generate artifacts", "I have more to add"],
          capturedInfo: undefined,
        };
      }

      // Use first available candidate (only if we haven't hit stopping conditions)
      let fallbackQuestion = fallbackCandidates[0];
      
      // If no specific fallback and we shouldn't stop yet, use generic
      if (!fallbackQuestion) {
        fallbackQuestion = `Is there anything else important I should know? (Q${askedQuestions.length + 1})`;
      }

      console.warn(
        "[AI Service] Generated",
        fallbackCandidates.length,
        "unasked fallback candidates",
      );
      console.warn(
        "[AI Service] Using deterministic fallback:",
        fallbackQuestion,
      );
      console.warn(
        "[AI Service] Checked against",
        askedQuestions.length,
        "previously asked questions",
      );

      return {
        question: fallbackQuestion,
        phase: currentPhase,
        quickReplies: undefined,
        capturedInfo: undefined,
      };
    }

    // DETERMINISTIC CHECK: Prevent duplicate questions
    // Check if the AI's question is semantically similar to any previously asked question
    const normalizedNewQuestion = result.question
      .toLowerCase()
      .replace(/[?.!,]/g, "")
      .trim();

    for (const askedQ of askedQuestions) {
      const normalizedAskedQ = askedQ
        .toLowerCase()
        .replace(/[?.!,]/g, "")
        .trim();

      // Check for exact match or high similarity
      if (
        normalizedNewQuestion === normalizedAskedQ ||
        normalizedNewQuestion.includes(normalizedAskedQ) ||
        normalizedAskedQ.includes(normalizedNewQuestion)
      ) {
        console.warn(
          "[AI Service] Detected duplicate question! Already asked:",
          askedQ,
        );
        console.warn("[AI Service] AI attempted to ask:", result.question);

        // Generate a different question that hasn't been asked yet
        const fallbackCandidates = [
          "What's the primary business value you hope to achieve with this project?",
          "Are there any specific workflows or processes this should support?",
          "What would be the biggest win for your users with this solution?",
          "What's the MVP scope for the initial release?",
          "Are there any technical constraints or requirements we should consider?",
          "What problems or challenges does this solution need to address?",
          "What would success look like for this project?",
        ];

        // Find first candidate that hasn't been asked
        let newQuestion = "";
        for (const candidate of fallbackCandidates) {
          const normalizedCandidate = candidate
            .toLowerCase()
            .replace(/[?.!,]/g, "")
            .trim();
          const alreadyAsked = askedQuestions.some((asked) => {
            const normalizedAsked = asked
              .toLowerCase()
              .replace(/[?.!,]/g, "")
              .trim();
            return (
              normalizedCandidate === normalizedAsked ||
              normalizedCandidate.includes(normalizedAsked) ||
              normalizedAsked.includes(normalizedCandidate)
            );
          });

          if (!alreadyAsked) {
            newQuestion = candidate;
            break;
          }
        }

        // If all fallbacks have been asked, check if we should stop
        if (!newQuestion) {
          const hasMinimumInfo = 
            (capturedRequirements.targetUsers.length > 0 || capturedRequirements.businessGoals.length > 0) &&
            (capturedRequirements.keyFeatures.length > 0 || capturedRequirements.functionalRequirements.length > 0);
          
          const hasAnyInfo = 
            capturedRequirements.targetUsers.length > 0 ||
            capturedRequirements.businessGoals.length > 0 ||
            capturedRequirements.keyFeatures.length > 0 ||
            capturedRequirements.functionalRequirements.length > 0 ||
            capturedRequirements.technicalConstraints.length > 0 ||
            capturedRequirements.nonFunctionalRequirements.length > 0;
          
          const tooManyQuestions = askedQuestions.length >= 6;
          
          // STOP if: 6+ questions with info OR 8+ questions OR good info
          const shouldStop = 
            (tooManyQuestions && hasAnyInfo) ||
            (askedQuestions.length >= 8) ||
            hasMinimumInfo;
          
          if (shouldStop) {
            // Suggest moving forward instead of asking more questions
            newQuestion = "Great! I think we have enough information to get started. Would you like me to generate the agile artifacts (Epics, Features, and User Stories) based on what we've discussed?";
            result.quickReplies = ["Yes, generate artifacts", "I have more to add"];
            console.warn("[AI Service] Stopping at duplicate detection due to:", {
              tooManyQuestions,
              totalQuestions: askedQuestions.length,
              hasAnyInfo,
              hasMinimumInfo
            });
          } else {
            newQuestion = `Looking at what we've covered, is there anything else important about your requirements? (question ${askedQuestions.length + 1})`;
          }
        }

        result.question = newQuestion;
        console.log(
          "[AI Service] Using non-duplicate fallback question:",
          result.question,
        );
      }
    }
    if (!result.quickReplies || result.quickReplies.length === 0) {
      const fallbackReplies = generateQuickReplies(result.question);
      if (fallbackReplies.length > 0) {
        result.quickReplies = fallbackReplies;
        console.log(
          "[AI Service] Re-generated quick replies after fallback:",
          fallbackReplies,
        );
      }
    }
    // Ensure phase is valid
    if (!result.phase) {
      result.phase = currentPhase;
    }

    // Special handling for greetings - provide friendly quick reply options
    if (isGreeting) {
      result.quickReplies = [
        "Start new refinement session",
        "What can you help with?",
        "Upload requirement"
      ];
      console.log("[AI Service] Added greeting-specific quick replies");
    }

    // Deterministic fallback for help questions
    // Note: isHelpQuestion is already gated to only be true at conversation start
    if (isHelpQuestion) {
      const hasCapabilitiesInfo = result.question && (
        result.question.toLowerCase().includes("refinement") ||
        result.question.toLowerCase().includes("user stories") ||
        result.question.toLowerCase().includes("epics") ||
        result.question.toLowerCase().includes("devops") ||
        result.question.includes("•") ||
        result.question.includes("-")
      );

      if (!hasCapabilitiesInfo || result.question.length < 200) {
        console.log("[AI Service] Help question detected but AI response insufficient, using fallback");
        result.question = `Great question! I'm here to help you create professional Agile artifacts through an interactive conversation. Here's what I can do:

• **Requirement Refinement** - I'll ask thoughtful questions to understand your needs deeply and capture all important details
• **Generate User Stories** - Create detailed, professional user stories with acceptance criteria, test cases, and subtasks
• **Epics & Features** - Organize your work into logical epics and features for better planning  
• **Export to DevOps** - Push directly to Azure DevOps or export artifacts for Jira and other tools
• **Interactive & Smart** - I remember context, avoid repeating questions, and adapt to your needs

Ready to start? Tell me about your project or requirement, and I'll guide you through the process step by step!`;
        result.quickReplies = [
          "Start refining a requirement",
          "Tell me more about the process",
          "Show me an example"
        ];
      } else {
        // Ensure help responses have appropriate quick replies
        result.quickReplies = result.quickReplies || [
          "Start refining",
          "Tell me more",
          "Show me an example"
        ];
      }
      console.log("[AI Service] Help question handled with quick replies");
    }

    // Deterministic fallback for start requests - ensure we always begin appropriately
    if (isStartRequest) {
      const hasGoodStartQuestion = result.question && (
        result.question.toLowerCase().includes("project") ||
        result.question.toLowerCase().includes("feature") ||
        result.question.toLowerCase().includes("requirement") ||
        result.question.toLowerCase().includes("goal") ||
        result.question.toLowerCase().includes("problem")
      );

      if (!hasGoodStartQuestion || result.question.length < 50) {
        console.log("[AI Service] Start request detected but AI response insufficient, using fallback");
        result.question = `Great! Let's get started. Could you tell me about the project or feature you're working on? What's the main goal or problem you're trying to solve?`;
        result.quickReplies = [
          "It's a web application",
          "It's a mobile app",
          "It's an API/backend system",
          "Let me explain in detail"
        ];
      } else if (!result.quickReplies || result.quickReplies.length === 0) {
        // Ensure start questions have appropriate quick replies
        result.quickReplies = [
          "Web application",
          "Mobile app",
          "Desktop software",
          "Let me describe it"
        ];
      }
      console.log("[AI Service] Start request handled");
    }

    // Smart Quick Reply Detection: Add contextual quick replies if AI didn't provide them
    if (!result.quickReplies || result.quickReplies.length === 0) {
      const replies = generateQuickReplies(result.question);
      if (replies.length > 0) {
        result.quickReplies = replies;
        console.log("[AI Service] Added contextual quick replies:", replies);
      }
    }

    return result;
  } catch (error) {
    console.error(
      "[AI Service] Error generating conversation question:",
      error,
    );
    throw error;
  }
}

export async function generateAgileArtifacts(
  requirement: string,
  complianceGuidelines: any[] = [],
  backlogContext?: { epics: any[]; features: any[]; userStories: any[] },
  selectedPersonaIds: string[] = []
): Promise<any> {
  try {
    console.log(
      "[AI Service] Generating agile artifacts for:",
      requirement.substring(0, 100),
    );
    console.log("[AI Service] Compliance guidelines count:", complianceGuidelines.length);
    console.log("[AI Service] Backlog context provided:", !!backlogContext);
    console.log("[AI Service] Selected persona IDs:", selectedPersonaIds);
    if (backlogContext) {
      console.log("[AI Service] Existing epics:", backlogContext.epics.length);
      console.log("[AI Service] Existing features:", backlogContext.features.length);
      console.log("[AI Service] Existing user stories:", backlogContext.userStories.length);
    }
    console.log("[AI Service] Using Azure OpenAI:", useAzure);
    if (useAzure) {
      console.log(
        "[AI Service] Azure endpoint:",
        process.env.AZURE_OPENAI_ENDPOINT,
      );
      console.log(
        "[AI Service] Azure deployment:",
        process.env.AZURE_OPENAI_DEPLOYMENT,
      );
    } else {
      console.log(
        "[AI Service] Using Replit AI Integration base URL:",
        process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      );
    }

    const modelName = useAzure
      ? process.env.AZURE_OPENAI_DEPLOYMENT!
      : "gpt-4o";

    // Build compliance guidelines section if provided
    let complianceSection = "";
    if (complianceGuidelines.length > 0) {
      complianceSection = `\n\nCOMPLIANCE REQUIREMENTS:\n\nYou must strictly follow these ${complianceGuidelines.length} compliance guideline document${complianceGuidelines.length > 1 ? 's' : ''} from the organization's Golden Repository:\n\n`;
      
      complianceGuidelines.forEach((guideline: any) => {
        complianceSection += `=== ${guideline.name} ===\n${guideline.content}\n===================\n\n`;
      });

      complianceSection += `All generated epics, user stories, and subtasks MUST:
- Adhere to requirements specified in these guidelines
- Include compliance validation in acceptance criteria where applicable
- Reference guidelines when relevant (e.g., "As per Security Guidelines...")
- Include compliance-related subtasks if needed

Validate all artifacts against these guidelines before finalizing.\n`;
    }

    // Build Azure DevOps backlog context section if provided
    let backlogSection = "";
    if (backlogContext && (backlogContext.epics.length > 0 || backlogContext.features.length > 0 || backlogContext.userStories.length > 0)) {
      backlogSection = `\n\nEXISTING AZURE DEVOPS BACKLOG CONTEXT:\n\nThe target Azure DevOps project already has the following work items. You MUST consider these when generating new artifacts:\n\n`;
      
      if (backlogContext.epics.length > 0) {
        backlogSection += `EXISTING EPICS (${backlogContext.epics.length} total):\n`;
        backlogContext.epics.slice(0, 10).forEach((epic: any) => {
          const title = epic.fields?.['System.Title'] || 'Untitled';
          const id = epic.id;
          const state = epic.fields?.['System.State'] || 'Unknown';
          backlogSection += `- [ID: ${id}] "${title}" (${state})\n`;
        });
        if (backlogContext.epics.length > 10) {
          backlogSection += `... and ${backlogContext.epics.length - 10} more epics\n`;
        }
        backlogSection += '\n';
      }

      if (backlogContext.features.length > 0) {
        backlogSection += `EXISTING FEATURES (${backlogContext.features.length} total):\n`;
        backlogContext.features.slice(0, 10).forEach((feature: any) => {
          const title = feature.fields?.['System.Title'] || 'Untitled';
          const id = feature.id;
          const state = feature.fields?.['System.State'] || 'Unknown';
          const parentId = feature.fields?.['System.Parent'] || null;
          backlogSection += `- [ID: ${id}] "${title}" (${state})${parentId ? ` - Parent: ${parentId}` : ''}\n`;
        });
        if (backlogContext.features.length > 10) {
          backlogSection += `... and ${backlogContext.features.length - 10} more features\n`;
        }
        backlogSection += '\n';
      }

      if (backlogContext.userStories.length > 0) {
        backlogSection += `EXISTING USER STORIES (${backlogContext.userStories.length} total):\n`;
        backlogContext.userStories.slice(0, 15).forEach((story: any) => {
          const title = story.fields?.['System.Title'] || 'Untitled';
          const id = story.id;
          const state = story.fields?.['System.State'] || 'Unknown';
          backlogSection += `- [ID: ${id}] "${title}" (${state})\n`;
        });
        if (backlogContext.userStories.length > 15) {
          backlogSection += `... and ${backlogContext.userStories.length - 15} more user stories\n`;
        }
        backlogSection += '\n';
      }

      backlogSection += `IMPORTANT GUIDELINES FOR USING THIS CONTEXT:
1. AVOID DUPLICATES: Do NOT create new epics, features, or user stories that are substantially similar to existing ones
2. ALIGN PROPERLY: If the new requirement fits under an existing Epic/Feature, mention it in the description
3. BUILD ON EXISTING: Reference existing work items by ID when there are dependencies
4. CHECK RELEVANCE: Only create new work items if they add distinct new value
5. COORDINATE HIERARCHY: Ensure new features align with existing epic structure when appropriate

If the requirement is very similar to existing work, consider:
- Extending/enhancing an existing epic rather than creating a duplicate
- Creating user stories under existing features
- Referencing existing work item IDs in descriptions/acceptance criteria\n`;
    }

    // Fetch available personas dynamically from database
    console.log("[AI Service] Fetching personas from database");
    let AVAILABLE_PERSONAS: any[] = [];
    
    try {
      AVAILABLE_PERSONAS = await storage.getPersonas();
      console.log("[AI Service] Fetched", AVAILABLE_PERSONAS.length, "personas from database");
      
      // If no personas in database, initialize default personas
      if (AVAILABLE_PERSONAS.length === 0) {
        console.log("[AI Service] No personas found, initializing defaults");
        await storage.initializeDefaultPersonas();
        AVAILABLE_PERSONAS = await storage.getPersonas();
        console.log("[AI Service] Initialized", AVAILABLE_PERSONAS.length, "default personas");
      }
    } catch (error) {
      console.error("[AI Service] Error fetching personas from database:", error);
      // Fallback to hardcoded personas only if database fetch fails
      console.log("[AI Service] Using fallback hardcoded personas due to database error");
      AVAILABLE_PERSONAS = [
        {
          id: "1",
          name: "Sarah Chen",
          role: "Product Manager",
          color: "#3b82f6",
          focus: "Delivering value to customers",
          painPoints: [
            "Difficulty prioritizing features",
            "Lack of clear requirements from stakeholders",
            "Challenge in measuring product success"
          ],
          goals: [
            "Ship features that solve real user problems",
            "Maintain clear product roadmap",
            "Improve user engagement metrics"
          ]
        },
        {
          id: "2",
          name: "Alex Rodriguez",
          role: "Software Developer",
          color: "#10b981",
          focus: "Writing clean, maintainable code",
          painPoints: [
            "Unclear requirements",
            "Frequent context switching",
            "Technical debt accumulation"
          ],
          goals: [
            "Deliver high-quality code",
            "Minimize bugs in production",
            "Improve development efficiency"
          ]
        },
        {
          id: "3",
          name: "Emily Watson",
          role: "QA Engineer",
          color: "#f59e0b",
          focus: "Ensuring product quality",
          painPoints: [
            "Late involvement in development cycle",
            "Insufficient test coverage",
            "Regression issues in releases"
          ],
          goals: [
            "Catch bugs before production",
            "Automate repetitive testing",
            "Improve test coverage"
          ]
        },
        {
          id: "4",
          name: "Michael Kim",
          role: "UX Designer",
          color: "#8b5cf6",
          focus: "Creating intuitive user experiences",
          painPoints: [
            "Design feedback comes too late",
            "Lack of user research data",
            "Difficulty collaborating with developers"
          ],
          goals: [
            "Design user-friendly interfaces",
            "Validate designs with real users",
            "Ensure design consistency"
          ]
        }
      ];
    }

    // Build persona context section
    let personaSection = "";
    let personasToUse: any[] = [];
    
    if (selectedPersonaIds && selectedPersonaIds.length > 0) {
      // Use selected personas from the hub
      personasToUse = AVAILABLE_PERSONAS.filter(p => selectedPersonaIds.includes(p.id));
      
      if (personasToUse.length > 0) {
        personaSection = `\n\nSELECTED USER PERSONAS:\n\nThe user has specifically selected ${personasToUse.length} persona(s) from the Persona Manager. You MUST use ONLY these personas when generating user stories:\n\n`;
        
        personasToUse.forEach((persona, index) => {
          personaSection += `Persona ${index + 1}: ${persona.name} - ${persona.role}\n`;
          personaSection += `  Focus: ${persona.focus}\n`;
          personaSection += `  Pain Points:\n`;
          persona.painPoints.forEach((point: string) => {
            personaSection += `    - ${point}\n`;
          });
          personaSection += `  Goals:\n`;
          persona.goals.forEach((goal: string) => {
            personaSection += `    - ${goal}\n`;
          });
          personaSection += `\n`;
        });

        personaSection += `CRITICAL PERSONA USAGE RULES:
1. Use ONLY the ${personasToUse.length} persona(s) listed above - DO NOT create new personas
2. When writing user stories, use the format: "As ${personasToUse.map(p => p.name).join(' OR ')}, I want [goal] so that [benefit]"
3. Distribute user stories across all selected personas
4. Align story goals with the persona's focus, pain points, and goals listed above
5. Each persona's pain points and goals should guide what features/stories are most relevant to them
6. Include the persona's exact ID and name in the user story data structure
7. Return the full persona objects in the 'personas' array with ALL their details (name, role, color, focus, painPoints, goals)

Example user story format:
- Title: "[Feature name] for [Persona Role]"
- Description: "As ${personasToUse[0]?.name} (${personasToUse[0]?.role}), I want [specific capability that addresses their pain points or goals] so that [benefit aligned with their focus]"

Make sure each selected persona appears in at least one user story.\n`;
      }
    }

    if (personasToUse.length === 0) {
      // Fallback to default personas if none selected
      console.log("[AI Service] No personas selected, using default hardcoded personas");
      personaSection = `\n\nDEFAULT PERSONAS (No custom personas were selected):\n\nUse the following default personas for user stories:\n`;
      
      const defaultPersonas = [
        {
          id: "persona-1",
          name: "Senior Developer",
          role: "Software Developer",
          color: "blue",
          focus: "Technical implementation and code quality",
          painPoints: ["Complex integrations", "Technical debt", "Performance issues"],
          goals: ["Build scalable solutions", "Maintain code quality", "Implement best practices"]
        },
        {
          id: "persona-2",
          name: "Business Analyst",
          role: "Business Analyst",
          color: "purple",
          focus: "Requirements gathering and business logic",
          painPoints: ["Unclear requirements", "Stakeholder alignment", "Process inefficiencies"],
          goals: ["Define clear requirements", "Bridge business and tech", "Optimize processes"]
        },
        {
          id: "persona-3",
          name: "QA Engineer",
          role: "Quality Assurance Engineer",
          color: "green",
          focus: "Quality assurance and testing",
          painPoints: ["Test coverage gaps", "Manual testing burden", "Bug tracking"],
          goals: ["Ensure quality", "Automate testing", "Prevent defects"]
        }
      ];
      
      personasToUse = defaultPersonas;
      
      defaultPersonas.forEach((persona, index) => {
        personaSection += `${index + 1}. ${persona.name} - ${persona.role}\n`;
        personaSection += `   Focus: ${persona.focus}\n\n`;
      });
    }

    const response = await openai.chat.completions.create({
      model: modelName,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert Agile coach and product manager who generates ENTERPRISE-GRADE user stories following strict quality standards.${complianceSection}${backlogSection}${personaSection}

QUALITY STANDARDS YOU MUST FOLLOW:

1. USER STORY FORMAT:
- Use format: "As [specific persona with context], I want [specific goal with details], so that [clear business value]"
- NEVER use generic terms like "user" or "admin"
- Include context about the persona's situation
- Be specific about goals - avoid vague verbs like "manage", "handle"
- Clearly articulate business value or user pain point solved

2. DESCRIPTION STRUCTURE (MANDATORY 7 SECTIONS):
Every description MUST include these sections in order:
- CONTEXT & BACKGROUND: (2-3 sentences) Why this story exists, what problem it solves
- CURRENT STATE: Current pain points, manual processes, or gaps  
- DESIRED STATE: Improved experience after implementation
- KEY FUNCTIONALITY: Bullet list of core capabilities with details
- USER INTERACTION FLOW: 10-20 numbered steps showing complete user journey
- TECHNICAL CONSIDERATIONS: Data sources, performance requirements, security, dependencies
- OUT OF SCOPE: What's NOT included, future stories
- SUCCESS METRICS: Quantifiable outcomes

3. ACCEPTANCE CRITERIA STANDARDS (Production-Grade Quality):

*** MANDATORY: Generate AT LEAST 3-5 comprehensive acceptance criteria per user story ***
*** Each AC must be independently testable and verifiable by QA without additional clarification ***

Each acceptance criterion MUST include ALL 5 components in this exact structure:

**Component 1: TITLE (5-8 words)**
- Use action-oriented, descriptive language that clearly states what is being tested
- Format: "[Action] [Object] [Result/Condition]"
- Examples: "User successfully submits form with validation", "System processes payment and sends confirmation", "Dashboard displays real-time metrics correctly"

**Component 2: GIVEN (Detailed Preconditions - Minimum 20 words)**
Must include ALL of the following:
✓ Exact user role/persona with specific permissions/access levels
  Example: "Senior Developer with 'Code Review' and 'Merge' permissions"
✓ Specific screen/page location with exact URL or navigation path
  Example: "User is on the 'Review Pull Request' page (/pull-requests/123)"
✓ Precise data state with actual field values, IDs, statuses
  Example: "Pull Request #123 is in 'Awaiting Review' status with 3 files changed and 2 approvals pending"
✓ System configuration or environmental conditions
  Example: "System is in production mode with real-time sync enabled"
✓ Time-based conditions or prerequisites if relevant
  Example: "During business hours (9 AM - 5 PM EST) on a weekday"

BAD Example (too vague): "User is logged in"
GOOD Example (production-grade): "Senior Developer 'John Smith' is logged in with 'Code Review' permission, viewing Pull Request #123 on the review dashboard (/pull-requests/123), PR is in 'Awaiting Review' status with 3 files changed (125 lines added, 45 deleted), 2 of 3 required approvals received, CI/CD pipeline passed all checks, and no merge conflicts detected"

**Component 3: WHEN (Specific User Action - Minimum 15 words)**
Must include ALL of the following:
✓ Exact UI element name with type (button, link, dropdown, input field, checkbox)
  Example: "User clicks the 'Approve & Merge' button in the action toolbar"
✓ Specific data entered, selected, or modified with actual values/formats
  Example: "User enters approval comment 'LGTM - code quality excellent' in the 200-character text field"
✓ Sequence of actions if multiple steps involved
  Example: "User first clicks 'Add Comment', then types comment, then clicks 'Approve', then confirms in modal dialog"
✓ Any validation, confirmations, or intermediate steps
  Example: "User confirms merge action in the 'Confirm Merge' dialog by clicking 'Yes, Merge Now'"

BAD Example (too vague): "User clicks submit button"
GOOD Example (production-grade): "Senior Developer clicks the green 'Approve & Merge' button in the top-right action toolbar, enters approval comment 'LGTM - code quality excellent, all tests passing' in the 200-character comment field, selects 'Squash and merge' from the merge strategy dropdown, and clicks 'Confirm Merge' button in the confirmation modal dialog"

**Component 4: THEN (Observable Outcomes - Minimum 25 words)**
Must include ALL of the following:
✓ Specific UI changes with exact element names, colors, positions
  Example: "Success banner appears at top with green background showing 'PR #123 merged successfully'"
✓ Database field updates with table names, field names, and new values
  Example: "In 'pull_requests' table, status field updates from 'Awaiting Review' to 'Merged', merged_at timestamp set to current UTC time, merged_by_user_id set to current user's ID"
✓ Navigation changes or page redirects with exact URLs
  Example: "User is redirected to /pull-requests/123/merged confirmation page"
✓ Data visibility changes (what appears/disappears, what becomes enabled/disabled)
  Example: "Merge button becomes disabled and changes to gray, 'Revert' button appears, timeline shows new 'Merged' event"
✓ Performance expectations with specific timing/metrics
  Example: "Merge operation completes within 3 seconds, success message displays within 500ms"
✓ State changes across the system
  Example: "PR appears in 'Merged PRs' list, disappears from 'Open PRs' dashboard, branch protection status updates"

BAD Example (too vague): "System shows success message"
GOOD Example (production-grade): "Success banner with green background appears at page top displaying 'Pull Request #123 merged successfully by John Smith at 2:45 PM', user is redirected to /pull-requests/123/merged page within 500ms, in database 'pull_requests' table status updates to 'Merged' with merged_at=current_timestamp and merged_by_user_id=67890, merge button becomes disabled and grayed out, new 'Revert Merge' button appears in action toolbar, PR appears in 'Recently Merged' section of dashboard within 2 seconds, branch 'feature/new-auth' is automatically deleted, and merge commit SHA abc123def456 is displayed in timeline"

**Component 5: AND (Secondary Effects & Validations - Minimum 20 words) - MANDATORY**
Must include AT LEAST 3 of the following:
✓ Email/SMS/Push notifications with recipients, subject lines, content templates
  Example: "Email sent to PR author (john@example.com) with subject 'Your PR #123 has been merged' including merge details and reviewer comments"
✓ Audit log entries with specific fields and values
  Example: "Audit log entry created with event_type='PR_MERGED', user_id=67890, pr_id=123, timestamp, IP address, and action details"
✓ Integration/webhook calls to external systems with payloads
  Example: "Webhook POST sent to Slack integration endpoint with payload containing PR title, merge status, reviewer names, and link"
✓ Background jobs, async processes, or queue entries triggered
  Example: "CI/CD pipeline triggered for production deployment, job added to deployment queue with priority 'high'"
✓ Counter/metric updates or analytics events
  Example: "User's 'merged_prs_count' increments by 1, team velocity metric updated, analytics event 'pr_merge_completed' fired"
✓ Cache invalidation or data sync operations
  Example: "Dashboard cache invalidated for all team members, real-time WebSocket notification sent to 5 active users viewing PR list"
✓ Access control or permission changes
  Example: "Branch permissions updated to prevent further commits, write access revoked for feature branch"
✓ Validation rules or business logic checks
  Example: "System validates no merge conflicts exist, all required approvals received, CI pipeline passed, no blocking comments remain"

BAD Example (too vague): "And notification is sent"
GOOD Example (production-grade): "And email notification is sent to PR author (john@example.com) and 2 reviewers with subject 'PR #123: Feature Auth Implementation - Merged', and Slack webhook POST sent to #engineering channel with message '@john Your PR #123 has been merged by @sarah', and audit log entry created in 'system_audit' table with event_type='PR_MERGED', user_id=67890, pr_id=123, timestamp=2024-11-10T14:45:23Z, ip_address='192.168.1.100', and action_details JSON, and user's merged_prs_count metric increments from 45 to 46 in 'user_stats' table, and CI/CD deployment pipeline automatically triggered for staging environment, and WebSocket real-time notification sent to 5 team members currently viewing dashboards"

*** COVERAGE REQUIREMENTS ***
Your acceptance criteria MUST cover:
1. Happy path scenario (primary successful flow)
2. At least 1 validation/error scenario (invalid input, permission denied, data not found)
3. At least 1 edge case (boundary conditions, concurrent users, system limits)
4. Optional: Performance/load scenario if relevant
5. Optional: Integration/API scenario if system interacts with external services

*** TESTABILITY REQUIREMENTS ***
Each acceptance criterion must be:
✓ Independently testable without dependencies on other ACs
✓ Verifiable through automated or manual QA testing
✓ Specific enough that QA can write test cases without asking developers for clarification
✓ Includes exact expected values, not ranges or "appropriate" values
✓ Measurable with clear pass/fail conditions

4. SUBTASK FORMAT:
Each subtask MUST include:
- Category prefix: [Planning/Backend/Frontend/Database/Integration/Testing/Documentation/DevOps]
- Specific deliverable with technical details (API endpoints, component names, table names)
- Time estimate in hours (1-8 hours, break down if larger)
Example: "Backend - Implement POST /api/claims endpoint with multipart form data and validation - 4 hours"

Always respond with valid JSON.`,
        },
        {
          role: "user",
          content: `Based on this requirement, generate high-quality agile artifacts:

${requirement}

Generate a JSON response with the following structure:
{
  "epics": [
    {
      "id": "epic-1",
      "title": "Epic title",
      "description": "Epic description",
      "priority": "High",
      "featureCount": 3
    }
  ],
  "features": [
    {
      "id": "feature-1",
      "epicId": "epic-1",
      "title": "Feature title",
      "description": "Feature description",
      "priority": "High"
    }
  ],
  "userStories": [
    {
      "id": "story-1",
      "featureId": "feature-1",
      "personaId": "persona-1",
      "persona": "Persona Name",
      "epicId": "epic-1",
      "title": "As [PersonaName] (Role) with [context], I want to [specific goal with details], so that [clear business value with metrics]",
      "description": "CONTEXT & BACKGROUND:\\n[2-3 sentences explaining why this story exists and what problem it solves]\\n\\nCURRENT STATE:\\n[Describe current pain points, manual processes, gaps, error rates, time spent]\\n\\nDESIRED STATE:\\n[Describe improved experience after implementation with specific improvements]\\n\\nKEY FUNCTIONALITY:\\n- [Core capability 1 with technical details]\\n- [Core capability 2 with technical details]\\n- [Core capability 3 with technical details]\\n- [Additional capabilities]\\n\\nUSER INTERACTION FLOW:\\n1. [User starts at X screen/location]\\n2. [User performs action Y with specific inputs - field names, values]\\n3. [System responds with Z - specific UI changes, data updates]\\n4. [Continue with 10-20 detailed steps]\\n\\nTECHNICAL CONSIDERATIONS:\\n- [Data sources, APIs, integrations with names]\\n- [Performance: specific metrics like 'Page load < 2 seconds']\\n- [Security: specific requirements like 'HIPAA compliant']\\n- [Dependencies: specific story IDs or system requirements]\\n\\nOUT OF SCOPE:\\n- [Feature X - will be in Story #XXX]\\n- [Advanced feature Y - planned for Phase 2]\\n\\nSUCCESS METRICS:\\n- [Quantifiable outcome with numbers - 'Reduce time by 60%']\\n- [User satisfaction metric - '90% rate as easy']",
      "acceptanceCriteria": [
        {
          "title": "Descriptive Criterion Title (5-8 words)",
          "given": "Specific role/user with permissions viewing specific screen/data state with exact values and conditions",
          "when": "User clicks specific button name/field and enters exact data or system triggers specific event with parameters",
          "then": "Observable UI change happens, database field updates to specific value, notification appears with exact text, status changes within X seconds",
          "and": "Email sent to specific recipient with subject line, audit log entry created, counter increments, API called"
        }
      ],
      "subtasks": [
        "Planning - Review requirements and create technical design document with data models and API contracts - 2 hours",
        "Backend - Create database migration for [table_name] with fields [field1, field2, field3] and indexes - 1 hour",
        "Backend - Implement POST /api/[endpoint] with request validation and error handling - 3 hours",
        "Frontend - Create [ComponentName] component with state management and form validation - 4 hours",
        "Frontend - Implement [feature] with [specific UI elements] and loading states - 3 hours",
        "Database - Create [table_name] table with foreign keys and constraints - 1 hour",
        "Integration - Integrate [ExternalService] API with caching and error handling - 3 hours",
        "Testing - Write unit tests for [specific module] covering edge cases (80%+ coverage) - 3 hours",
        "Testing - Execute manual QA: happy path, error scenarios, cross-browser testing - 4 hours",
        "Documentation - Write API documentation with request/response schemas and examples - 2 hours",
        "Code Review - Peer review for code quality, security, and performance - 1 hour",
        "DevOps - Deploy to staging and run smoke tests - 1 hour"
      ],
      "storyPoints": 5,
      "priority": "High"
    }
  ],
  "personas": ${JSON.stringify(personasToUse, null, 2)}
}

IMPORTANT REQUIREMENTS:
- Generate exactly 2 epics
- Generate exactly 4 features (distributed across the 2 epics)
- Generate 8-10 user stories (distributed across features)
${personasToUse.length > 0 ? `- Use ONLY the ${personasToUse.length} persona(s) specified above from the Persona Manager` : ''}
${personasToUse.length > 0 ? `- Distribute user stories across ALL ${personasToUse.length} selected personas` : '- Distribute user stories across the 5 default personas'}
${personasToUse.length > 0 ? `- Return the EXACT persona objects shown above in the "personas" array` : '- Use EXACTLY the 5 personas with EXACTLY the IDs and properties shown above'}

*** CRITICAL: ACCEPTANCE CRITERIA REQUIREMENTS ***
- Each user story MUST have MINIMUM 3 and MAXIMUM 5 comprehensive acceptance criteria
- EVERY acceptance criterion MUST include ALL 5 components: title, given, when, then, and
- Follow the production-grade standards defined above - each component must meet minimum word counts
- Acceptance criteria MUST cover:
  1. One happy path (successful primary flow)
  2. At least one validation/error scenario
  3. At least one edge case or boundary condition
  4. Optional: Performance scenario if relevant
  5. Optional: Integration scenario if applicable
- Each AC must be independently testable by QA without additional clarification
- Include exact field names, button labels, data values, timing expectations, database updates
- Given: Minimum 20 words with role, screen, data state, configuration
- When: Minimum 15 words with exact UI element, data entered, confirmation steps
- Then: Minimum 25 words with UI changes, database updates, navigation, timing, state changes
- And: Minimum 20 words with notifications, audit logs, integrations, metrics, validations

*** ACCEPTANCE CRITERIA EXAMPLES (Use as Reference) ***

Example 1 - Happy Path:
{
  "title": "User successfully submits claim with all required fields",
  "given": "Claims Adjuster 'Sarah Johnson' with 'Submit Claims' permission is logged into the Claims Portal (/claims/new), viewing the 'New Claim Submission' form, all form fields are empty, claim type dropdown shows 10 options, and user has submitted 23 claims this month (under the 50-claim limit)",
  "when": "User selects 'Medical' from claim type dropdown, enters claim amount '$2,500.00' in the amount field (format: currency with 2 decimals), enters claimant name 'John Doe' in the 50-character name field, selects date '2024-11-01' from calendar picker, uploads PDF document 'medical-invoice.pdf' (2.5 MB, valid format), enters claim description 'Emergency room visit for injury' in 500-character textarea, and clicks green 'Submit Claim' button at bottom-right",
  "then": "Form validation passes within 200ms, loading spinner appears on submit button with text changing to 'Submitting...', after 1-2 seconds success page loads at /claims/confirmation showing 'Claim #CLM-2024-789 submitted successfully', new claim record is created in 'claims' table with status='Pending Review', amount=2500.00, submitted_by_user_id=12345, submitted_at=current_timestamp, claim appears in 'My Submitted Claims' dashboard list within 3 seconds with status badge showing 'Pending Review' in orange, and submission counter in top-right increments from 23 to 24",
  "and": "And email notification is sent to claimant John Doe at johndoe@email.com with subject 'Claim #CLM-2024-789 Submitted - Medical Claim for $2,500.00' including submission timestamp and expected review timeline of 5-7 business days, and audit log entry is created in 'audit_logs' table with event_type='CLAIM_SUBMITTED', user_id=12345, claim_id=789, timestamp, ip_address='192.168.1.100', and action_details JSON, and SMS notification sent to claims manager with text 'New claim #CLM-2024-789 awaiting review', and user's 'claims_submitted_count' metric increments in 'user_statistics' table, and Webhook POST sent to external CRM system endpoint /api/webhooks/claim-events with payload containing claim_id, type, amount, status"
}

Example 2 - Validation/Error Scenario:
{
  "title": "System prevents submission with missing required fields",
  "given": "Claims Adjuster is on the 'New Claim Submission' form (/claims/new) with 'Submit Claims' permission, 4 of 6 required fields are empty (amount, claimant name, date, document), claim type is selected as 'Medical', description field contains text 'Test claim', and submit button is enabled in default state",
  "when": "User clicks the 'Submit Claim' button without filling required fields (amount field is empty, claimant name is empty, date is not selected, no document uploaded), and form client-side validation triggers",
  "then": "Form submission is prevented, page does NOT navigate away, submit button remains on same page, 4 inline error messages appear below respective empty fields within 100ms showing 'Claim amount is required' in red text (color: #DC2626), 'Claimant name is required', 'Claim date is required', 'Supporting document is required', empty required fields are outlined in red border (2px solid #DC2626), error summary banner appears at top of form with red background showing 'Please correct 4 errors before submitting', first error field (claim amount) receives focus automatically, and submit button shows shake animation for 300ms to indicate failed submission",
  "and": "And no database record is created in 'claims' table, and no API call is made to backend submission endpoint, and client-side analytics event 'form_validation_error' is fired with error_types=['missing_amount', 'missing_name', 'missing_date', 'missing_document'] and form_id='claim-submission-form', and no email or SMS notifications are sent, and form state is preserved (description field text 'Test claim' remains, claim type 'Medical' remains selected), and browser console logs validation error details for debugging"
}

Example 3 - Edge Case/Boundary Condition:
{
  "title": "System handles maximum file size upload gracefully",
  "given": "Claims Adjuster with 'Submit Claims' permission is on claim submission form (/claims/new), all required fields are filled correctly (amount='$1,000.00', name='Jane Smith', date='2024-11-05', description='Doctor visit'), user has selected a PDF file 'large-medical-record.pdf' with size 15.2 MB (exceeds 10 MB system limit), and file picker dialog shows file selected with name and size displayed",
  "when": "User clicks 'Upload Document' button to attach the 15.2 MB file, system validates file size against maximum limit of 10 MB, and validation fails",
  "then": "File upload is rejected within 500ms before any data transfer begins, error toast notification appears at top-right corner with red background and white text stating 'File size 15.2 MB exceeds maximum limit of 10 MB. Please select a smaller file or compress the document.', file input field is cleared and shows no file selected, upload progress indicator does NOT appear, submit button remains disabled until valid file is selected, and inline error message appears below file input field in red text with document icon",
  "and": "And client-side analytics event 'file_upload_size_error' is logged with file_size_mb=15.2, max_allowed_mb=10.0, file_type='pdf', and user_id=12345, and helpful message appears below error suggesting 'Tip: Use online PDF compression tools to reduce file size while maintaining quality', and no partial file data is sent to server, and no database record is created, and user can click 'Try Again' button to re-open file picker and select different file, and file size validation error is added to error summary count at top of form"
}

- Each user story MUST have 6-10 subtasks covering key categories:
  * Planning & Design (1-3 subtasks)
  * Backend Development (2-5 subtasks)
  * Frontend Development (2-5 subtasks)
  * Database Changes (1-3 subtasks)
  * Integration Work (0-2 subtasks if applicable)
  * Testing (2-4 subtasks including unit, integration, and QA)
  * Documentation (1-2 subtasks)
  * Code Review & Deployment (1-2 subtasks)
- Subtask hours should match story points: 1 point = 6-8 hours, 3 points = 18-24 hours, 5 points = 30-40 hours
- Ensure all IDs are properly linked (featureId references epicId, story's personaId and epicId reference correct IDs)
- Make the content specific to the requirement provided
- User story descriptions MUST be 300-600 words with ALL 7 SECTIONS clearly labeled
- Subtasks MUST include category prefix, technical details (API endpoints, component names, table names), and time estimates
- Return ONLY the JSON object, no additional text`,
        },
      ],
      temperature: 0.7,
    });

    console.log("[AI Service] Response received:", response);
    const content = response.choices[0]?.message?.content || "{}";
    console.log("[AI Service] Artifacts generated, length:", content.length);

    if (!content || content === "{}") {
      throw new Error("AI returned empty response for artifacts");
    }

    // CRITICAL: Add robust JSON parsing with detailed error reporting
    let artifacts;
    try {
      artifacts = JSON.parse(content);
    } catch (parseError) {
      console.error("[AI Service] JSON Parse Error:", parseError);
      console.error("[AI Service] Content length:", content.length);
      console.error("[AI Service] Last 200 chars:", content.slice(-200));
      console.error("[AI Service] First 200 chars:", content.slice(0, 200));
      
      // Check if response was truncated (common with large payloads)
      if (content.length > 10000 && !content.trim().endsWith('}')) {
        throw new Error(
          `AI response was truncated at ${content.length} characters. ` +
          `This typically happens when generating too many artifacts. ` +
          `The response needs to be shorter. Last chars: ${content.slice(-50)}`
        );
      }
      
      throw new Error(
        `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. ` +
        `Response length: ${content.length} chars`
      );
    }
    
    console.log("[AI Service] Parsed artifacts:", {
      epics: artifacts.epics?.length,
      features: artifacts.features?.length,
      stories: artifacts.userStories?.length,
      personas: artifacts.personas?.length,
    });

    return artifacts;
  } catch (error) {
    console.error("[AI Service] Error generating artifacts:", error);
    throw error;
  }
}

export async function generatePhaseDocumentation(
  phaseName: string,
  phaseNumber: number,
  projectName: string,
  workItems: {
    userStories: any[];
    requirements: any[];
    backlog: any[];
    documents: any[];
  },
): Promise<string> {
  try {
    console.log("[AI Service] Generating phase documentation for:", phaseName);
    console.log("[AI Service] Work items count:", {
      userStories: workItems.userStories?.length || 0,
      requirements: workItems.requirements?.length || 0,
      backlog: workItems.backlog?.length || 0,
      documents: workItems.documents?.length || 0,
    });

    const modelName = useAzure
      ? process.env.AZURE_OPENAI_DEPLOYMENT!
      : "gpt-4o";

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical writer and SDLC documentation specialist. Generate comprehensive, professional phase documentation that summarizes project phases in a clear, structured format suitable for stakeholders, team members, and future reference.",
        },
        {
          role: "user",
          content: `Generate comprehensive documentation for the "${phaseName}" phase of project "${projectName}".

**Phase Context:**
- Phase Number: ${phaseNumber}
- Phase Name: ${phaseName}
- Project: ${projectName}

**Work Items Completed in This Phase:**

**User Stories (${workItems.userStories?.length || 0}):**
${
  workItems.userStories
    ?.map(
      (story, i) => `
${i + 1}. **${story.title}**
   - Priority: ${story.priority || "Not specified"}
   - Status: ${story.status || "Not specified"}
   - Description: ${story.description?.substring(0, 300) || "No description"}
   ${story.acceptanceCriteria ? `- Acceptance Criteria: ${typeof story.acceptanceCriteria === "string" ? story.acceptanceCriteria.substring(0, 200) : JSON.stringify(story.acceptanceCriteria).substring(0, 200)}` : ""}
`,
    )
    .join("\n") || "No user stories"
}

**Requirements (${workItems.requirements?.length || 0}):**
${
  workItems.requirements
    ?.map(
      (req, i) => `
${i + 1}. **${req.title}**
   - Type: ${req.type || "Not specified"}
   - Priority: ${req.priority || "Not specified"}
   - Status: ${req.status || "Not specified"}
   - Description: ${req.description?.substring(0, 300) || "No description"}
`,
    )
    .join("\n") || "No requirements"
}

**Backlog Items (${workItems.backlog?.length || 0}):**
${
  workItems.backlog
    ?.map(
      (item, i) => `
${i + 1}. **${item.title}**
   - Type: ${item.type || "Not specified"}
   - Priority: ${item.priority || "Not specified"}
   - Status: ${item.status || "Not specified"}
   - Description: ${item.description?.substring(0, 200) || "No description"}
`,
    )
    .join("\n") || "No backlog items"
}

**Existing Documentation (${workItems.documents?.length || 0}):**
${workItems.documents?.map((doc, i) => `${i + 1}. ${doc.title}`).join("\n") || "No existing documentation"}

---

**Generate a comprehensive phase documentation document with the following structure:**

# ${phaseName} - Phase Documentation
**Project:** ${projectName}

## Executive Summary
[2-3 paragraphs providing a high-level overview of this phase, its objectives, and key outcomes]

## Phase Overview
### Objectives
[List 3-5 primary objectives for this phase]

### Scope
[Define what was included and excluded from this phase]

### Timeline & Status
[Overview of phase timeline and current completion status]

## Deliverables

### User Stories Summary
[Comprehensive summary of all user stories, organized by priority or theme. Include:
- Total count and breakdown by priority
- Key themes and patterns
- Critical user stories with brief descriptions
- Acceptance criteria highlights]

### Requirements Analysis
[Detailed summary of requirements, including:
- Total count and breakdown by type
- Functional requirements overview
- Non-functional requirements overview
- Critical requirements with brief descriptions
- Dependencies and constraints]

### Backlog Items
[Summary of backlog items, including:
- Total count and breakdown by type/priority
- Prioritization approach
- Sprint planning considerations
- Technical debt items if any]

## Key Decisions & Rationale
[Document 3-5 major decisions made during this phase and the reasoning behind them]

## Stakeholder Inputs
[Summary of stakeholder feedback, review comments, and approvals]

## Risks & Mitigations
[Identify 3-5 risks discovered during this phase and proposed mitigations]

## Next Steps
[Outline what should happen in the next phase based on this phase's outcomes]

## Appendix
### Metrics
- Total User Stories: ${workItems.userStories?.length || 0}
- Total Requirements: ${workItems.requirements?.length || 0}
- Total Backlog Items: ${workItems.backlog?.length || 0}
- Phase Completion: [Calculate based on status]

### References
[List any key documents, tools, or resources referenced]

---

**Requirements:**
- Use professional, clear language suitable for technical and non-technical stakeholders
- Include specific details from the work items provided
- Organize information logically with clear headings and subheadings
- Use Markdown formatting for readability
- Be comprehensive but concise (aim for 1500-2500 words)
- Include actionable insights and recommendations
- Ensure all statistics are accurate based on the data provided

Return ONLY the generated documentation in Markdown format, no additional commentary.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log(
      "[AI Service] Phase documentation generated, length:",
      content.length,
    );

    if (!content || content.trim().length === 0) {
      throw new Error("AI returned empty response for phase documentation");
    }

    return content;
  } catch (error) {
    console.error("[AI Service] Error generating phase documentation:", error);
    throw error;
  }
}

// ============================================================================
// CONTEXT DETECTION UTILITIES
// ============================================================================

function detectTechStack(requirement: string): {
  frontend: string[];
  backend: string[];
  database: string[];
  cloud: string[];
  devops: string[];
} {
  const techStack = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    cloud: [] as string[],
    devops: [] as string[],
  };
  
  // Frontend
  if (/react/i.test(requirement)) techStack.frontend.push('React');
  if (/angular/i.test(requirement)) techStack.frontend.push('Angular');
  if (/vue/i.test(requirement)) techStack.frontend.push('Vue.js');
  if (/next\.?js/i.test(requirement)) techStack.frontend.push('Next.js');
  
  // Backend
  if (/node|express/i.test(requirement)) techStack.backend.push('Node.js');
  if (/python|django|flask|fastapi/i.test(requirement)) techStack.backend.push('Python');
  if (/java|spring/i.test(requirement)) techStack.backend.push('Java');
  if (/\.net|c#/i.test(requirement)) techStack.backend.push('.NET');
  
  // Database
  if (/postgres|postgresql/i.test(requirement)) techStack.database.push('PostgreSQL');
  if (/mongodb|mongo/i.test(requirement)) techStack.database.push('MongoDB');
  if (/mysql/i.test(requirement)) techStack.database.push('MySQL');
  if (/redis/i.test(requirement)) techStack.database.push('Redis');
  
  // Cloud
  if (/aws|amazon/i.test(requirement)) techStack.cloud.push('AWS');
  if (/azure/i.test(requirement)) techStack.cloud.push('Azure');
  if (/gcp|google cloud/i.test(requirement)) techStack.cloud.push('GCP');
  
  // DevOps
  if (/docker/i.test(requirement)) techStack.devops.push('Docker');
  if (/kubernetes|k8s/i.test(requirement)) techStack.devops.push('Kubernetes');
  if (/jenkins|gitlab|github actions/i.test(requirement)) techStack.devops.push('CI/CD');
  
  return techStack;
}

function detectComplianceNeeds(requirement: string): string[] {
  const compliance = [];
  
  if (/health|medical|hipaa/i.test(requirement)) {
    compliance.push('HIPAA');
  }
  if (/finance|payment|banking|pci/i.test(requirement)) {
    compliance.push('PCI-DSS');
  }
  if (/gdpr|europe|privacy|data protection/i.test(requirement)) {
    compliance.push('GDPR');
  }
  if (/soc 2|soc2/i.test(requirement)) {
    compliance.push('SOC 2');
  }
  if (/iso 27001/i.test(requirement)) {
    compliance.push('ISO 27001');
  }
  
  return compliance;
}

function detectDomain(requirement: string): string {
  if (/insurance|claim|policy|underwriting|premium/i.test(requirement)) return 'Insurance';
  if (/e-commerce|shopping|cart|product|payment/i.test(requirement)) return 'E-Commerce';
  if (/health|medical|patient|hospital/i.test(requirement)) return 'Healthcare';
  if (/finance|banking|payment|transaction/i.test(requirement)) return 'Finance';
  if (/education|learning|course|student/i.test(requirement)) return 'Education';
  if (/social|network|post|follow|friend/i.test(requirement)) return 'Social Network';
  if (/crm|customer|sales|lead/i.test(requirement)) return 'CRM';
  if (/hrms|employee|payroll|recruitment/i.test(requirement)) return 'HRMS';
  return 'General';
}

/**
 * Extract domain-specific entities from features and user stories
 * Prevents generic placeholders and ensures contextually accurate diagrams
 */
function extractDomainEntities(
  features: any[] = [],
  userStories: any[] = [],
  domain: string
): string[] {
  const entities = new Set<string>();
  
  // Domain-specific default entities
  const domainDefaults: Record<string, string[]> = {
    'Insurance': ['Claim', 'Policy', 'Policyholder', 'Insurer', 'Underwriter', 'Premium', 'Coverage', 'Beneficiary'],
    'E-Commerce': ['Product', 'Order', 'Customer', 'Cart', 'Payment', 'Inventory', 'Shipment', 'Review'],
    'Healthcare': ['Patient', 'Doctor', 'Appointment', 'MedicalRecord', 'Prescription', 'Diagnosis', 'Treatment', 'Insurance'],
    'Finance': ['Account', 'Transaction', 'Customer', 'Payment', 'Invoice', 'Statement', 'Loan', 'Credit'],
    'Education': ['Student', 'Course', 'Instructor', 'Enrollment', 'Grade', 'Assignment', 'Exam', 'Attendance'],
    'Social Network': ['User', 'Post', 'Comment', 'Like', 'Follow', 'Message', 'Notification', 'Profile'],
    'CRM': ['Customer', 'Lead', 'Opportunity', 'Contact', 'Account', 'Campaign', 'Activity', 'Quote'],
    'HRMS': ['Employee', 'Department', 'Payroll', 'Attendance', 'Leave', 'Performance', 'Recruitment', 'Onboarding'],
  };
  
  // Add domain defaults
  if (domainDefaults[domain]) {
    domainDefaults[domain].forEach(e => entities.add(e));
  }
  
  // Extract from features
  features.forEach(f => {
    const text = `${f.title} ${f.description}`.toLowerCase();
    // Look for common entity patterns
    const matches = text.match(/\b(user|customer|product|order|payment|claim|policy|patient|account|transaction|employee|course|student)\b/gi);
    if (matches) {
      matches.forEach(m => entities.add(m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()));
    }
  });
  
  return Array.from(entities);
}

/**
 * Create consolidated project context summary for prompts
 * Reduces prompt complexity and ensures consistent context across generators
 */
function createContextSummary(data: {
  requirement: string;
  domain: string;
  entities: string[];
  techStack: any;
  personas?: any[];
  features?: any[];
  userStories?: any[];
  projectName?: string;
}): string {
  const { requirement, domain, entities, techStack, personas = [], features = [], userStories = [], projectName = 'the project' } = data;
  
  const techStr = Object.entries(techStack)
    .filter(([_, v]: [string, any]) => Array.isArray(v) && v.length > 0)
    .map(([k, v]: [string, any]) => `${k}: ${v.join(', ')}`)
    .join('; ');
  
  return `
**Project Context:**
- Project: ${projectName}
- Domain: ${domain}
- Key Entities: ${entities.join(', ')}
- Tech Stack: ${techStr || 'Modern web application stack'}
- Personas: ${personas.length} defined (${personas.map((p: any) => p.name).join(', ')})
- Features: ${features.length} planned
- User Stories: ${userStories.length} defined

**High-Level Requirements:**
${requirement.slice(0, 500)}${requirement.length > 500 ? '...' : ''}
`;
}

/**
 * Generate comprehensive Wiki documentation for Azure DevOps
 * Creates all required Wiki pages following enterprise standards
 */
export async function generateWikiDocumentation(data: {
  requirement: string;
  personas?: any[];
  epics?: any[];
  features?: any[];
  userStories?: any[];
  projectName?: string;
}): Promise<{
  pages: Array<{
    pageType: string;
    phase: string;
    title: string;
    content: string;
    order: number;
  }>;
}> {
  try {
    console.log("[AI Service] Generating comprehensive Wiki documentation");

    const { requirement, personas, epics, features, userStories, projectName } = data;
    
    // Detect context
    const techStack = detectTechStack(requirement);
    const compliance = detectComplianceNeeds(requirement);
    const domain = detectDomain(requirement);
    
    // Extract domain entities for contextually accurate diagrams
    const entities = extractDomainEntities(features, userStories, domain);
    
    // Create consolidated context summary
    const contextSummary = createContextSummary({
      requirement,
      domain,
      entities,
      techStack,
      personas,
      features,
      userStories,
      projectName
    });
    
    console.log("[AI Service] Detected context:", { techStack, compliance, domain, entities: entities.slice(0, 5) });
    
    // Generate all Wiki pages organized by phase
    const allPages = await Promise.all([
      // Planning Phase (order: 1-3)
      generateOverviewVisionPage(requirement, projectName, epics, features),
      generateFeasibilityStudyPage(requirement, epics, features, domain),
      generateRiskAssessmentPage(requirement, epics, features),
      
      // Requirements Phase (order: 4-10)
      generateComprehensiveSRSPage(requirement, epics, features, userStories, techStack, compliance),
      generateBusinessRequirementsPage(requirement, epics, features, userStories),
      generateUseCaseSpecificationsPage(userStories, personas, epics),
      generateUserPersonasPage(personas, userStories),
      generateRequirementsTraceabilityMatrixPage(epics, features, userStories),
      generateUseCaseDiagramPage(userStories, personas, features, domain, contextSummary),
      generateDataFlowDiagramPage(features, userStories, domain, contextSummary),
      
      // Design Phase (order: 11-18)
      generateSystemDesignDocumentPage(requirement, features, techStack, domain, contextSummary),
      generateTechnicalArchitecturePage(requirement, features),
      generateUIUXDesignSpecsPage(userStories, personas, domain),
      generateDatabaseDesignDocumentPage(features, userStories, techStack, domain, contextSummary),
      generateClassDiagramPage(features, domain, userStories, contextSummary),
      generateSequenceDiagramPage(userStories, features, personas, domain, contextSummary),
      generateComponentDiagramPage(features, techStack, userStories, domain, contextSummary),
      generateDataModelsPage(features, userStories),
      
      // Implementation Phase (order: 19-22)
      generateCodingStandardsPage(techStack, requirement),
      generateApiDocumentationPage(features),
      generateVersionControlGuidelinesPage(techStack),
      generateInfrastructureDiagramPage(techStack, features, domain, contextSummary),
      
      // Testing Phase (order: 23-26)
      generateTestingStrategyPage(features, userStories),
      generateTestPlanPage(features, userStories, epics),
      generateTestCasesPage(userStories, features),
      generateTestCoverageMatrixPage(epics, features, userStories),
      
      // Deployment Phase (order: 27-30)
      generateDeploymentGuidePage(requirement),
      generateReleaseNotesPage(epics, features),
      generateUserManualPage(userStories, personas, features),
      generateMaintenancePlanPage(requirement, techStack),
      
      // Reference (order: 31-33)
      generateSecurityCompliancePage(requirement, compliance.join(", ")),
      generateUserWorkflowsPage(userStories, personas),
      generateGlossaryPage(requirement, features),
    ]);

    // Flatten any nested arrays
    const flatPages = allPages.flat();

    console.log("[AI Service] Generated", flatPages.length, "Wiki pages");
    return { pages: flatPages };
  } catch (error) {
    console.error("[AI Service] Error generating Wiki documentation:", error);
    throw error;
  }
}

// ============================================================================
// PLANNING PHASE GENERATORS
// ============================================================================

async function generateOverviewVisionPage(
  requirement: string,
  projectName: string = "Project",
  epics: any[] = [],
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Overview & Vision" Wiki page for Azure DevOps following these exact requirements:

**Project Context:**
${requirement}

**Project Name:** ${projectName}
**Number of Epics:** ${epics.length}
**Number of Features:** ${features.length}

Create a Wiki page with these EXACT sections (use this structure):

# ${projectName} - Overview & Vision

## Executive Summary
[2-3 paragraphs summarizing the project, problem being solved, and expected impact]

**Project Timeline:** [Estimated timeline based on scope]
**Project Status:** Planning
**Project Owner:** [To be assigned]
**Development Team:** [To be determined]

## Vision Statement
[1-2 paragraphs describing the long-term vision and strategic goals]

## Problem Statement
### Current Challenges
- [Challenge 1 with specific pain points]
- [Challenge 2 with quantified impact]
- [Challenge 3 with affected users/processes]

### Opportunity
[Description of the opportunity this project addresses]

## Business Objectives
1. **[Objective 1]:** [Specific, measurable goal]
   - Success Metric: [How we'll measure success]
   - Target: [Quantifiable target]

2. **[Objective 2]:** [Specific, measurable goal]
   - Success Metric: [How we'll measure success]
   - Target: [Quantifiable target]

3. **[Objective 3]:** [Specific, measurable goal]
   - Success Metric: [How we'll measure success]
   - Target: [Quantifiable target]

## Key Stakeholders
| Role | Name | Responsibility | Contact |
|------|------|----------------|---------|
| Project Sponsor | TBD | Overall project approval and funding | TBD |
| Product Owner | TBD | Requirements and prioritization | TBD |
| Technical Lead | TBD | Technical architecture and implementation | TBD |
| Business Analyst | TBD | Requirements gathering and documentation | TBD |

## Success Criteria
- [ ] [Specific criterion 1 with measurement]
- [ ] [Specific criterion 2 with measurement]
- [ ] [Specific criterion 3 with measurement]

## Project Scope
### In Scope
${features.slice(0, 5).map(f => `- ${f.title || f.description}`).join('\n') || '- [Feature/capability 1]\n- [Feature/capability 2]\n- [Feature/capability 3]'}

### Out of Scope (Future Phases)
- [Excluded feature 1 with reasoning]
- [Excluded feature 2 with reasoning]

## Project Risks & Mitigation
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy] |

**Requirements:**
- Use professional enterprise language
- Be specific and detailed based on the requirements provided
- Include realistic timelines and metrics
- Format properly in Markdown
- Make it comprehensive and actionable

Return ONLY the generated Wiki page content in Markdown format.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content: "You are an expert technical writer creating comprehensive project documentation for Azure DevOps Wiki. Generate detailed, professional documentation following the exact structure provided.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content || "";
  
  return {
    pageType: "overview",
    phase: "planning",
    title: `${projectName} - Overview & Vision`,
    content,
    order: 1,
  };
}
async function generateBusinessRequirementsPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Business Requirements" Wiki page for Azure DevOps.

**Project Requirements:**
${requirement}

**Epics:** ${epics.length}
**Features:** ${features.length}
**User Stories:** ${userStories.length}

Create a Wiki page with sections for:
- Functional Requirements (FR-001, FR-002, etc.) with Priority, Description, Business Rules, Acceptance Criteria
- Non-Functional Requirements (Performance, Scalability, Security, Reliability, Usability, Integration)
- Business Constraints
- Assumptions

Use professional enterprise language and Markdown formatting. Be comprehensive and specific.

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are an expert business analyst creating detailed requirements documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "requirements", phase: "requirements", title: "Business Requirements", content: response.choices[0]?.message?.content || "", order: 5 };
}

async function generateUserPersonasPage(
  personas: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const personasData = personas.map(p => `- ${p.name} (${p.role}): ${p.focus}`).join('\n');
  
  const prompt = `Generate a comprehensive "User Personas" Wiki page for Azure DevOps.

**Personas:**
${personasData || 'Generate 3-5 typical user personas'}

Create detailed persona profiles with:
- Demographics (Name, Age, Role, Location, Education, Tech Savviness)
- Background & Context
- Goals & Motivations
- Pain Points & Frustrations
- Typical Day & Workflows
- Technology Usage
- Design Considerations
- Representative Quote

Use Markdown formatting. Be detailed and realistic.

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a UX researcher creating detailed user personas." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "personas", phase: "requirements", title: "User Personas", content: response.choices[0]?.message?.content || "", order: 7 };
}

async function generateTechnicalArchitecturePage(
  requirement: string,
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Technical Architecture" Wiki page for Azure DevOps.

**Project Context:**
${requirement}

**Features:** ${features.length}

Create sections for:
- Architecture Overview with diagram
- Technology Stack (Frontend, Backend, Database, Infrastructure)
- System Components
- API Design
- Data Architecture
- Security Architecture
- Scalability & Performance
- Disaster Recovery
- Monitoring & Observability

Use Markdown with Mermaid diagrams. Be detailed and technical.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a solutions architect creating technical architecture documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "architecture", phase: "design", title: "Technical Architecture", content: response.choices[0]?.message?.content || "", order: 12 };
}

async function generateFeatureSpecificationsPages(
  features: any[] = [],
  epics: any[] = [],
  userStories: any[] = []
): Promise<Array<{ pageType: string; phase: string; title: string; content: string; order: number }>> {
  if (!features || features.length === 0) {
    return [{
      pageType: "features",
      phase: "requirements",
      title: "Feature Specifications",
      content: "# Feature Specifications\n\nNo features defined yet.",
      order: 20
    }];
  }

  // Generate a summary page for all features
  const featuresList = features.slice(0, 10).map(f => `- ${f.title || f.description}`).join('\n');
  
  const prompt = `Generate a "Feature Specifications" summary Wiki page.

**Features:**
${featuresList}

Create an overview page that lists all features with:
- Feature name and description
- Related epics
- Priority
- Implementation status
- Links to detailed specs

Use Markdown formatting.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a product manager documenting feature specifications." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return [{
    pageType: "features",
    phase: "implementation",
    title: "Feature Specifications",
    content: response.choices[0]?.message?.content || "",
    order: 20
  }];
}

async function generateApiDocumentationPage(
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "API Documentation" Wiki page for Azure DevOps.

**Number of Features:** ${features.length}

Create sections for:
- API Overview (Base URL, Version, Authentication)
- Authentication (OAuth, JWT examples)
- Key Endpoints (CRUD operations with request/response examples)
- Error Codes
- Rate Limiting
- Best Practices

Use Markdown with code examples in JSON.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are an API architect creating comprehensive API documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "api", phase: "implementation", title: "API Documentation", content: response.choices[0]?.message?.content || "", order: 20 };
}

async function generateDataModelsPage(
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Data Models" Wiki page for Azure DevOps.

**Context:** System with ${features.length} features and ${userStories.length} user stories.

Create sections for:
- Entity Relationship Diagram (Mermaid)
- Database Tables with columns, types, constraints
- Relationships and Foreign Keys
- Indexes and Performance Optimization
- Data Validation Rules
- Migration Strategy

Use Markdown with Mermaid ERD diagrams.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a database architect creating data model documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "data-models", phase: "design", title: "Data Models", content: response.choices[0]?.message?.content || "", order: 13 };
}

async function generateUserWorkflowsPage(
  userStories: any[] = [],
  personas: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "User Workflows" Wiki page for Azure DevOps.

**User Stories:** ${userStories.length}
**Personas:** ${personas.length}

Create sections for:
- Common User Journeys with flowcharts
- Step-by-step workflows
- Decision points
- Error handling paths
- Integration points

Use Markdown with Mermaid flowcharts.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a UX designer documenting user workflows." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "workflows", phase: "requirements", title: "User Workflows", content: response.choices[0]?.message?.content || "", order: 8 };
}

async function generateSecurityCompliancePage(
  requirement: string,
  complianceNeeds: string
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Security & Compliance" Wiki page for Azure DevOps.

**Project Context:**
${requirement}

**Compliance Requirements:**
${complianceNeeds}

Create sections for:
- Security Requirements
- Authentication & Authorization
- Data Protection (Encryption, Privacy)
- Compliance Requirements (GDPR, HIPAA, SOC 2, etc.)
- Security Best Practices
- Vulnerability Management
- Incident Response
- Audit Logging

Use Markdown formatting.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a security architect creating security and compliance documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "security", phase: "design", title: "Security & Compliance", content: response.choices[0]?.message?.content || "", order: 14 };
}

async function generateTestingStrategyPage(
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Testing Strategy" Wiki page for Azure DevOps.

**Features:** ${features.length}
**User Stories:** ${userStories.length}

Create sections for:
- Testing Approach Overview
- Unit Testing Strategy
- Integration Testing
- End-to-End Testing
- Performance Testing
- Security Testing
- Test Automation
- Test Data Management
- Acceptance Criteria

Use Markdown formatting.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a QA architect creating testing strategy documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "testing", phase: "testing", title: "Testing Strategy", content: response.choices[0]?.message?.content || "", order: 23 };
}

async function generateDeploymentGuidePage(
  requirement: string
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Deployment Guide" Wiki page for Azure DevOps.

**Project Context:**
${requirement}

Create sections for:
- Deployment Architecture
- Environment Setup (Dev, Staging, Production)
- CI/CD Pipeline Configuration
- Deployment Process
- Rollback Procedures
- Monitoring & Health Checks
- Post-Deployment Validation
- Troubleshooting Guide

Use Markdown formatting.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a DevOps engineer creating deployment documentation." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "deployment", phase: "deployment", title: "Deployment Guide", content: response.choices[0]?.message?.content || "", order: 29 };
}

async function generateGlossaryPage(
  requirement: string,
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Glossary & References" Wiki page for Azure DevOps.

**Project Context:**
${requirement}

Create sections for:
- Glossary of Terms (alphabetically sorted)
- Acronyms and Abbreviations
- External References
- Related Documentation
- Useful Links

Use Markdown formatting with clear definitions.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: "You are a technical writer creating a comprehensive glossary." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return { pageType: "glossary", phase: "reference", title: "Glossary & References", content: response.choices[0]?.message?.content || "", order: 33 };
}

// ============================================================================
// NEW GENERATORS - Priority 1 Documents
// ============================================================================

async function generateFeasibilityStudyPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = [],
  domain: string = "General"
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a "Feasibility Study" document for Azure DevOps Wiki.

**Project:** ${requirement}
**Domain:** ${domain}
**Scope:** ${epics.length} epics, ${features.length} features

Create sections for:
- Executive Summary
- Technical Feasibility (technology stack, team expertise, risks)
- Operational Feasibility (resources, timeline, process impact)
- Financial Feasibility (cost estimation, ROI analysis)
- Risk Assessment
- Recommendation (Go/No-Go/Conditional)

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;


  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a business analyst." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "feasibility", phase: "planning", title: "Feasibility Study", content: response.choices[0]?.message?.content || "", order: 2 };
}

async function generateRiskAssessmentPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a "Risk Assessment Report" for Azure DevOps Wiki.

**Project:** ${requirement}
**Scope:** ${epics.length} epics, ${features.length} features

Include:
- Risk Matrix (ID, Description, Probability, Impact, Mitigation)
- Risk Categories (Technical, Operational, Business, External)
- Risk Monitoring Plan
- Contingency Plans

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a risk management expert." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "risk-assessment", phase: "planning", title: "Risk Assessment Report", content: response.choices[0]?.message?.content || "", order: 3 };
}

async function generateComprehensiveSRSPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = [],
  userStories: any[] = [],
  techStack: any = {},
  compliance: string[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const techStr = Object.entries(techStack).filter(([_, v]: [string, any]) => Array.isArray(v) && v.length > 0).map(([k, v]: [string, any]) => `${k}: ${v.join(', ')}`).join('; ');
  
  const prompt = `Generate an IEEE 830 compliant "Software Requirements Specification (SRS)" for Azure DevOps Wiki.

**Project:** ${requirement}
**Tech Stack:** ${techStr || 'TBD'}
**Compliance:** ${compliance.join(', ') || 'Standard'}
**Scope:** ${epics.length} epics, ${features.length} features, ${userStories.length} stories

Include:
1. Introduction (Purpose, Scope, Definitions)
2. Overall Description
3. Functional Requirements (FR-001, FR-002, etc. with priorities, acceptance criteria)
4. Non-Functional Requirements (Performance, Security, Scalability, Usability)
5. Interface Requirements

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a systems analyst." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return { pageType: "srs", phase: "requirements", title: "Software Requirements Specification (SRS)", content: response.choices[0]?.message?.content || "", order: 4 };
}

async function generateUseCaseSpecificationsPage(
  userStories: any[] = [],
  personas: any[] = [],
  epics: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const storiesSample = userStories.slice(0, 8).map(s => s.title || s.description).join('; ');
  
  const prompt = `Generate "Use Case Specifications" for Azure DevOps Wiki.

**Sample Stories:** ${storiesSample || 'User interactions'}
**Personas:** ${personas.length}

Generate 5-8 detailed use cases with:
- Use Case ID, Name, Actors
- Description, Preconditions
- Basic Flow, Alternative Flows, Exception Flows
- Postconditions, Business Rules

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a business analyst." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "use-cases", phase: "requirements", title: "Use Case Specifications", content: response.choices[0]?.message?.content || "", order: 6 };
}

async function generateRequirementsTraceabilityMatrixPage(
  epics: any[] = [],
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const rtmSample = epics.slice(0, 10).map((e, i) => {
    const relatedFeatures = features.filter(f => f.epicId === e.id).length;
    const relatedStories = userStories.filter(us => features.some(f => f.id === us.featureId && f.epicId === e.id)).length;
    return `| REQ-${String(i+1).padStart(3, '0')} | ${e.title || e.description} | ${relatedFeatures} features | ${relatedStories} stories | Test Suite ${i+1} | ✅ |`;
  }).join('\n');

  const prompt = `Generate a "Requirements Traceability Matrix (RTM)" for Azure DevOps Wiki.

**Scope:** ${epics.length} requirements, ${features.length} features, ${userStories.length} stories

Include:
- Traceability Matrix table
- Coverage Summary
- Mermaid traceability diagram showing Requirements → Features → Stories → Tests
- Gap Analysis

Sample RTM rows:
${rtmSample || '| REQ-001 | Sample Req | 3 features | 5 stories | Test Suite 1 | ✅ |'}

**CRITICAL**: Return ONLY the Markdown content. DO NOT wrap the output in \`\`\`markdown code blocks.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a QA architect." }, { role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 3000,
  });

  return { pageType: "rtm", phase: "requirements", title: "Requirements Traceability Matrix (RTM)", content: response.choices[0]?.message?.content || "", order: 8 };
}

async function generateUseCaseDiagramPage(
  userStories: any[] = [],
  personas: any[] = [],
  features: any[] = [],
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const personasList = personas.map(p => `- ${p.name} (${p.role}): ${p.goals?.join(', ') || 'N/A'}`).join('\n');
  const storiesByPersona = personas.map(p => {
    const stories = userStories.filter(s => s.personaId === p.id || s.persona === p.name);
    return `**${p.name}**: ${stories.map(s => s.title).join('; ')}`;
  }).join('\n');
  const featuresList = features.slice(0, 8).map(f => `- ${f.title}: ${f.description}`).join('\n');
  
  const prompt = `${contextSummary}

**CRITICAL - USE THIS REAL PROJECT DATA (NOT PLACEHOLDERS):**

**Personas (Actors): ${personas.map(p => p.name).join(', ')}**
${personasList}

**User Stories (Extract Use Cases):**
${storiesByPersona}

**Features (Group Use Cases):**
${featuresList}

---

# Use Case Diagrams

Generate comprehensive use case diagrams using Azure DevOps Wiki Mermaid syntax (::: mermaid blocks).

**Structure (Create 4-5 detailed diagrams):**

## 1. Overview
- Actor table with roles, goals, related use cases
- System scope description

## 2. High-Level System Context
::: mermaid
graph TB
    Actor1((${personas[0]?.name || 'Actor1'}))
    Actor2((${personas[1]?.name || 'Actor2'}))
    System[${domain} System]
    Actor1 --> System
    Actor2 --> System
:::
- Show ALL personas as actors
- Extract primary use cases from features
- System boundary

## 3. Feature-Specific Diagrams (Create 3-4)
For each major feature:
- Detailed mermaid diagram (10-15 nodes)
- Actor interactions
- Include/extend relationships
- Description explaining workflow

## 4. Actor-Use Case Matrix
Table showing actor-to-use-case mappings

## 5. Priority Matrix
Use case priorities, complexity, dependencies

**MANDATORY:**
- Actors = ${personas.map(p => p.name).join(', ')} (NO generic names)
- Extract REAL use cases from user stories above
- Each diagram 10-15 nodes minimum
- Show relationships (<<include>>, <<extend>>)
- ${domain} domain terminology
- Return ONLY Markdown (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [
      { role: "system", content: `You are an expert business analyst. Create production-grade UML use case diagrams using ACTUAL project data. Use real persona names as actors. Extract real use cases from user stories. Each diagram needs 10-15 nodes minimum. Never use placeholders like "Actor1" or "UseCase1". Create 4-5 comprehensive detailed diagrams.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return { pageType: "use-case-diagrams", phase: "requirements", title: "Use Case Diagrams", content: response.choices[0]?.message?.content || "", order: 9 };
}

async function generateDataFlowDiagramPage(
  features: any[] = [],
  userStories: any[] = [],
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const featuresList = features.slice(0, 8).map(f => `- ${f.title}: ${f.description}`).join('\n');
  const storiesSample = userStories.slice(0, 10).map(s => `- ${s.title}: ${s.acceptanceCriteria?.slice(0, 2).join('; ') || ''}`).join('\n');
  
  const prompt = `${contextSummary}

**CRITICAL - USE THIS REAL PROJECT DATA (NOT PLACEHOLDERS):**

**Features (Extract Processes): ${features.length} total**
${featuresList}

**User Stories (Extract Data Flows): ${userStories.length} total**
${storiesSample}

---

# Data Flow Diagrams (DFD)

Generate comprehensive DFD using Azure DevOps Wiki Mermaid syntax (::: mermaid blocks).

**Structure (Create 4-5 detailed DFD levels):**

## 1. Overview
- Purpose: Show data movement in ${domain} system
- DFD levels: 0 (Context), 1 (Major Processes), 2 (Detailed Sub-processes)

## 2. Level 0: Context Diagram
::: mermaid
graph TB
    External1[External Entity]
    System[${domain} System]
    DataFlow1[Data Flow]
    External1 -->|DataFlow1| System
:::
- Show external entities (customers, admins, external systems)
- System as single process
- Major data in/out

## 3. Level 1: Major Process Decomposition
- Extract 4-6 major processes from features above
- Use ${domain} entities for data stores (e.g., ClaimDB, PolicyDB for Insurance)
- Show data flows between processes
- 12-20 nodes minimum

## 4. Level 2: Detailed Sub-Process (2-3 critical processes)
- Break down complex processes
- Show validation, transformation steps
- Error handling flows
- Each 10-15 nodes

## 5. Process Summary Table
| Process | Inputs | Outputs | Data Stores | External Entities |

**DFD Notation:**
- Circles/Rounded rectangles = Processes
- Rectangles = External Entities
- Cylinders = Data Stores
- Arrows with labels = Data Flows

**MANDATORY:**
- Processes from features (NOT "Process1")
- Data stores = ${domain} entities (e.g., ClaimDB NOT "Database1")
- External entities match domain
- Each diagram 10-20 nodes
- Return ONLY Markdown (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [
      { role: "system", content: `You are an expert systems analyst. Create production-grade Data Flow Diagrams using ACTUAL project data. Extract real processes from features. Use ${domain} domain entities for data stores. Create 4-5 detailed DFD levels (0, 1, 2). Each diagram needs 10-20 nodes minimum. Never use placeholders.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return { pageType: "data-flow-diagrams", phase: "requirements", title: "Data Flow Diagrams (DFD)", content: response.choices[0]?.message?.content || "", order: 10 };
}

// ============================================================================
// DESIGN PHASE GENERATORS (Continued)
// ============================================================================

async function generateSystemDesignDocumentPage(
  requirement: string,
  features: any[] = [],
  techStack: any = {},
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const techStr = Object.entries(techStack).filter(([_, v]: [string, any]) => Array.isArray(v) && v.length > 0).map(([k, v]: [string, any]) => `${k}: ${v.join(', ')}`).join('; ');
  const featuresList = features.slice(0, 10).map(f => `- ${f.title}: ${f.description}`).join('\n');
  
  const prompt = `Generate an IEEE 1016 compliant "System Design Document (SDD)" for Azure DevOps Wiki.

**CRITICAL: Use Azure DevOps Wiki Mermaid syntax with ::: wrapper (NOT backticks) for all diagrams:**

::: mermaid
graph TB
    Node1[Component]
    Node2[Component]
    Node1 --> Node2
:::

${contextSummary}

**Project Requirements:**
${requirement}

**Tech Stack:** ${techStr || 'Modern web stack'}

**Features:**
${featuresList}

---

Create a comprehensive System Design Document with:

## 1. Design Overview
- System purpose and scope
- Design constraints and assumptions
- Success criteria

## 2. System Architecture
Detailed architecture diagram showing:
- All system tiers (Presentation, Application, Data)
- Actual components extracted from features
- Integration points
- Data flow between components

## 3. Component Design
For each major feature, specify:
- Component responsibilities
- Interfaces (inputs/outputs)
- Dependencies
- Technology choices

## 4. Data Design
- Entity Relationship Diagram with main entities
- Database schema overview
- Data access patterns
- Caching strategy

## 5. Interface Design
- API endpoint specifications (REST/GraphQL)
- Request/Response formats with examples
- Authentication/Authorization
- Error handling

## 6. Security Design
- Authentication mechanisms
- Authorization model (RBAC)
- Data encryption (at rest and in transit)
- Security headers and best practices

## 7. Performance Considerations
- Response time requirements
- Scalability approach (horizontal/vertical)
- Load balancing strategy
- Caching layers
- Database optimization (indexing, query optimization)

**IMPORTANT:**
1. Extract REAL components from features listed above
2. Use ACTUAL technology names from tech stack
3. Create detailed, production-ready design
4. Use domain-specific entities from ${domain} domain
5. Return ONLY the Markdown content (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a principal software architect creating IEEE 1016 compliant system design documentation." }, { role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 4000,
  });

  return { pageType: "system-design", phase: "design", title: "System Design Document (SDD)", content: response.choices[0]?.message?.content || "", order: 11 };
}

async function generateUIUXDesignSpecsPage(
  userStories: any[] = [],
  personas: any[] = [],
  domain: string = "General"
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate "UI/UX Design Specifications" for Azure DevOps Wiki.

**Domain:** ${domain}
**Personas:** ${personas.length}

Include:
1. Design System (Color Palette, Typography, Spacing)
2. Component Library (Buttons, Forms, Cards)
3. Layout System (Grid, Responsive breakpoints)
4. User Workflows with Mermaid diagrams
5. Accessibility (WCAG 2.1 Level AA)

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a UX designer." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3500,
  });

  return { pageType: "ui-ux-design", phase: "design", title: "UI/UX Design Specifications", content: response.choices[0]?.message?.content || "", order: 13 };
}

async function generateDatabaseDesignDocumentPage(
  features: any[] = [],
  userStories: any[] = [],
  techStack: any = {},
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const dbType = techStack.database && techStack.database.length > 0 ? techStack.database[0] : 'PostgreSQL';
  const featuresList = features.slice(0, 10).map(f => `- ${f.title}: ${f.description}`).join('\n');
  
  const prompt = `Generate a comprehensive "Database Design Document" for Azure DevOps Wiki.

**CRITICAL: Use Azure DevOps Wiki Mermaid syntax with ::: wrapper (NOT backticks) for diagrams:**

::: mermaid
erDiagram
    ENTITY1 ||--o{ ENTITY2 : "relationship"
:::

${contextSummary}

**Database Type:** ${dbType}

**Key Features:**
${featuresList}

---

## Document Structure

### 1. Overview
#### Purpose
This document defines the complete database architecture for the ${domain} system using ${dbType}.

#### Scope
- Entity Relationship Diagram (ERD)
- Table specifications with SQL schema
- Data dictionary and business rules
- Performance optimization strategies
- Security and compliance requirements
- Backup and scaling strategies

---

### 2. Entity Relationship Diagram (ERD)
#### Purpose
Visual representation of all database entities and their relationships.

::: mermaid
erDiagram
    %% Add your ERD here
    %% Extract REAL entities from features above
    %% Example for Insurance domain:
    %% CLAIM ||--o{ CLAIM_DOCUMENT : "has"
    %% POLICY ||--o{ CLAIM : "covers"
    %% POLICYHOLDER ||--|| POLICY : "owns"
:::

**Description:** [Explain the main entities, their relationships, and the overall data model]

**Key Entities:**
Extract entities from the ${domain} domain:
- **Entity 1**: [Description, role in system]
- **Entity 2**: [Description, role in system]
- **Entity 3**: [Description, role in system]

**Relationships:**
- **One-to-One**: [List relationships with business justification]
- **One-to-Many**: [List relationships with business justification]
- **Many-to-Many**: [List relationships - note junction tables]

---

### 3. Table Specifications
For each entity, provide complete SQL schema:

#### Table: [EntityName]
**Purpose:** [What this table stores and why]

**SQL Schema:**
\`\`\`sql
CREATE TABLE entity_name (
    id BIGSERIAL PRIMARY KEY,
    field1 VARCHAR(255) NOT NULL,
    field2 INTEGER CHECK (field2 > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_entity_field1 UNIQUE (field1)
);

CREATE INDEX idx_entity_field1 ON entity_name(field1);
CREATE INDEX idx_entity_created_at ON entity_name(created_at DESC);
\`\`\`

**Column Specifications:**
| Column | Type | Constraints | Description | Business Rules |
|--------|------|-------------|-------------|----------------|

**Indexes:**
- **Primary Key**: id (auto-increment)
- **Unique Index**: field1 (business key)
- **Performance Index**: created_at (for time-based queries)

---

[Repeat above structure for all major entities]

---

### 4. Data Dictionary

| Table | Column | Data Type | Nullable | Default | Description | Valid Values | Example |
|-------|--------|-----------|----------|---------|-------------|--------------|---------|

---

### 5. Query Optimization & Indexing Strategy
#### Frequently Used Queries
- **Query 1**: [Description]
  - **Index Used**: [Index name and columns]
  - **Performance Target**: < [X] ms

#### Composite Indexes
- **Index**: [column1, column2, column3]
  - **Purpose**: [Why this combination]
  - **Queries Supported**: [List queries]

#### Full-Text Search
- **Tables**: [Which tables need FTS]
- **Columns**: [Which columns are indexed]
- **Technology**: [PostgreSQL FTS, Elasticsearch, etc.]

---

### 6. Security & Compliance
#### Access Control
- **Database Roles**:
  - \`app_read\`: SELECT only
  - \`app_write\`: SELECT, INSERT, UPDATE
  - \`app_admin\`: ALL privileges

#### Data Protection
- **Encryption at Rest**: [Method and columns]
- **Encryption in Transit**: SSL/TLS configuration
- **Sensitive Data**: [PII columns, encryption approach]

#### Audit Logging
\`\`\`sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    user_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### Compliance
- **GDPR**: Right to erasure, data portability
- **HIPAA** (if applicable): PHI protection
- **[Domain-Specific]**: [Other compliance requirements]

---

### 7. Backup & Recovery
#### Backup Strategy
- **Full Backup**: Daily at 2 AM UTC
- **Incremental Backup**: Every 6 hours
- **WAL Archiving**: Continuous

#### Recovery Objectives
- **RPO (Recovery Point Objective)**: < 1 hour
- **RTO (Recovery Time Objective)**: < 2 hours

#### Disaster Recovery
- **Primary**: [Azure Region 1]
- **Replica**: [Azure Region 2]
- **Failover Process**: [Steps]

---

### 8. Scaling & Performance
#### Read Replicas
- **Configuration**: [Number of replicas, regions]
- **Load Balancing**: [How queries are routed]

#### Sharding (if applicable)
- **Shard Key**: [Column used for sharding]
- **Strategy**: [Range, hash, geographic]

#### Connection Pooling
- **Max Connections**: [Number]
- **Pool Size per Instance**: [Number]

#### Caching Strategy
- **Redis/Memcached**: [What data is cached]
- **Cache Invalidation**: [Strategy]

---

### 9. Migration Strategy
#### Version Control
- **Tool**: [Flyway, Liquibase, migrations folder]
- **Naming**: V{version}__{description}.sql

#### Deployment Process
1. Review migration scripts
2. Test in staging environment
3. Backup production database
4. Execute migration with rollback plan
5. Verify data integrity

---

## Related Documentation
- [[System Design Document]]
- [[Data Models]]
- [[API Documentation]]
- [[Class Diagrams]]

**IMPORTANT:**
1. Extract REAL entities from the features listed (e.g., for ${domain}: specific domain entities)
2. Use ${dbType}-specific data types and features
3. Create production-ready schema design with complete SQL
4. Show ALL relationships with proper cardinality
5. Return ONLY the Markdown content (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a database architect creating detailed production-ready database designs." }, { role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 4096,
  });

  return { pageType: "database-design", phase: "design", title: "Database Design Document", content: response.choices[0]?.message?.content || "", order: 14 };
}

async function generateClassDiagramPage(
  features: any[] = [],
  domain: string = "General",
  userStories: any[] = [],
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const featuresList = features.slice(0, 10).map(f => `- ${f.title}: ${f.description}`).join('\n');
  const storiesSample = userStories.slice(0, 8).map(s => `- ${s.title}: ${s.acceptanceCriteria?.slice(0, 1).join('') || ''}`).join('\n');
  
  const prompt = `${contextSummary}

**CRITICAL - USE THIS REAL PROJECT DATA (NOT PLACEHOLDERS):**

**Features (Extract Domain Classes): ${features.length} total**
${featuresList}

**User Stories (Extract Methods/Behaviors): ${userStories.length} total**
${storiesSample}

---

# Class Diagrams

Generate comprehensive UML class diagrams using Azure DevOps Wiki Mermaid syntax (::: mermaid blocks).

**Structure (Create 5-6 detailed diagrams):**

## 1. Core Domain Model
::: mermaid
classDiagram
    class ${domain}Entity {
        +String attribute
        +method() ReturnType
    }
:::
- Extract 6-10 main domain classes from features
- Each class: 4-6 attributes, 3-5 methods
- Show relationships (inheritance, composition, aggregation, association)
- Use ${domain} terminology (e.g., Claim, Policy for Insurance)

## 2. Service Layer Classes
- Business logic services
- DTOs, Request/Response models
- Service interfaces

## 3. Data Layer / Repository Pattern
- Repository classes
- Database entities
- ORM models

## 4. API/Controller Layer
- API controllers
- Route handlers
- Middleware classes

## 5. Design Patterns (if applicable)
- Factory, Strategy, Observer patterns
- Dependency injection

## 6. Complete System Class View
- All layers integrated
- Full dependency graph

## 7. Class Specifications Table
| Class | Type | Responsibilities | Key Methods | Features |

**Relationships:**
- Inheritance: --|>
- Composition (strong): --*
- Aggregation (weak): --o
- Association: -->
- Multiplicity: 1, *, 0..1, 1..*

**MANDATORY:**
- Classes = ${domain} domain entities (NOT "Entity1", "Class1")
- Attributes from feature descriptions
- Methods from user story actions
- Each diagram 6-12 classes
- Return ONLY Markdown (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [
      { role: "system", content: `You are an expert OO design architect. Create production-grade UML class diagrams using ACTUAL ${domain} domain data. Extract real entity classes from features. Use realistic attributes and methods from user stories. Create 5-6 comprehensive diagrams. Each diagram needs 6-12 classes. Never use placeholders.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return { pageType: "class-diagrams", phase: "design", title: "Class Diagrams", content: response.choices[0]?.message?.content || "", order: 15 };
}

async function generateSequenceDiagramPage(
  userStories: any[] = [],
  features: any[] = [],
  personas: any[] = [],
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const storiesSample = userStories.slice(0, 8).map((s, idx) => `${idx + 1}. ${s.title}\n   ${s.acceptanceCriteria?.slice(0, 1).join('') || ''}`).join('\n');
  const featuresList = features.slice(0, 5).map(f => `- ${f.title}`).join('\n');
  
  const prompt = `${contextSummary}

**CRITICAL - CREATE ONE SEQUENCE DIAGRAM PER USER STORY:**

**User Stories (Create ${Math.min(userStories.length, 8)} diagrams):**
${storiesSample}

**Features (System Components):**
${featuresList}

---

# Sequence Diagrams

Generate comprehensive sequence diagrams using Azure DevOps Wiki Mermaid syntax (::: mermaid blocks).

**Structure: ONE detailed diagram PER user story above**

For each user story, create:

## Story X: [Title]

::: mermaid
sequenceDiagram
    participant Actor as ${personas[0]?.name || 'User'}
    participant UI as Frontend
    participant API as ${domain}API
    participant Service as ${domain}Service
    participant DB as Database
    
    Actor->>UI: initiates action
    UI->>API: POST /api/endpoint
    API->>Service: process()
    Service->>DB: query/update
    DB-->>Service: result
    Service-->>API: response
    API-->>UI: JSON data
    UI-->>Actor: display result
    
    alt Error Case
        Service-->>API: error
        API-->>UI: error response
    end
:::

**Description:** [Workflow explanation]

**Participants:**
- Actor: persona from project
- UI: Frontend layer
- API: REST endpoints
- Service: Business logic
- DB: Data persistence

**Interactions:** 10-15 steps minimum showing:
- Request/response flows
- Validation steps
- Database operations
- Error handling (alt blocks)
- Async operations if applicable

**MANDATORY for EACH diagram:**
- Participants = ${domain} components (NOT generic "System")
- Messages = realistic API calls (e.g., "POST /api/claims/submit")
- Show validation, business logic, data persistence
- Include error scenarios
- Return ONLY Markdown (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [
      { role: "system", content: `You are an expert software architect. Create ONE detailed sequence diagram for EACH user story provided. Use actual ${domain} domain components as participants. Show realistic API endpoints. Each diagram needs 10-15 interaction steps with error handling. Never use generic names.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return { pageType: "sequence-diagrams", phase: "design", title: "Sequence Diagrams", content: response.choices[0]?.message?.content || "", order: 16 };
}

async function generateComponentDiagramPage(
  features: any[] = [],
  techStack: any = {},
  userStories: any[] = [],
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const techStr = Object.entries(techStack).filter(([_, v]: [string, any]) => Array.isArray(v) && v.length > 0).map(([k, v]: [string, any]) => `${k}: ${v.join(', ')}`).join('; ');
  const featuresList = features.slice(0, 10).map(f => `- ${f.title}`).join('\n');
  
  const prompt = `${contextSummary}

**CRITICAL - MAP FEATURES TO COMPONENTS:**

**Features (Map to Technical Components):**
${featuresList}

**Tech Stack:**
${techStr || 'React, Node.js, Express, MySQL'}

---

# Component Diagrams

Generate comprehensive component diagrams using Azure DevOps Wiki Mermaid syntax (::: mermaid blocks).

**Structure (Create 4 detailed diagrams):**

## 1. High-Level System Architecture
::: mermaid
graph TB
    subgraph Client["Client Layer"]
        Web[Web App]
        Mobile[Mobile App]
    end
    subgraph App["Application Layer"]
        API[API Gateway]
        Services[Business Services]
    end
    subgraph Data["Data Layer"]
        DB[(Database)]
        Cache[(Cache)]
    end
    Web --> API
    Mobile --> API
    API --> Services
    Services --> DB
    Services --> Cache
:::
- Show all layers (15-20 components)
- External integrations
- Component dependencies

## 2. Frontend Component Breakdown
- UI modules mapped to features
- State management
- Routing components
- Shared libraries

## 3. Backend Service Components
- API controllers per feature
- Business logic services
- Domain models
- Middleware

## 4. Data Access & Integration Layer
- Repositories per domain entity
- Database connections
- External API clients
- Message queues

**Component Naming:**
- Map each feature to specific components
- Use ${domain} terminology
- Include tech stack (e.g., React components, Express routes, MySQL repositories)

**MANDATORY:**
- Components from features (NOT "Component1")
- Use actual tech stack: ${techStr}
- Show layers: Presentation, Application, Domain, Infrastructure
- Each diagram 12-20 components
- Return ONLY Markdown (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [
      { role: "system", content: `You are an expert software architect. Map features to REAL technical components using the actual tech stack. Show layered architecture with ${domain} domain components. Create 4 comprehensive diagrams. Each needs 12-20 components. Never use generic names.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return { pageType: "component-diagrams", phase: "design", title: "Component Diagrams", content: response.choices[0]?.message?.content || "", order: 17 };
}

// ============================================================================
// IMPLEMENTATION PHASE GENERATORS
// ============================================================================

async function generateCodingStandardsPage(
  techStack: any = {},
  requirement: string = ""
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const techStr = Object.entries(techStack).filter(([_, v]: [string, any]) => Array.isArray(v) && v.length > 0).map(([k, v]: [string, any]) => `${k}: ${v.join(', ')}`).join('; ');
  
  const prompt = `Generate "Coding Standards & Guidelines" for Azure DevOps Wiki.

**Tech Stack:** ${techStr || 'JavaScript/TypeScript, React, Node.js'}

Include:
1. Language-Specific Conventions (naming, formatting)
2. Code Structure & Organization
3. Documentation Standards (JSDoc, comments)
4. Code Review Checklist
5. Best Practices
6. Anti-Patterns to Avoid

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a senior software engineer." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "coding-standards", phase: "implementation", title: "Coding Standards & Guidelines", content: response.choices[0]?.message?.content || "", order: 19 };
}

async function generateVersionControlGuidelinesPage(
  techStack: any = {}
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate "Version Control & Git Guidelines" for Azure DevOps Wiki.

Include:
1. Branching Strategy (Git Flow / GitHub Flow / Trunk-based)
2. Commit Message Convention (Conventional Commits)
3. Pull Request Process
4. Code Review Guidelines
5. Merge Strategies
6. Tag & Release Process

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a DevOps engineer." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "version-control", phase: "implementation", title: "Version Control & Git Guidelines", content: response.choices[0]?.message?.content || "", order: 21 };
}

async function generateInfrastructureDiagramPage(
  techStack: any = {},
  features: any[] = [],
  domain: string = 'General',
  contextSummary: string = ''
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const cloudProvider = techStack.cloud && techStack.cloud.length > 0 ? techStack.cloud[0] : 'AWS';
  const backend = techStack.backend && techStack.backend.length > 0 ? techStack.backend.join(', ') : 'Node.js, Express';
  const frontend = techStack.frontend && techStack.frontend.length > 0 ? techStack.frontend.join(', ') : 'React';
  const database = techStack.database && techStack.database.length > 0 ? techStack.database.join(', ') : 'MySQL';
  
  const featuresList = features.slice(0, 8).map(f => `- ${f.title}`).join('\n');
  
  const prompt = `${contextSummary}

**CRITICAL - CREATE INFRASTRUCTURE FOR:**

**Features:**
${featuresList}

**Tech Stack:**
Cloud: ${cloudProvider} | Frontend: ${frontend} | Backend: ${backend} | DB: ${database}

---

# Infrastructure Architecture Diagrams

Generate 6 comprehensive infrastructure diagrams using Azure DevOps Wiki Mermaid syntax (::: mermaid blocks).

## 1. System Architecture Overview (15-20 nodes)
::: mermaid
graph TB
    Users[Users]
    CDN[CDN]
    LB[Load Balancer]
    App1[${backend} Server 1]
    App2[${backend} Server 2]
    DB[(${database})]
    Cache[(Redis)]
    Users --> CDN
    CDN --> LB
    LB --> App1
    LB --> App2
    App1 --> DB
    App2 --> DB
    App1 --> Cache
:::
- Client → CDN → LB → App → DB → External APIs
- Complete end-to-end flow

## 2. ${cloudProvider} Infrastructure Topology (12-18 nodes)
- VPC/Virtual Network
- Subnets (public/private)
- Availability Zones for HA
- Security Groups/NSGs
- NAT Gateway
- Internet Gateway

## 3. Application Deployment (10-15 nodes)
- Container orchestration (K8s/ECS) OR VMs
- ${backend} services deployment
- ${database} primary-replica setup
- Redis cache cluster
- Message queue

## 4. CI/CD Pipeline (10-12 stages)
- Source: Git repo
- Build: Compile, test
- Package: Docker/artifacts
- Deploy: Dev → Staging → Prod
- Rollback process

## 5. Security & Networking (8-12 nodes)
- WAF
- DDoS protection
- VPN/Private endpoints
- SSL/TLS termination
- OAuth/JWT flow
- Secrets vault

## 6. Monitoring & Observability (8-10 nodes)
- APM (Application Performance)
- Log aggregation
- Metrics collection
- Alerting
- Dashboards

**MANDATORY for ALL diagrams:**
- Use ${cloudProvider}, ${backend}, ${frontend}, ${database}
- ${domain} domain-specific naming
- Data flows clearly labeled
- HA/scalability patterns
- Return ONLY Markdown (NO \`\`\`markdown wrapper)`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [
      { role: "system", content: `You are an expert cloud solutions architect. Create 6 comprehensive infrastructure diagrams using ${cloudProvider}, ${backend}, ${frontend}, ${database}. Each diagram needs 10-20 nodes showing production-ready ${domain} infrastructure. Never use generic names.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });

  return { pageType: "infrastructure-diagrams", phase: "implementation", title: "Infrastructure Diagrams", content: response.choices[0]?.message?.content || "", order: 22 };
}

// ============================================================================
// TESTING PHASE GENERATORS
// ============================================================================

async function generateTestPlanPage(
  features: any[] = [],
  userStories: any[] = [],
  epics: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Test Plan" for Azure DevOps Wiki.

**Scope:** ${epics.length} epics, ${features.length} features, ${userStories.length} stories

Include:
1. Test Strategy & Approach
2. Test Scope (In-scope, Out-of-scope)
3. Test Types (Unit, Integration, E2E, Performance, Security)
4. Test Environment Setup
5. Test Schedule & Milestones
6. Entry/Exit Criteria
7. Risks & Mitigation
8. Test Deliverables

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a QA architect." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "test-plan", phase: "testing", title: "Test Plan", content: response.choices[0]?.message?.content || "", order: 24 };
}

async function generateTestCasesPage(
  userStories: any[] = [],
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const storiesSample = userStories.slice(0, 8).map(s => s.title || s.description).join('; ');
  
  const prompt = `Generate "Test Cases" documentation for Azure DevOps Wiki.

**Sample Stories:** ${storiesSample || 'User authentication, Data management, Reporting'}

Include:
1. Test Case Template
2. Sample Test Cases (10-15) with:
   - Test Case ID
   - Description
   - Preconditions
   - Test Steps
   - Expected Results
   - Priority
   - Status

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a QA engineer." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "test-cases", phase: "testing", title: "Test Cases", content: response.choices[0]?.message?.content || "", order: 25 };
}

async function generateTestCoverageMatrixPage(
  epics: any[] = [],
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a "Test Coverage Matrix" for Azure DevOps Wiki.

**Scope:** ${epics.length} requirements, ${features.length} features, ${userStories.length} stories

Include:
1. Coverage Matrix Table (Requirements vs Test Cases)
2. Coverage Summary Statistics
3. Mermaid visualization
4. Gap Analysis

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a QA architect." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "test-coverage-matrix", phase: "testing", title: "Test Coverage Matrix", content: response.choices[0]?.message?.content || "", order: 26 };
}

// ============================================================================
// DEPLOYMENT PHASE GENERATORS
// ============================================================================

async function generateReleaseNotesPage(
  epics: any[] = [],
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const featuresList = features.slice(0, 15).map(f => `- ${f.title || f.description}`).join('\n');
  
  const prompt = `Generate "Release Notes" template for Azure DevOps Wiki.

**Features:**
${featuresList || '- Feature 1\n- Feature 2\n- Feature 3'}

Include:
1. Release Information (Version, Date, Type)
2. What's New (New Features)
3. Improvements
4. Bug Fixes
5. Breaking Changes
6. Known Issues
7. Upgrade Instructions

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a technical writer." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "release-notes", phase: "deployment", title: "Release Notes", content: response.choices[0]?.message?.content || "", order: 28 };
}

async function generateUserManualPage(
  userStories: any[] = [],
  personas: any[] = [],
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const personasList = personas.map(p => p.name).join(', ');
  
  const prompt = `Generate a "User Manual" for Azure DevOps Wiki.

**Target Users:** ${personasList || 'End Users, Administrators'}
**Features:** ${features.length}

Include:
1. Getting Started Guide
2. User Interface Overview
3. Key Features & How to Use
4. Step-by-Step Tutorials
5. Tips & Best Practices
6. Troubleshooting & FAQ
7. Support Contact Information

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are a technical writer." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return { pageType: "user-manual", phase: "deployment", title: "User Manual", content: response.choices[0]?.message?.content || "", order: 29 };
}

async function generateMaintenancePlanPage(
  requirement: string,
  techStack: any = {}
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a "Maintenance Plan" for Azure DevOps Wiki.

**Project:** ${requirement}

Include:
1. Maintenance Overview & Objectives
2. Maintenance Types (Corrective, Adaptive, Perfective, Preventive)
3. Maintenance Schedule
4. Support Tiers & SLAs
5. Incident Management Process
6. Change Management Process
7. Performance Monitoring
8. Backup & Disaster Recovery
9. End-of-Life Plan

Return ONLY the Markdown content.`;

  const response = await openai.chat.completions.create({
    model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o",
    messages: [{ role: "system", content: "You are an IT operations manager." }, { role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return { pageType: "maintenance-plan", phase: "deployment", title: "Maintenance Plan", content: response.choices[0]?.message?.content || "", order: 30 };
}
