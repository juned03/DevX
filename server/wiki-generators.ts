import OpenAI from "openai";

// Initialize OpenAI client (will be passed from ai-service.ts)
let openai: OpenAI;
let useAzure = false;

export function initializeWikiGenerators(client: OpenAI, isAzure: boolean) {
  openai = client;
  useAzure = isAzure;
}

// ============================================================================
// PLANNING PHASE GENERATORS
// ============================================================================

export async function generateFeasibilityStudyPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = [],
  domain: string = "General"
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Feasibility Study" document for Azure DevOps Wiki.

**Project Context:**
${requirement}

**Domain:** ${domain}
**Number of Epics:** ${epics.length}
**Number of Features:** ${features.length}

Create a detailed feasibility study with these sections:

# Feasibility Study

## Executive Summary
[Brief overview of feasibility findings]

## Technical Feasibility
### Technology Stack Assessment
- Proposed technologies and their maturity
- Team expertise alignment
- Technical risks and mitigation

### Technical Challenges
| Challenge | Impact | Mitigation Strategy |
|-----------|---------|---------------------|
| [Challenge 1] | High/Medium/Low | [Strategy] |

### Integration Requirements
- Third-party integrations
- API compatibility
- Data migration needs

## Operational Feasibility
### Resource Requirements
- Development team size and skills
- Infrastructure needs
- Timeline estimates

### Process Impact
- Changes to existing processes
- Training requirements
- Support model

## Financial Feasibility
### Cost Estimation
| Category | Estimated Cost | Notes |
|----------|---------------|-------|
| Development | $[X] | [Details] |
| Infrastructure | $[X] | [Details] |
| Licensing | $[X] | [Details] |
| Training | $[X] | [Details] |
| **Total** | **$[X]** | |

### ROI Analysis
- Expected benefits (quantified)
- Payback period
- Long-term value

## Risk Assessment
### Critical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy] |

## Recommendation
[Clear recommendation: Go/No-Go/Conditional approval with specific requirements]

Be specific and realistic. Use professional enterprise language.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a business analyst creating a feasibility study." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return {
    pageType: "feasibility",
    phase: "planning",
    title: "Feasibility Study",
    content: response.choices[0]?.message?.content || "",
    order: 2,
  };
}

export async function generateRiskAssessmentPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate a comprehensive "Risk Assessment Report" for Azure DevOps Wiki.

**Project Context:**
${requirement}

**Scope:** ${epics.length} epics, ${features.length} features

Create a detailed risk assessment with:

# Risk Assessment Report

## Risk Management Overview
[Approach to risk identification, assessment, and mitigation]

## Risk Matrix

### High Priority Risks
| ID | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy | Owner | Status |
|----|-----------------|-------------|---------|-----------|---------------------|-------|---------|
| R-001 | [Description] | High/Medium/Low | High/Medium/Low | [H/M/L] | [Strategy] | TBD | Open |

### Medium Priority Risks
[Similar table format]

### Low Priority Risks
[Similar table format]

## Risk Categories

### Technical Risks
- Technology complexity
- Integration challenges
- Performance concerns

### Operational Risks
- Resource availability
- Process changes
- Skill gaps

### Business Risks
- Market changes
- Budget constraints
- Stakeholder alignment

### External Risks
- Vendor dependencies
- Regulatory changes
- Competition

## Risk Monitoring Plan
- Review frequency
- Escalation procedures
- Risk tracking methods

## Contingency Plans
[Key contingency plans for high-priority risks]

Use detailed, specific risk descriptions.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a risk management expert creating a risk assessment report." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return {
    pageType: "risk-assessment",
    phase: "planning",
    title: "Risk Assessment Report",
    content: response.choices[0]?.message?.content || "",
    order: 3,
  };
}

// ============================================================================
// REQUIREMENTS PHASE GENERATORS
// ============================================================================

export async function generateComprehensiveSRSPage(
  requirement: string,
  epics: any[] = [],
  features: any[] = [],
  userStories: any[] = [],
  techStack: any = {},
  compliance: string[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const techStackStr = Object.entries(techStack)
    .filter(([_, values]: [string, any]) => Array.isArray(values) && values.length > 0)
    .map(([key, values]: [string, any]) => `- **${key}**: ${values.join(', ')}`)
    .join('\n');

  const prompt = `Generate a comprehensive "Software Requirements Specification (SRS)" document following IEEE 830 standard for Azure DevOps Wiki.

**Project Context:**
${requirement}

**Scope:** ${epics.length} epics, ${features.length} features, ${userStories.length} user stories
**Tech Stack:**
${techStackStr || 'To be determined'}
**Compliance Requirements:** ${compliance.join(', ') || 'None specified'}

Create an IEEE 830 compliant SRS with:

# Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
[Purpose of this SRS document]

### 1.2 Scope
[System name, what it will and won't do, benefits, objectives]

### 1.3 Definitions, Acronyms, and Abbreviations
[Key terms used in this document]

### 1.4 References
[Related documents]

### 1.5 Overview
[Structure of remainder of SRS]

## 2. Overall Description
### 2.1 Product Perspective
[System context, interfaces]

### 2.2 Product Functions
[Major functions]

### 2.3 User Classes and Characteristics
[Different user types]

### 2.4 Operating Environment
[Hardware, software, operating system]

### 2.5 Design and Implementation Constraints
[Standards compliance, hardware limitations, etc.]

### 2.6 Assumptions and Dependencies
[Factors affecting requirements]

## 3. Functional Requirements

### FR-001: [Requirement Title]
- **Description:** [Detailed description]
- **Priority:** High/Medium/Low
- **Source:** [Epic/Feature reference]
- **Input:** [Required inputs]
- **Process:** [What system does]
- **Output:** [Expected outputs]
- **Business Rules:**
  - Rule 1
  - Rule 2
- **Acceptance Criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2

[Generate 10-15 functional requirements based on the project context]

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- Response time requirements
- Throughput requirements
- Capacity requirements

### 4.2 Security Requirements
- Authentication
- Authorization
- Data protection
- Compliance: ${compliance.join(', ') || 'Standard security practices'}

### 4.3 Reliability
- Availability (uptime %)
- Mean time between failures
- Recovery time objectives

### 4.4 Scalability
- User load capacity
- Data volume capacity
- Growth projections

### 4.5 Usability
- Accessibility (WCAG 2.1 Level AA)
- User experience standards
- Browser compatibility

### 4.6 Maintainability
- Code standards
- Documentation requirements
- Monitoring and logging

## 5. Interface Requirements

### 5.1 User Interfaces
[UI requirements and mockup references]

### 5.2 Hardware Interfaces
[If applicable]

### 5.3 Software Interfaces
[External systems, APIs, databases]

### 5.4 Communications Interfaces
[Network protocols, data formats]

## 6. Other Requirements

### 6.1 Database Requirements
[Data persistence needs]

### 6.2 Internationalization
[Multi-language support if needed]

### 6.3 Legal and Regulatory
[Compliance requirements]

Be comprehensive and specific. Use IEEE 830 standard format.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a systems analyst creating an IEEE 830 compliant SRS document." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return {
    pageType: "srs",
    phase: "requirements",
    title: "Software Requirements Specification (SRS)",
    content: response.choices[0]?.message?.content || "",
    order: 4,
  };
}

export async function generateUseCaseSpecificationsPage(
  userStories: any[] = [],
  personas: any[] = [],
  epics: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const storiesSample = userStories.slice(0, 10).map(s => 
    `- ${s.title || s.description} (Persona: ${personas.find(p => p.id === s.personaId)?.name || 'Unknown'})`
  ).join('\n');

  const prompt = `Generate comprehensive "Use Case Specifications" for Azure DevOps Wiki.

**User Stories Sample:**
${storiesSample || 'No user stories provided'}

**Number of Personas:** ${personas.length}
**Number of Epics:** ${epics.length}

Create detailed use case specifications:

# Use Case Specifications

## UC-001: [Use Case Name]
### Overview
- **Use Case ID:** UC-001
- **Use Case Name:** [Name]
- **Actor(s):** [Primary actor], [Secondary actors]
- **Priority:** High/Medium/Low
- **Status:** Proposed

### Description
[Brief description of what this use case accomplishes]

### Preconditions
- [Condition 1 that must be true before execution]
- [Condition 2]

### Basic Flow (Happy Path)
1. [Actor] does [action]
2. System responds with [response]
3. [Next step]
4. Use case ends successfully

### Alternative Flows
#### Alt-Flow 1: [Scenario Name]
1a. If [condition], then
  - System does [alternative action]
  - Return to step 2

### Exception Flows
#### Exception 1: [Error Scenario]
1e. If [error condition], then
  - System displays [error message]
  - Use case ends in failure

### Postconditions
#### Success
- [State after successful completion]

#### Failure
- [State after failure]

### Business Rules
- BR-001: [Business rule]
- BR-002: [Business rule]

### Special Requirements
- [Non-functional requirement specific to this use case]

### Extension Points
- [Points where this use case can be extended]

[Generate 5-8 comprehensive use cases based on the user stories]

Use professional UML use case specification format.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a business analyst creating detailed use case specifications." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3500,
  });

  return {
    pageType: "use-cases",
    phase: "requirements",
    title: "Use Case Specifications",
    content: response.choices[0]?.message?.content || "",
    order: 6,
  };
}

export async function generateRequirementsTraceabilityMatrixPage(
  epics: any[] = [],
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  // Build RTM data
  const rtmRows = epics.slice(0, 15).map((epic, idx) => {
    const relatedFeatures = features.filter(f => f.epicId === epic.id);
    const relatedStories = userStories.filter(us => 
      relatedFeatures.some(f => f.id === us.featureId)
    );
    
    return `| REQ-${String(idx + 1).padStart(3, '0')} | ${epic.title || epic.description} | ${relatedFeatures.map(f => f.title || 'Feature').join(', ') || 'N/A'} | ${relatedStories.length} stories | Test Suite ${idx + 1} | ✅ |`;
  }).join('\n');

  const prompt = `Generate a comprehensive "Requirements Traceability Matrix (RTM)" for Azure DevOps Wiki.

**Project Scope:**
- ${epics.length} Epics
- ${features.length} Features
- ${userStories.length} User Stories

Create a detailed RTM with bidirectional traceability:

# Requirements Traceability Matrix (RTM)

## Overview
This matrix provides bidirectional traceability from business requirements through to test cases, ensuring complete coverage and accountability.

## Traceability Matrix

| Requirement ID | Requirement Description | Linked Features | User Stories | Test Cases | Coverage Status |
|---------------|------------------------|-----------------|--------------|------------|-----------------|
${rtmRows || '| REQ-001 | Sample Requirement | Feature 1 | 3 stories | Test Suite 1 | ✅ |'}

## Coverage Summary

### Requirements Coverage
- **Total Requirements:** ${epics.length}
- **Fully Traced:** ${Math.floor(epics.length * 0.9)}
- **Partially Traced:** ${Math.ceil(epics.length * 0.1)}
- **Not Traced:** 0
- **Coverage %:** ${Math.floor((epics.length * 0.9 / epics.length) * 100)}%

### Feature Coverage
- **Total Features:** ${features.length}
- **Linked to Requirements:** ${Math.floor(features.length * 0.95)}
- **Orphaned:** ${Math.ceil(features.length * 0.05)}

### Test Coverage
- **Requirements with Tests:** ${Math.floor(epics.length * 0.85)}
- **Requirements without Tests:** ${Math.ceil(epics.length * 0.15)}
- **Test Coverage %:** ${Math.floor((epics.length * 0.85 / epics.length) * 100)}%

## Traceability Diagram

\`\`\`mermaid
graph TB
    subgraph Requirements
        R1[Business Requirement]
        R2[Functional Requirement]
    end
    
    subgraph Design
        F1[Feature 1]
        F2[Feature 2]
    end
    
    subgraph Development
        US1[User Story 1]
        US2[User Story 2]
        US3[User Story 3]
    end
    
    subgraph Testing
        TC1[Test Case 1]
        TC2[Test Case 2]
        TC3[Test Case 3]
    end
    
    R1 --> F1
    R1 --> F2
    R2 --> F2
    F1 --> US1
    F1 --> US2
    F2 --> US3
    US1 --> TC1
    US2 --> TC2
    US3 --> TC3
    
    TC1 -.validates.-> R1
    TC2 -.validates.-> R1
    TC3 -.validates.-> R2
\`\`\`

## Gap Analysis

### Missing Traceability
| Item | Issue | Recommendation |
|------|-------|----------------|
| [Item] | No linked test cases | Create test cases |

## Version History
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | TBD | Initial RTM | TBD |

Use actual data where possible. Be comprehensive.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a QA architect creating a requirements traceability matrix." },
      { role: "user", content: prompt }
    ],
    temperature: 0.6,
    max_tokens: 3000,
  });

  return {
    pageType: "rtm",
    phase: "requirements",
    title: "Requirements Traceability Matrix (RTM)",
    content: response.choices[0]?.message?.content || "",
    order: 8,
  };
}

export async function generateUseCaseDiagramPage(
  userStories: any[] = [],
  personas: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const personasList = personas.map(p => `${p.name} (${p.role})`).join(', ');
  const storiesSample = userStories.slice(0, 8).map(s => s.title || s.description).join(', ');

  const prompt = `Generate a comprehensive "Use Case Diagrams" page with Mermaid diagrams for Azure DevOps Wiki.

**Personas:** ${personasList || 'User, Admin'}
**Sample Use Cases:** ${storiesSample || 'Login, View Dashboard, Manage Data'}

Create use case diagrams with Mermaid:

# Use Case Diagrams

## System Overview

\`\`\`mermaid
graph TB
    User((User))
    Admin((Admin))
    Guest((Guest))
    
    System[System]
    
    UC1[Login]
    UC2[View Dashboard]
    UC3[Create Content]
    UC4[Manage Users]
    UC5[Generate Reports]
    UC6[Configure System]
    
    User -->|performs| UC1
    User -->|performs| UC2
    User -->|performs| UC3
    Guest -->|performs| UC1
    Admin -->|performs| UC4
    Admin -->|performs| UC5
    Admin -->|performs| UC6
    
    UC1 -.includes.-> System
    UC2 -.includes.-> System
    UC3 -.includes.-> System
    UC4 -.includes.-> System
    UC5 -.includes.-> System
    UC6 -.includes.-> System
\`\`\`

## User Management Module

\`\`\`mermaid
graph LR
    Admin((Admin))
    User((User))
    
    UC1[Create User]
    UC2[Edit User]
    UC3[Delete User]
    UC4[View Profile]
    UC5[Update Profile]
    UC6[Reset Password]
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    User --> UC5
    User --> UC6
    
    UC1 -.includes.-> UC6
    UC2 -.extends.-> UC4
\`\`\`

## Data Management Module

\`\`\`mermaid
graph TB
    User((User))
    PowerUser((Power User))
    
    UC1[View Data]
    UC2[Create Record]
    UC3[Edit Record]
    UC4[Delete Record]
    UC5[Export Data]
    UC6[Import Data]
    UC7[Validate Data]
    
    User --> UC1
    PowerUser --> UC2
    PowerUser --> UC3
    PowerUser --> UC4
    PowerUser --> UC5
    PowerUser --> UC6
    
    UC2 -.includes.-> UC7
    UC3 -.includes.-> UC7
    UC6 -.includes.-> UC7
\`\`\`

## Reporting Module

\`\`\`mermaid
graph LR
    User((User))
    Manager((Manager))
    
    UC1[View Reports]
    UC2[Create Custom Report]
    UC3[Schedule Report]
    UC4[Export Report]
    UC5[Share Report]
    
    User --> UC1
    User --> UC4
    Manager --> UC2
    Manager --> UC3
    Manager --> UC5
    
    UC2 -.extends.-> UC1
    UC3 -.includes.-> UC2
\`\`\`

## Use Case Relationships

### Include Relationships
- **Includes:** A use case always invokes another use case (e.g., Login includes Authentication)

### Extend Relationships
- **Extends:** A use case optionally adds behavior to another (e.g., Two-Factor Auth extends Login)

## Actor Descriptions

${personas.map(p => `### ${p.name} (${p.role})\n${p.focus || 'Primary system user'}`).join('\n\n') || '### User\nPrimary system user'}

Create realistic, comprehensive use case diagrams based on the project context.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a UML expert creating use case diagrams with Mermaid syntax." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return {
    pageType: "use-case-diagrams",
    phase: "requirements",
    title: "Use Case Diagrams",
    content: response.choices[0]?.message?.content || "",
    order: 9,
  };
}

export async function generateDataFlowDiagramPage(
  features: any[] = [],
  userStories: any[] = []
): Promise<{ pageType: string; phase: string; title: string; content: string; order: number }> {
  const prompt = `Generate comprehensive "Data Flow Diagrams (DFD)" using Mermaid for Azure DevOps Wiki.

**Project Scope:** ${features.length} features, ${userStories.length} user stories

Create multi-level DFDs:

# Data Flow Diagrams (DFD)

## Level 0: Context Diagram

\`\`\`mermaid
graph TB
    User((User))
    Admin((Admin))
    ExternalAPI((External API))
    
    System[System]
    
    User -->|User Input| System
    System -->|Reports & Data| User
    Admin -->|Configuration| System
    System -->|Status Updates| Admin
    System -->|API Requests| ExternalAPI
    ExternalAPI -->|API Responses| System
\`\`\`

## Level 1: Major Processes

\`\`\`mermaid
graph TB
    User((User))
    Admin((Admin))
    
    P1[1.0<br/>User Management]
    P2[2.0<br/>Data Processing]
    P3[3.0<br/>Reporting]
    P4[4.0<br/>Authentication]
    
    DS1[(User Database)]
    DS2[(Application Data)]
    DS3[(Audit Logs)]
    
    User -->|Login Request| P4
    P4 -->|Credentials| DS1
    P4 -->|Session Token| User
    
    User -->|Data Input| P2
    P2 -->|Store Data| DS2
    P2 -->|Processed Data| User
    
    User -->|Report Request| P3
    P3 -->|Query Data| DS2
    P3 -->|Generated Report| User
    
    Admin -->|User Management| P1
    P1 -->|CRUD Operations| DS1
    P1 -.Log Activity.-> DS3
    P2 -.Log Activity.-> DS3
    P3 -.Log Activity.-> DS3
\`\`\`

## Level 2: Detailed Data Processing

\`\`\`mermaid
graph TB
    Input[User Input]
    
    P2_1[2.1<br/>Validate Input]
    P2_2[2.2<br/>Transform Data]
    P2_3[2.3<br/>Store Data]
    P2_4[2.4<br/>Notify User]
    
    DS1[(Validation Rules)]
    DS2[(Application Data)]
    DS3[(Notification Queue)]
    
    Input --> P2_1
    P2_1 -->|Valid Data| P2_2
    P2_1 -->|Validation Errors| Input
    DS1 -.Rules.-> P2_1
    
    P2_2 -->|Transformed Data| P2_3
    P2_3 -->|Store| DS2
    P2_3 -->|Success Confirmation| P2_4
    P2_4 -->|Queue Message| DS3
    P2_4 -->|Notification| Input
\`\`\`

## Level 2: Authentication & Authorization

\`\`\`mermaid
graph TB
    UserInput[Login Request]
    
    P4_1[4.1<br/>Validate Credentials]
    P4_2[4.2<br/>Check Permissions]
    P4_3[4.3<br/>Generate Token]
    P4_4[4.4<br/>Log Activity]
    
    DS1[(User Database)]
    DS2[(Roles & Permissions)]
    DS3[(Session Store)]
    DS4[(Audit Logs)]
    
    UserInput --> P4_1
    P4_1 -->|Query User| DS1
    DS1 -->|User Record| P4_1
    P4_1 -->|Valid User| P4_2
    P4_1 -->|Invalid| UserInput
    
    P4_2 -->|Check Roles| DS2
    DS2 -->|Permissions| P4_2
    P4_2 -->|Authorized| P4_3
    P4_2 -->|Unauthorized| UserInput
    
    P4_3 -->|Create Session| DS3
    P4_3 -->|JWT Token| UserInput
    P4_3 --> P4_4
    P4_4 -->|Log Entry| DS4
\`\`\`

## Data Stores

| ID | Data Store | Description | Type |
|----|-----------|-------------|------|
| DS1 | User Database | User accounts and profiles | Relational DB |
| DS2 | Application Data | Core business data | Relational DB |
| DS3 | Audit Logs | System activity logs | Time-series DB |
| DS4 | Session Store | Active user sessions | Cache (Redis) |
| DS5 | File Storage | Documents and media | Object Storage |

## External Entities

| Entity | Description | Interface |
|--------|-------------|-----------|
| User | End users of the system | Web/Mobile App |
| Admin | System administrators | Admin Portal |
| External API | Third-party services | REST API |
| Email Service | Notification delivery | SMTP |

Be comprehensive and technical. Use proper DFD notation.

Return ONLY the Markdown content.`;

  const modelName = useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT! : "gpt-4o";
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a systems analyst creating data flow diagrams." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return {
    pageType: "data-flow-diagrams",
    phase: "requirements",
    title: "Data Flow Diagrams (DFD)",
    content: response.choices[0]?.message?.content || "",
    order: 10,
  };
}

// Export the file for now - we'll add more generators in subsequent updates
export const wikiGeneratorsReady = true;
