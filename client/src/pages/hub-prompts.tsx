import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Copy, Sparkles, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
}

const samplePrompts: Prompt[] = [
  {
    id: "1",
    title: "User Story Generator",
    description: "Create well-structured user stories following Agile best practices",
    content: `As a [user role/persona], I want to [specific action/goal] so that [clear business value/benefit].

Acceptance Criteria:
1. Given [initial context/state]
   When [specific action is performed]
   Then [expected outcome/result]

2. Given [alternative context]
   When [user performs action]
   Then [system responds with]

3. Given [edge case scenario]
   When [action occurs]
   Then [expected behavior]

Definition of Done:
☐ Code implemented and peer reviewed
☐ Unit tests written and passing (>80% coverage)
☐ Integration tests passing
☐ Documentation updated
☐ Accessibility requirements met (WCAG 2.1 AA)
☐ Performance benchmarks met
☐ Product owner acceptance obtained

Technical Notes:
[API endpoints, database changes, third-party integrations, etc.]

Dependencies:
[Related stories, blocked by, blocking]`,
    category: "Product Management",
    tags: ["user-story", "agile", "requirements", "scrum"],
    usageCount: 156
  },
  {
    id: "2",
    title: "API Design Specification",
    description: "Document RESTful API endpoints with complete specifications",
    content: `# API Endpoint: [Resource Name]

## Endpoint Details
- **Method**: [GET/POST/PUT/PATCH/DELETE]
- **Path**: /api/v1/[resource]/[{id}]
- **Authentication**: [Required/Optional/None]
- **Rate Limit**: [X requests per minute]

## Request

### Headers
\`\`\`
Content-Type: application/json
Authorization: Bearer {token}
X-Request-ID: {uuid}
\`\`\`

### Path Parameters
- \`id\` (string, required): Unique identifier for the resource

### Query Parameters
- \`page\` (integer, optional, default: 1): Page number for pagination
- \`limit\` (integer, optional, default: 20, max: 100): Items per page
- \`sort\` (string, optional): Sort field (prefix with - for descending)
- \`filter\` (string, optional): Filter expression

### Request Body
\`\`\`json
{
  "field1": "string",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
\`\`\`

## Response

### Success Response (200 OK)
\`\`\`json
{
  "data": {
    "id": "uuid",
    "field1": "value",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
\`\`\`

### Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Format
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
\`\`\`

## Business Logic
[Describe validation rules, side effects, triggers, notifications]

## Performance Considerations
- Expected response time: < 200ms (p95)
- Database indexes required: [list]
- Caching strategy: [description]`,
    category: "Development",
    tags: ["api", "rest", "documentation", "backend"],
    usageCount: 143
  },
  {
    id: "3",
    title: "Database Schema Design",
    description: "Design normalized database schemas with proper relationships",
    content: `# Database Schema: [Table Name]

## Table Structure

### Table: \`[table_name]\`
**Purpose**: [Brief description of what this table stores]

\`\`\`sql
CREATE TABLE [table_name] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Fields
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES [table_name](id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Indexes
CREATE INDEX idx_[table]_user_id ON [table_name](user_id);
CREATE INDEX idx_[table]_status ON [table_name](status) WHERE deleted_at IS NULL;
CREATE INDEX idx_[table]_created_at ON [table_name](created_at DESC);

-- Full-text search
CREATE INDEX idx_[table]_search ON [table_name] USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
\`\`\`

## Relationships
- **One-to-Many**: \`users\` → \`[table_name]\` (user can have multiple records)
- **Self-Referential**: \`parent_id\` for hierarchical data
- **Many-to-Many**: Via junction table \`[table1]_[table2]\`

## Data Validation Rules
- \`name\`: Required, max 255 characters, must be unique per user
- \`status\`: Enum with specific allowed values
- \`email\`: Must match email regex pattern
- Soft delete using \`deleted_at\` timestamp

## Migration Notes
\`\`\`sql
-- Rollback plan
DROP INDEX IF EXISTS idx_[table]_user_id;
DROP TABLE IF EXISTS [table_name] CASCADE;
\`\`\`

## Performance Expectations
- Insert: < 10ms
- Query by ID: < 5ms
- List with pagination: < 50ms
- Expected row count: [estimate]`,
    category: "Development",
    tags: ["database", "schema", "sql", "postgresql"],
    usageCount: 98
  },
  {
    id: "4",
    title: "Bug Report Template",
    description: "Detailed bug report with reproduction steps and environment details",
    content: `# Bug Report: [Brief, descriptive title]

## Severity
☐ Critical - System down, blocking all users
☐ High - Major feature broken, affects many users
☐ Medium - Feature partially broken, workaround exists
☐ Low - Minor issue, cosmetic problem

## Environment
- **Platform/OS**: [Windows 11 / macOS 14 / Ubuntu 22.04]
- **Browser**: [Chrome 120 / Firefox 121 / Safari 17]
- **Application Version**: [v2.3.1]
- **Server Environment**: [Production / Staging / Development]
- **User Role/Permissions**: [Admin / Standard User]

## Description
[Clear, concise description of the bug]

## Steps to Reproduce
1. Navigate to [specific page/URL]
2. Click on [button/element]
3. Enter [specific data] in [field]
4. Click [submit/save]
5. Observe the error

## Expected Behavior
[What should happen under normal circumstances]

## Actual Behavior
[What actually happens - be specific]

## Error Messages
\`\`\`
[Paste exact error message, stack trace, or console output]
\`\`\`

## Screenshots/Videos
[Attach visual evidence - screenshots, screen recordings, GIFs]

## Frequency
☐ Always - 100% reproducible
☐ Often - 75% reproducible
☐ Sometimes - 50% reproducible
☐ Rare - 25% reproducible

## Additional Context
- **Related Issues**: #[issue number]
- **First Noticed**: [Date or version when bug appeared]
- **User Impact**: [How many users affected, business impact]
- **Workaround**: [Temporary solution if available]

## Technical Details (for developers)
- **Suspected Component**: [Frontend/Backend/Database/API]
- **Related Code**: [File paths, function names]
- **Logs**: 
\`\`\`
[Relevant application/server logs]
\`\`\`

## Testing Notes
- [ ] Bug verified in development environment
- [ ] Bug verified in staging environment
- [ ] Bug affects mobile devices
- [ ] Bug affects specific browsers only`,
    category: "Testing",
    tags: ["bug", "testing", "qa", "issue-tracking"],
    usageCount: 187
  },
  {
    id: "5",
    title: "CI/CD Pipeline Configuration",
    description: "Complete continuous integration and deployment pipeline setup",
    content: `# CI/CD Pipeline: [Project Name]

## Pipeline Overview
This pipeline automates build, test, and deployment processes for [application type].

## Triggers
- **Push**: main, develop, release/* branches
- **Pull Request**: All branches to main/develop
- **Schedule**: Daily at 2 AM UTC (dependency updates)
- **Manual**: Via workflow dispatch

## Stages

### 1. Build & Validate
\`\`\`yaml
- Checkout code
- Set up build environment (Node 20.x / Python 3.11 / etc.)
- Restore cached dependencies
- Install dependencies
- Run linter (ESLint, Prettier, etc.)
- Type checking (TypeScript, mypy, etc.)
- Build application
- Cache build artifacts
\`\`\`

### 2. Test
\`\`\`yaml
- Unit tests (Jest, pytest, etc.)
  * Coverage threshold: 80%
  * Parallel execution
- Integration tests
  * Database migrations
  * API contract tests
- E2E tests (Playwright, Cypress)
  * Critical user flows
  * Cross-browser testing
- Security scanning
  * Dependency vulnerabilities (npm audit, Snyk)
  * SAST (Static Application Security Testing)
- Performance tests
  * Load testing baseline
  * Bundle size checks
\`\`\`

### 3. Build Artifacts
\`\`\`yaml
- Create production build
- Optimize assets (minify, compress)
- Generate source maps
- Build Docker image
- Tag with version and commit SHA
- Push to container registry
\`\`\`

### 4. Deploy to Staging
\`\`\`yaml
- Deploy to staging environment
- Run smoke tests
- Run database migrations
- Notify team in Slack
- Wait for approval (manual gate)
\`\`\`

### 5. Deploy to Production
\`\`\`yaml
- Blue-green deployment strategy
- Deploy to production
- Health checks
- Smoke tests on production
- Monitor error rates (15 min)
- Automatic rollback if errors > threshold
- Update status page
- Send deployment notification
\`\`\`

## Environment Variables
\`\`\`
# Build-time
NODE_ENV=production
BUILD_VERSION=${'$'}{{github.sha}}

# Runtime (from secrets)
DATABASE_URL=${'$'}{{secrets.DATABASE_URL}}
API_KEY=${'$'}{{secrets.API_KEY}}
\`\`\`

## Notifications
- **Success**: Slack #deployments channel
- **Failure**: Slack #alerts, Email to on-call
- **Status**: GitHub commit status checks

## Rollback Procedure
\`\`\`bash
# Automatic rollback triggers:
- Health check fails > 3 times
- Error rate > 5% for 5 minutes
- Response time p95 > 2 seconds

# Manual rollback:
./scripts/rollback.sh [previous-version]
\`\`\`

## Monitoring
- Application logs: CloudWatch/DataDog
- Metrics: Response time, error rate, throughput
- Alerts: PagerDuty integration`,
    category: "DevOps",
    tags: ["ci-cd", "deployment", "automation", "devops"],
    usageCount: 112
  },
  {
    id: "6",
    title: "Product Requirements Document",
    description: "Comprehensive PRD template for new features and products",
    content: `# Product Requirements Document
## [Feature/Product Name]

### Document Info
- **Author**: [Name, Role]
- **Date**: [YYYY-MM-DD]
- **Status**: [Draft / In Review / Approved]
- **Version**: [1.0]
- **Stakeholders**: [List key stakeholders]

---

## 1. Executive Summary
[2-3 paragraph overview of what's being built and why it matters]

### Problem Statement
[Describe the user problem or business opportunity]

### Proposed Solution
[High-level description of the solution]

### Success Metrics
- [Metric 1]: Increase by X%
- [Metric 2]: Reduce by Y%
- [Metric 3]: Achieve Z target

---

## 2. Background & Context

### Market Research
- **Market Size**: [TAM, SAM, SOM]
- **Competitors**: [How competitors solve this]
- **Differentiation**: [Our unique approach]

### User Research
- **Target Users**: [Personas, demographics]
- **Pain Points**: [Current challenges]
- **User Quotes**: [Direct feedback from interviews]

---

## 3. Goals & Objectives

### Business Goals
1. [Revenue/Growth goal]
2. [Market share goal]
3. [Efficiency goal]

### User Goals
1. [User outcome 1]
2. [User outcome 2]

### Non-Goals (Out of Scope)
- [What we're NOT building in this iteration]

---

## 4. User Stories & Use Cases

### Primary Use Cases
**Use Case 1**: [Title]
- **Actor**: [User type]
- **Goal**: [What they want to accomplish]
- **Steps**: [Detailed flow]
- **Success**: [Outcome]

### User Journeys
[Map the end-to-end user experience]

---

## 5. Functional Requirements

### Must Have (P0)
- [ ] [Critical requirement 1]
- [ ] [Critical requirement 2]

### Should Have (P1)
- [ ] [Important requirement 1]
- [ ] [Important requirement 2]

### Nice to Have (P2)
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

---

## 6. Non-Functional Requirements

### Performance
- Page load time: < 2 seconds
- API response time: < 200ms (p95)
- Support: 10,000 concurrent users

### Security
- Authentication: OAuth 2.0
- Data encryption: AES-256
- Compliance: GDPR, SOC 2

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatible
- Keyboard navigation

### Scalability
- Horizontal scaling capability
- Database sharding support
- CDN integration

---

## 7. Design & User Experience

### Wireframes
[Link to Figma/design files]

### User Flows
[Link to user flow diagrams]

### Design Principles
- [Principle 1]
- [Principle 2]

---

## 8. Technical Considerations

### Architecture
[High-level system architecture]

### Dependencies
- [External service 1]
- [Internal system 2]

### Technical Risks
1. [Risk]: [Mitigation strategy]

---

## 9. Success Metrics & KPIs

### Adoption Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Activation rate

### Engagement Metrics
- Feature usage frequency
- Time spent in feature
- Completion rate

### Business Metrics
- Revenue impact
- Conversion rate
- Customer satisfaction (NPS, CSAT)

---

## 10. Rollout Plan

### Phase 1: Internal Beta (Week 1-2)
- [ ] Deploy to internal users
- [ ] Collect feedback
- [ ] Fix critical bugs

### Phase 2: Limited Release (Week 3-4)
- [ ] Release to 10% of users
- [ ] Monitor metrics
- [ ] Iterate based on data

### Phase 3: General Availability (Week 5+)
- [ ] Full rollout
- [ ] Marketing campaign
- [ ] Documentation published

---

## 11. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High | Medium | [Strategy] |
| [Risk 2] | Medium | Low | [Strategy] |

---

## 12. Open Questions
- [ ] [Question requiring decision]
- [ ] [Technical clarification needed]

---

## 13. Appendix
- [Research findings]
- [Competitive analysis]
- [Technical specifications]`,
    category: "Product Management",
    tags: ["prd", "product", "requirements", "planning"],
    usageCount: 134
  },
  {
    id: "7",
    title: "Sprint Planning Template",
    description: "Structured template for effective sprint planning meetings",
    content: `# Sprint Planning: Sprint [Number]
**Sprint Duration**: [Start Date] - [End Date] ([X weeks])

---

## Sprint Goal
[One clear, concise statement of what the team aims to achieve this sprint]

**Example**: "Enable users to complete checkout process with saved payment methods, reducing cart abandonment by 15%"

---

## Team Capacity

### Team Members
| Name | Role | Capacity (Story Points) | Availability |
|------|------|------------------------|--------------|
| [Name] | [Role] | [X pts] | [X%] |
| [Name] | [Role] | [X pts] | [X%] |
**Total Capacity**: [Y story points]

### Capacity Adjustments
- Holidays/PTO: [X days]
- Meetings/Ceremonies: [Y hours]
- Support/Bug fixes: [Z% buffer]
- **Adjusted Capacity**: [Final points]

---

## Backlog Items for Sprint

### High Priority (Must Complete)
| Story ID | Title | Story Points | Assignee | Dependencies |
|----------|-------|--------------|----------|--------------|
| US-123 | [Title] | 8 | [Name] | None |
| US-124 | [Title] | 5 | [Name] | US-123 |

### Medium Priority (Should Complete)
| Story ID | Title | Story Points | Assignee | Dependencies |
|----------|-------|--------------|----------|--------------|
| US-125 | [Title] | 3 | [Name] | None |

### Stretch Goals (If Time Permits)
| Story ID | Title | Story Points | Assignee | Dependencies |
|----------|-------|--------------|----------|--------------|
| US-126 | [Title] | 2 | [Name] | None |

**Total Committed Points**: [X] / **Capacity**: [Y]

---

## Definition of Ready (DoR)
All stories meet the following criteria:
- [ ] User story follows INVEST principles
- [ ] Acceptance criteria clearly defined
- [ ] Story sized and estimated
- [ ] No blocking dependencies
- [ ] Design assets available (if needed)
- [ ] Technical approach discussed
- [ ] Test scenarios identified

---

## Definition of Done (DoD)
- [ ] Code complete and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA testing completed
- [ ] Product owner acceptance
- [ ] No critical/high bugs

---

## Sprint Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| [External API integration delay] | High | [Start with mock data] |
| [Key developer on PTO] | Medium | [Pair programming handoff] |

---

## Technical Debt & Bug Fixes
**Allocated Capacity**: [20% of sprint]

| ID | Title | Type | Priority | Points |
|----|-------|------|----------|--------|
| BUG-45 | [Title] | Bug | High | 2 |
| TECH-12 | [Title] | Tech Debt | Medium | 3 |

---

## Dependencies & Blockers
- [ ] [External dependency 1 - Status: In Progress]
- [ ] [External dependency 2 - Status: Blocked]

**Action Items**:
- [Name] to follow up on [dependency] by [date]

---

## Sprint Ceremonies Schedule

- **Daily Standup**: Mon-Fri, 9:30 AM (15 min)
- **Backlog Refinement**: Wednesday, 2:00 PM (1 hour)
- **Sprint Review**: [End Date], 3:00 PM (1 hour)
- **Sprint Retrospective**: [End Date], 4:00 PM (1 hour)

---

## Previous Sprint Retrospective Actions
- [ ] [Action item from last retro]
- [ ] [Improvement to implement]

---

## Questions & Decisions
- [ ] [Open question requiring decision]
- [x] [Resolved question - Decision: ...]

---

## Communication Plan
- **Stakeholder Updates**: End of Week 1
- **Demo Prep**: Day before Sprint Review
- **Release Notes**: Final day of sprint`,
    category: "Project Management",
    tags: ["sprint", "agile", "scrum", "planning"],
    usageCount: 165
  },
  {
    id: "8",
    title: "UX Research Interview Guide",
    description: "Conduct effective user interviews to gather insights",
    content: `# User Interview Guide: [Research Topic]

## Research Objectives
1. [Primary objective - what you're trying to learn]
2. [Secondary objective]
3. [Tertiary objective]

**Research Questions**:
- [Key question 1]
- [Key question 2]

---

## Participant Criteria

### Target Participants
- **Role/Title**: [e.g., Product Manager, Developer]
- **Experience Level**: [e.g., 2-5 years]
- **Company Size**: [e.g., 50-500 employees]
- **Current Tool Usage**: [e.g., uses Azure DevOps or Jira]
- **Frequency**: [e.g., daily users of project management tools]

**Recruitment Goal**: [8-12 participants]

---

## Interview Structure (60 minutes)

### Introduction (5 minutes)
**Script**: 
"Hi [Name], thank you for taking the time to speak with me today. I'm [Your Name] from [Company], and I'm conducting research to understand [research topic].

This interview will take about 60 minutes. There are no right or wrong answers - I'm interested in your honest thoughts and experiences. Everything you share will be kept confidential, and we'll only use anonymized data in our reports.

I'd like to record this session for note-taking purposes. Is that okay with you?

Do you have any questions before we begin?"

---

### Warm-up Questions (5 minutes)
1. Can you tell me a bit about your role and what a typical day looks like?
2. What tools do you use daily in your work?
3. How long have you been in this role?

---

### Context & Background (10 minutes)
**Goal**: Understand current state and pain points

1. Walk me through your current workflow for [specific task]
2. What are the main challenges you face with [current process]?
3. How do you currently solve [problem]?
4. What tools or methods have you tried in the past?
5. What worked well? What didn't work?

**Follow-up probes**:
- "Can you give me a specific example?"
- "Why do you think that happened?"
- "How did that make you feel?"

---

### Deep Dive on Pain Points (15 minutes)
**Goal**: Uncover specific frustrations and needs

1. Tell me about a recent time when [problem] occurred
2. What was the impact on your work/team?
3. How frequently does this happen?
4. What would an ideal solution look like for you?
5. If you could wave a magic wand and change one thing about [process], what would it be?

**Probing questions**:
- "What happened next?"
- "How did you work around that?"
- "Who else was affected?"

---

### Solution Exploration (15 minutes)
**Goal**: Test hypotheses and gather feature feedback

[If showing prototype/mockup]:
"I'm going to show you some concepts we're exploring. Remember, these are just ideas - there's no right or wrong reaction."

1. What's your first impression of this?
2. What do you think this does?
3. How would you use this in your workflow?
4. What's missing?
5. What would you change?
6. How does this compare to what you use today?

**Tasks** (if applicable):
"I'd like you to try [specific task]. Please think aloud as you go."
- Observe: Where do they get stuck?
- Ask: "What are you thinking right now?"

---

### Prioritization & Value (5 minutes)
1. How important is solving [problem] to you on a scale of 1-10?
2. What other priorities compete for your attention?
3. Would you pay for a solution? How much?
4. Who else on your team would benefit from this?

---

### Closing Questions (3 minutes)
1. Is there anything else about [topic] that I should know?
2. Did anything surprise you about our conversation today?
3. Do you know anyone else who might be interested in participating?

---

### Wrap-up (2 minutes)
**Script**:
"Thank you so much for your time and insights today. This has been incredibly valuable. We'll be synthesizing feedback from all our interviews and will share our findings with you if you're interested.

Can I follow up with you if we have any clarifying questions?

[If applicable]: We'd like to send you a [gift card/thank you] - what email should we use?"

---

## Note-Taking Template

### Participant Info
- **ID**: P[number]
- **Date**: [YYYY-MM-DD]
- **Role**: [Title]
- **Company**: [Size/Industry]
- **Experience**: [X years]

### Key Quotes
> "[Memorable quote 1]"
> "[Memorable quote 2]"

### Observations
- **Pain Points**:
  1. [Pain point 1]
  2. [Pain point 2]

- **Desired Outcomes**:
  1. [Outcome 1]
  2. [Outcome 2]

- **Behavioral Patterns**:
  - [Pattern 1]
  - [Pattern 2]

- **Surprising Insights**:
  - [Insight 1]

### Action Items
- [ ] Follow up on [topic]
- [ ] Investigate [technical question]

---

## Research Ethics
- [ ] Consent form signed
- [ ] Recording permission obtained
- [ ] Confidentiality assured
- [ ] Right to withdraw explained
- [ ] Compensation/incentive provided`,
    category: "Design",
    tags: ["ux", "research", "interview", "user-testing"],
    usageCount: 89
  },
  {
    id: "9",
    title: "Technical Architecture Decision Record",
    description: "Document significant architectural decisions and their rationale",
    content: `# Architecture Decision Record (ADR)

## ADR [Number]: [Short Title of Decision]

**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-XXX]  
**Date**: [YYYY-MM-DD]  
**Deciders**: [List of people involved in the decision]  
**Technical Story**: [Ticket/Issue ID]

---

## Context and Problem Statement

[Describe the context and architectural problem we're trying to solve. Include:
- What is the current situation?
- What technical challenge are we facing?
- What constraints do we have?
- Why is this decision necessary?]

**Example**: "We need to choose a state management solution for our React application. The app has grown to 50+ components with complex data flows, and prop drilling is becoming unmaintainable. We need a solution that balances developer experience, performance, and team familiarity."

---

## Decision Drivers

- [Driver 1: e.g., Performance requirements]
- [Driver 2: e.g., Team expertise and learning curve]
- [Driver 3: e.g., Maintainability and scalability]
- [Driver 4: e.g., Cost and licensing]
- [Driver 5: e.g., Community support and ecosystem]

---

## Considered Options

### Option 1: [Technology/Pattern A]
**Pros**:
- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons**:
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Cost**: [Development, licensing, infrastructure]

### Option 2: [Technology/Pattern B]
**Pros**:
- ✅ [Advantage 1]
- ✅ [Advantage 2]

**Cons**:
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]
- ❌ [Disadvantage 3]

**Cost**: [Development, licensing, infrastructure]

### Option 3: [Technology/Pattern C]
**Pros**:
- ✅ [Advantage 1]

**Cons**:
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Cost**: [Development, licensing, infrastructure]

---

## Decision Outcome

**Chosen Option**: [Option X: Technology/Pattern Name]

**Rationale**:
[Explain why this option was chosen. Include:
- How it addresses the decision drivers
- Why it's better than the alternatives
- What trade-offs we're accepting]

**Expected Consequences**:

**Positive**:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Negative**:
- [Trade-off 1]
- [Trade-off 2]

**Neutral**:
- [Consideration 1]

---

## Validation

**Proof of Concept**:
- [x] Small prototype built and tested
- [ ] Performance benchmarks met
- [ ] Team training completed

**Success Metrics**:
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]

**Review Date**: [Date to revisit this decision]

---

## Implementation Plan

### Phase 1: Preparation
- [ ] Team training and knowledge sharing
- [ ] Development environment setup
- [ ] Documentation and guidelines

### Phase 2: Pilot
- [ ] Implement in one module/feature
- [ ] Gather feedback
- [ ] Refine patterns

### Phase 3: Rollout
- [ ] Migrate existing code
- [ ] Update CI/CD pipelines
- [ ] Monitor and optimize

**Timeline**: [X weeks/months]  
**Owner**: [Team/Person responsible]

---

## Compliance & Security

**Security Considerations**:
- [Security implication 1]
- [Mitigation strategy 1]

**Compliance**:
- [ ] GDPR requirements met
- [ ] SOC 2 controls satisfied
- [ ] Industry-specific regulations addressed

---

## Links & References

- [Link to technical spike]
- [Link to benchmark results]
- [Link to vendor documentation]
- [Related ADRs: ADR-XXX, ADR-YYY]
- [External resources and articles]

---

## Notes

[Any additional context, discussions, or historical information]

**Original Discussion**: [Link to meeting notes or Slack thread]`,
    category: "Development",
    tags: ["architecture", "adr", "decision", "documentation"],
    usageCount: 76
  },
  {
    id: "10",
    title: "Incident Postmortem Report",
    description: "Analyze and document incidents to prevent future occurrences",
    content: `# Incident Postmortem Report

## Incident Summary

**Incident ID**: INC-[Number]  
**Date**: [YYYY-MM-DD]  
**Duration**: [Start time] - [End time] ([X hours Y minutes])  
**Severity**: [Critical | High | Medium | Low]  
**Status**: [Resolved | Monitoring | Investigating]

**Impact Summary**:
[One paragraph describing what happened and the business impact]

---

## Impact Metrics

### User Impact
- **Users Affected**: [X users / X% of total users]
- **Requests Failed**: [X,XXX requests]
- **Error Rate**: [X%]
- **Services Down**: [List of affected services]

### Business Impact
- **Revenue Loss**: [$X,XXX]
- **SLA Breach**: [Yes/No - X% below target]
- **Customer Complaints**: [X tickets created]
- **Reputation Impact**: [Social media mentions, press coverage]

### Technical Impact
- **Data Loss**: [Yes/No - details if yes]
- **Corrupted Records**: [X records]
- **Rollback Required**: [Yes/No]

---

## Timeline (All times in UTC)

| Time | Event | Action Taken | Who |
|------|-------|--------------|-----|
| 14:23 | Monitoring alert triggered | Incident declared | On-call engineer |
| 14:25 | Confirmed elevated error rates | Started investigation | Team Lead |
| 14:30 | Root cause identified | Began mitigation | SRE Team |
| 14:45 | Hotfix deployed to staging | Testing in progress | Developer |
| 15:00 | Hotfix deployed to production | Monitoring metrics | DevOps |
| 15:15 | Metrics returning to normal | Continued monitoring | Team |
| 15:45 | Incident declared resolved | Post-incident tasks assigned | Incident Commander |

---

## Root Cause Analysis

### What Happened?
[Detailed technical explanation of what went wrong]

**Example**: "A database migration script executed during deployment modified the index on the users table. This caused a full table scan for login queries, overwhelming the database with 10x normal load. The connection pool exhausted, and new login requests timed out."

### Why Did It Happen?

**Root Cause**: [Primary technical cause]

**Contributing Factors**:
1. [Factor 1: e.g., Insufficient testing of migration scripts]
2. [Factor 2: e.g., No query performance monitoring on staging]
3. [Factor 3: e.g., Missing circuit breaker on auth service]
4. [Factor 4: e.g., Deployment during peak traffic hours]

### 5 Whys Analysis
1. **Why did users see login failures?**  
   → The auth service timed out connecting to the database.

2. **Why did the auth service timeout?**  
   → The database connection pool was exhausted.

3. **Why was the connection pool exhausted?**  
   → Login queries took 50x longer than normal.

4. **Why did queries take longer?**  
   → The migration removed a critical index on the users table.

5. **Why was the index removed?**  
   → The migration script had a bug, and it wasn't caught in testing.

---

## What Went Well?

- ✅ [Monitoring detected the issue within 2 minutes]
- ✅ [Team mobilized quickly with clear communication]
- ✅ [Rollback procedure worked as expected]
- ✅ [Customer communication was timely and transparent]

---

## What Went Wrong?

- ❌ [Migration wasn't tested on production-sized dataset]
- ❌ [No automated query performance tests]
- ❌ [Deployment happened during peak hours]
- ❌ [Circuit breaker wasn't configured]

---

## Action Items

### Prevent
**Goal**: Prevent this specific issue from happening again

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add query performance tests to CI/CD | @engineer1 | 2024-03-20 | In Progress |
| Implement migration review checklist | @dba | 2024-03-15 | Done |
| Add index removal safeguards | @engineer2 | 2024-03-25 | Not Started |

### Detect
**Goal**: Detect similar issues faster

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add database query performance alerts | @sre1 | 2024-03-18 | In Progress |
| Implement connection pool monitoring | @sre2 | 2024-03-22 | Not Started |
| Set up slow query log analysis | @dba | 2024-03-17 | Done |

### Mitigate
**Goal**: Reduce impact when similar issues occur

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Configure circuit breakers on auth service | @engineer3 | 2024-03-20 | In Progress |
| Implement graceful degradation | @architect | 2024-04-01 | Not Started |
| Create runbook for DB performance issues | @sre1 | 2024-03-16 | Done |

### Process Improvements
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Restrict deployments to off-peak hours | @devops | 2024-03-15 | Done |
| Add mandatory staging performance tests | @qa-lead | 2024-03-25 | Not Started |
| Schedule incident response training | @manager | 2024-04-15 | Not Started |

---

## Lessons Learned

### Technical Lessons
1. [Lesson 1: Always test migrations on production-sized datasets]
2. [Lesson 2: Query performance should be monitored as closely as uptime]
3. [Lesson 3: Circuit breakers are critical for service resilience]

### Process Lessons
1. [Lesson 1: Migration review process needs strengthening]
2. [Lesson 2: Deployment timing policy should be enforced]
3. [Lesson 3: Runbooks should be regularly tested]

---

## Communication

### Internal Communication
- **Incident Channel**: [#incident-response Slack channel]
- **Status Page**: [Updated every 15 minutes]
- **Stakeholder Briefing**: [Sent at 15:00, 16:00, 17:00]

### Customer Communication
- **Status Page**: [Updated at 14:30, 15:00, 15:45]
- **Email**: [Sent to affected customers at 16:30]
- **Support**: [X tickets received and resolved]

### Post-Incident Communication
- [ ] Incident report shared with leadership
- [ ] Customer email with explanation and apology
- [ ] Blog post published (if public incident)
- [ ] Team retrospective completed

---

## Follow-Up

**Review Date**: [YYYY-MM-DD - One month after incident]  
**Review Participants**: [Engineering, SRE, Product, Support]

**Review Questions**:
- [ ] Have all action items been completed?
- [ ] Have we seen similar incidents?
- [ ] Do we need additional actions?
- [ ] What should we keep doing?

---

## Appendix

### Related Incidents
- [INC-123: Similar database issue in Jan 2024]
- [INC-098: Auth service timeout in Dec 2023]

### Technical Details
\`\`\`
[Relevant logs, error messages, query plans, etc.]
\`\`\`

### Metrics & Graphs
[Screenshots of monitoring dashboards, error rate graphs]`,
    category: "DevOps",
    tags: ["incident", "postmortem", "sre", "reliability"],
    usageCount: 67
  }
];

export default function HubPrompts() {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Prompt>>({
    title: "",
    description: "",
    content: "",
    category: "General",
    tags: []
  });

  const [generateFormData, setGenerateFormData] = useState({
    description: "",
    category: "General",
    context: ""
  });

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Prompt content has been copied."
    });
  };

  const handleSave = () => {
    toast({
      title: "Prompt Saved",
      description: `${formData.title} has been saved successfully.`
    });
    setDialogOpen(false);
  };

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/hub/prompts/generate", generateFormData);
      const result = await response.json();
      
      setFormData({
        title: result.title || "",
        description: result.description || "",
        content: result.content || "",
        category: generateFormData.category,
        tags: result.tags || []
      });
      
      toast({
        title: "Prompt Generated",
        description: "AI has generated a prompt based on your description."
      });
      
      setGenerateDialogOpen(false);
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompt",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const categories = Array.from(new Set(samplePrompts.map(p => p.category)));

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Prompt Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Reusable prompts and templates for your workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setGenerateDialogOpen(true)}
            data-testid="button-generate-prompt"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-new-prompt">
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>
      </div>

      {selectedPrompt ? (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPrompt(null)}
            data-testid="button-back"
          >
            ← Back to Prompts
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedPrompt.category}</Badge>
                    <Badge variant="outline" className="text-xs">
                      Used {selectedPrompt.usageCount} times
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{selectedPrompt.title}</CardTitle>
                  <CardDescription className="text-base">
                    {selectedPrompt.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedPrompt.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedPrompt)}
                  data-testid="button-copy"
                >
                  {copiedId === selectedPrompt.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-md bg-muted font-mono text-sm whitespace-pre-wrap">
                {selectedPrompt.content}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryPrompts = samplePrompts.filter(p => p.category === category);

            return (
              <div key={category} className="space-y-3">
                <h2 className="text-xl font-semibold">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPrompts.map(prompt => (
                    <Card
                      key={prompt.id}
                      className="hover-elevate cursor-pointer"
                      data-testid={`card-prompt-${prompt.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{prompt.title}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">
                              {prompt.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {prompt.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {prompt.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{prompt.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-muted-foreground">
                            {prompt.usageCount} uses
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(prompt);
                              }}
                              data-testid={`button-copy-${prompt.id}`}
                            >
                              {copiedId === prompt.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => setSelectedPrompt(prompt)}
                              data-testid={`button-view-${prompt.id}`}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Prompt with AI</DialogTitle>
            <DialogDescription>
              Describe what you need and let AI create a prompt for you
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gen-description">What do you need the prompt for?</Label>
              <Textarea
                id="gen-description"
                value={generateFormData.description}
                onChange={(e) => setGenerateFormData({ ...generateFormData, description: e.target.value })}
                placeholder="e.g., Create a template for bug reports with severity levels..."
                rows={4}
                data-testid="input-generate-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-category">Category</Label>
              <Input
                id="gen-category"
                value={generateFormData.category}
                onChange={(e) => setGenerateFormData({ ...generateFormData, category: e.target.value })}
                placeholder="e.g., Testing, Documentation"
                data-testid="input-generate-category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-context">Additional Context (Optional)</Label>
              <Textarea
                id="gen-context"
                value={generateFormData.context}
                onChange={(e) => setGenerateFormData({ ...generateFormData, context: e.target.value })}
                placeholder="Any specific requirements or examples..."
                rows={3}
                data-testid="input-generate-context"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
                disabled={isGenerating}
                data-testid="button-cancel-generate"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePrompt}
                disabled={isGenerating || !generateFormData.description}
                data-testid="button-confirm-generate"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>
              Add a reusable prompt to your library
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[600px] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., User Story Template"
                  data-testid="input-prompt-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this prompt does"
                  rows={2}
                  data-testid="input-prompt-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Prompt Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your prompt template here..."
                  rows={10}
                  className="font-mono"
                  data-testid="input-prompt-content"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Requirements, Development"
                  data-testid="input-prompt-category"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSave} data-testid="button-save-prompt">
                  Save Prompt
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
