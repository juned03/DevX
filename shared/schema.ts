import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, longtext, int, timestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Organizations
export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: varchar("organization_id", { length: 36 }),
  name: text("name").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  type: varchar("type", { length: 50 }).notNull().default("development"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow Types (for in-memory/API usage)
export const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  color: z.string(),
  focus: z.string(),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
});

export const epicSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["High", "Medium", "Low"]),
  featureCount: z.number().optional(),
});

export const featureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  epicId: z.string(),
  priority: z.enum(["High", "Medium", "Low"]),
  storyCount: z.number().optional(),
});

export const acceptanceCriterionSchema = z.object({
  title: z.string().optional(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
  and: z.string().optional(),
});

export const userStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  persona: z.string(),
  personaId: z.string(),
  acceptanceCriteria: z.array(acceptanceCriterionSchema),
  subtasks: z.array(z.string()).optional(),
  priority: z.enum(["High", "Medium", "Low"]),
  storyPoints: z.number(),
  featureId: z.string(),
  epicId: z.string(),
});

export const workflowSessionSchema = z.object({
  id: z.string(),
  requirement: z.string(),
  guidelines: z.string().optional(),
  epics: z.array(epicSchema).optional(),
  features: z.array(featureSchema).optional(),
  userStories: z.array(userStorySchema).optional(),
  personas: z.array(personaSchema).optional(),
  currentStep: z.number().default(1),
  azureConfig: z.object({
    organization: z.string(),
    project: z.string(),
    repository: z.string(),
    branch: z.string(),
    pat: z.string().optional(),
  }).optional(),
});

export type Persona = z.infer<typeof personaSchema>;
export type Epic = z.infer<typeof epicSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type UserStory = z.infer<typeof userStorySchema>;
export type AcceptanceCriterion = z.infer<typeof acceptanceCriterionSchema>;
export type WorkflowSession = z.infer<typeof workflowSessionSchema>;

// Golden Repositories - PostgreSQL array converted to JSON
export const goldenRepositories = mysqlTable("golden_repositories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  technologies: json("technologies").$type<string[]>().notNull(),
  stars: int("stars").notNull().default(0),
  cloudProvider: text("cloud_provider"),
  repositoryUrl: text("repository_url"),
  category: text("category"),
  domain: text("domain").notNull().default("insurance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Azure DevOps Settings
export const adoSettings = mysqlTable("ado_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationUrl: text("organization_url").notNull(),
  projectName: text("project_name").notNull(),
  repository: text("repository"),
  branch: text("branch"),
  patToken: text("pat_token"),
  apiVersion: text("api_version").notNull().default("7.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Artifact Organizations for cross-org PAT management
export const artifactOrganizations = mysqlTable("artifact_organizations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectName: text("project_name").notNull(),
  organizationUrl: text("organization_url").notNull(),
  patToken: text("pat_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Golden Repository Organizations - Multiple org support with encrypted PAT
export const goldenRepoOrganizations = mysqlTable("golden_repo_organizations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  organizationUrl: text("organization_url").notNull(),
  projectName: text("project_name").notNull(),
  repositoryName: text("repository_name"),
  apiVersion: text("api_version").notNull().default("7.0"),
  patToken: text("pat_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversational UI Settings - Dedicated ADO configuration for chat agent
export const conversationalUiSettings = mysqlTable("conversational_ui_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationName: text("organization_name").notNull(),
  projectName: text("project_name").notNull(),
  patToken: text("pat_token"), // Encrypted PAT token
  apiVersion: varchar("api_version", { length: 20 }).notNull().default("7.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow Settings
export const workflowSettings = mysqlTable("workflow_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryName: text("repository_name"),
  projectName: text("project_name"),
  organizationUrl: text("organization_url"),
  patToken: text("pat_token"),
});

// SDLC Settings
export const sdlcSettings = mysqlTable("sdlc_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  phaseUnlockThreshold: text("phase_unlock_threshold").default("80"),
  enableAutoPhaseUnlock: text("enable_auto_phase_unlock").default("true"),
  requirePhaseApprovals: text("require_phase_approvals").default("false"),
  defaultAssignee: text("default_assignee"),
  enableNotifications: text("enable_notifications").default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Personas for Story Generation
export const personas = mysqlTable("personas", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  role: text("role").notNull(),
  color: text("color").notNull(),
  focus: text("focus").notNull(),
  painPoints: json("pain_points").$type<string[]>().notNull(),
  goals: json("goals").$type<string[]>().notNull(),
  isDefault: int("is_default").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPersonaSchema = createInsertSchema(personas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Wiki Documentation Pages
export const wikiPages = mysqlTable("wiki_pages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }),
  sessionId: varchar("session_id", { length: 36 }),
  pageType: text("page_type").notNull(),
  phase: varchar("phase", { length: 50 }).notNull().default("reference"), // SDLC phase: planning, requirements, design, implementation, testing, deployment, agile, reference
  title: text("title").notNull(),
  content: longtext("content").notNull(),
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// SDLC Project Management
export const sdlcProjects = mysqlTable("sdlc_projects", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  organization: text("organization"),
  repositoryId: varchar("repository_id", { length: 36 }),
  repositoryCount: int("repository_count").default(0),
  cloudProvider: text("cloud_provider"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcPhases = mysqlTable("sdlc_phases", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  phaseName: text("phase_name").notNull(),
  status: text("status").notNull().default("not_started"),
  progress: int("progress").notNull().default(0),
  notes: text("notes"),
  assignedTo: text("assigned_to"),
  deliverables: text("deliverables"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const phaseConfirmations = mysqlTable("phase_confirmations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  phaseId: varchar("phase_id", { length: 36 }).notNull(),
  confirmerRole: text("confirmer_role").notNull(),
  status: text("status").notNull().default("pending"),
  confirmerName: text("confirmer_name"),
  comments: text("comments"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const developmentRepositories = mysqlTable("development_repositories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  defaultBranch: text("default_branch").default("main"),
  commits: int("commits").default(0),
  contributors: int("contributors").default(1),
  size: text("size").default("0 MB"),
  license: text("license").default("MIT"),
  lastCommitAt: timestamp("last_commit_at"),
  repositoryUrl: text("repository_url"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const developmentBranches = mysqlTable("development_branches", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryId: varchar("repository_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  isDefault: int("is_default").notNull().default(0),
  isProtected: int("is_protected").notNull().default(0),
  commits: int("commits").default(0),
  lastCommitAt: timestamp("last_commit_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoldenRepositorySchema = createInsertSchema(goldenRepositories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdoSettingsSchema = createInsertSchema(adoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtifactOrganizationSchema = createInsertSchema(artifactOrganizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoldenRepoOrganizationSchema = createInsertSchema(goldenRepoOrganizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationalUiSettingsSchema = createInsertSchema(conversationalUiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSettingsSchema = createInsertSchema(workflowSettings).omit({
  id: true,
});

export const insertSdlcSettingsSchema = createInsertSchema(sdlcSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWikiPageSchema = createInsertSchema(wikiPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCProjectSchema = createInsertSchema(sdlcProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCPhaseSchema = createInsertSchema(sdlcPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhaseConfirmationSchema = createInsertSchema(phaseConfirmations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDevelopmentRepositorySchema = createInsertSchema(developmentRepositories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDevelopmentBranchSchema = createInsertSchema(developmentBranches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SDLC Work Items
export const sdlcIssues = mysqlTable("sdlc_issues", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcEpics = mysqlTable("sdlc_epics", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  featureCount: int("feature_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcRequirements = mysqlTable("sdlc_requirements", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("functional"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcBacklogItems = mysqlTable("sdlc_backlog_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("story"),
  storyPoints: int("story_points"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("backlog"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcDocuments = mysqlTable("sdlc_documents", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  title: text("title").notNull(),
  content: longtext("content"),
  type: text("type").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcDesignAssets = mysqlTable("sdlc_design_assets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: longtext("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: int("file_size"),
  thumbnailUrl: longtext("thumbnail_url"),
  uploadedBy: text("uploaded_by"),
  source: text("source").default("manual"),
  sourceDocumentId: varchar("source_document_id", { length: 36 }),
  designCategory: text("design_category"), // system-architecture, database-design, component-design, data-flow-design, interface-design, security-design
  adoWorkItemId: int("ado_work_item_id"), // Azure DevOps work item ID
  adoSyncedAt: timestamp("ado_synced_at"), // Last sync timestamp from ADO
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ADO Design Phase Sync Tracking
export const adoDesignSync = mysqlTable("ado_design_sync", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull().default(2), // Design Phase
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").notNull().default("pending"), // pending, syncing, completed, failed
  syncedItemsCount: int("synced_items_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcFigmaLinks = mysqlTable("sdlc_figma_links", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  figmaUrl: text("figma_url").notNull(),
  accessLevel: text("access_level").notNull().default("view"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcDesignReviews = mysqlTable("sdlc_design_reviews", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar("project_id", { length: 36 }).notNull(),
  phaseNumber: int("phase_number").notNull(),
  designAssetId: varchar("design_asset_id", { length: 36 }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  comments: text("comments"),
  reviewDate: timestamp("review_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Development Phase - Code, Commits, and Preview Management
export const sdlcCode = mysqlTable("sdlc_code", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryId: varchar("repository_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull(),
  content: longtext("content").notNull(),
  language: text("language").notNull().default("typescript"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  generatedFrom: text("generated_from"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sdlcCommits = mysqlTable("sdlc_commits", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryId: varchar("repository_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull(),
  message: text("message").notNull(),
  commitNumber: int("commit_number").notNull().default(1),
  author: text("author").notNull().default("System"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sdlcPreviews = mysqlTable("sdlc_previews", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryId: varchar("repository_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull(),
  status: text("status").notNull().default("active"),
  previewUrl: text("preview_url"),
  codeStatus: text("code_status").notNull().default("generated"),
  commitCount: int("commit_count").notNull().default(1),
  lastCommitMessage: text("last_commit_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSDLCIssueSchema = createInsertSchema(sdlcIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCEpicSchema = createInsertSchema(sdlcEpics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCRequirementSchema = createInsertSchema(sdlcRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCBacklogItemSchema = createInsertSchema(sdlcBacklogItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCDocumentSchema = createInsertSchema(sdlcDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCDesignAssetSchema = createInsertSchema(sdlcDesignAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCFigmaLinkSchema = createInsertSchema(sdlcFigmaLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCDesignReviewSchema = createInsertSchema(sdlcDesignReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdoDesignSyncSchema = createInsertSchema(adoDesignSync).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCCodeSchema = createInsertSchema(sdlcCode).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSDLCCommitSchema = createInsertSchema(sdlcCommits).omit({
  id: true,
  createdAt: true,
});

export const insertSDLCPreviewSchema = createInsertSchema(sdlcPreviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateDesignAssetSchema = insertSDLCDesignAssetSchema.extend({
  name: z.string().min(1, "File name is required"),
  fileType: z.string().refine(
    (type) => ALLOWED_MIME_TYPES.includes(type),
    { message: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` }
  ),
  fileUrl: z.string()
    .min(1, "File data is required")
    .refine(
      (data) => {
        const base64Match = data.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) return false;
        const base64Data = base64Match[1];
        const sizeInBytes = (base64Data.length * 3) / 4;
        return sizeInBytes <= MAX_FILE_SIZE_BYTES;
      },
      { message: `File size must not exceed ${MAX_FILE_SIZE_MB}MB` }
    ),
});

export const validateFigmaLinkSchema = insertSDLCFigmaLinkSchema.extend({
  title: z.string().min(1, "Title is required"),
  figmaUrl: z.string()
    .min(1, "Figma URL is required")
    .url("Must be a valid URL")
    .refine(
      (url) => url.includes('figma.com'),
      { message: "Must be a valid Figma URL" }
    ),
});

const VALID_REVIEW_STATUSES = ['pending', 'approved', 'changes-requested'];
export const validateDesignReviewSchema = insertSDLCDesignReviewSchema.extend({
  title: z.string().min(1, "Title is required"),
  status: z.enum(['pending', 'approved', 'changes-requested'] as const),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertGoldenRepository = z.infer<typeof insertGoldenRepositorySchema>;
export type GoldenRepository = typeof goldenRepositories.$inferSelect;
export type InsertAdoSettings = z.infer<typeof insertAdoSettingsSchema>;
export type AdoSettings = typeof adoSettings.$inferSelect;
export type InsertArtifactOrganization = z.infer<typeof insertArtifactOrganizationSchema>;
export type ArtifactOrganization = typeof artifactOrganizations.$inferSelect;
export type InsertGoldenRepoOrganization = z.infer<typeof insertGoldenRepoOrganizationSchema>;
export type GoldenRepoOrganization = typeof goldenRepoOrganizations.$inferSelect;
export type InsertConversationalUiSettings = z.infer<typeof insertConversationalUiSettingsSchema>;
export type ConversationalUiSettings = typeof conversationalUiSettings.$inferSelect;
export type InsertWorkflowSettings = z.infer<typeof insertWorkflowSettingsSchema>;
export type WorkflowSettings = typeof workflowSettings.$inferSelect;
export type InsertSdlcSettings = z.infer<typeof insertSdlcSettingsSchema>;
export type SdlcSettings = typeof sdlcSettings.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type PersonaDB = typeof personas.$inferSelect;
export type InsertWikiPage = z.infer<typeof insertWikiPageSchema>;
export type WikiPage = typeof wikiPages.$inferSelect;
export type InsertSDLCProject = z.infer<typeof insertSDLCProjectSchema>;
export type SDLCProject = typeof sdlcProjects.$inferSelect;
export type InsertSDLCPhase = z.infer<typeof insertSDLCPhaseSchema>;
export type SDLCPhase = typeof sdlcPhases.$inferSelect;
export type InsertPhaseConfirmation = z.infer<typeof insertPhaseConfirmationSchema>;
export type PhaseConfirmation = typeof phaseConfirmations.$inferSelect;
export type InsertSDLCIssue = z.infer<typeof insertSDLCIssueSchema>;
export type SDLCIssue = typeof sdlcIssues.$inferSelect;
export type InsertSDLCEpic = z.infer<typeof insertSDLCEpicSchema>;
export type SDLCEpic = typeof sdlcEpics.$inferSelect;
export type InsertSDLCRequirement = z.infer<typeof insertSDLCRequirementSchema>;
export type SDLCRequirement = typeof sdlcRequirements.$inferSelect;
export type InsertSDLCBacklogItem = z.infer<typeof insertSDLCBacklogItemSchema>;
export type SDLCBacklogItem = typeof sdlcBacklogItems.$inferSelect;
export type InsertSDLCDocument = z.infer<typeof insertSDLCDocumentSchema>;
export type SDLCDocument = typeof sdlcDocuments.$inferSelect;
export type InsertSDLCDesignAsset = z.infer<typeof insertSDLCDesignAssetSchema>;
export type SDLCDesignAsset = typeof sdlcDesignAssets.$inferSelect;
export type InsertSDLCFigmaLink = z.infer<typeof insertSDLCFigmaLinkSchema>;
export type SDLCFigmaLink = typeof sdlcFigmaLinks.$inferSelect;
export type InsertSDLCDesignReview = z.infer<typeof insertSDLCDesignReviewSchema>;
export type SDLCDesignReview = typeof sdlcDesignReviews.$inferSelect;
export type InsertAdoDesignSync = z.infer<typeof insertAdoDesignSyncSchema>;
export type AdoDesignSync = typeof adoDesignSync.$inferSelect;
export type InsertSDLCCode = z.infer<typeof insertSDLCCodeSchema>;
export type SDLCCode = typeof sdlcCode.$inferSelect;
export type InsertSDLCCommit = z.infer<typeof insertSDLCCommitSchema>;
export type SDLCCommit = typeof sdlcCommits.$inferSelect;
export type InsertSDLCPreview = z.infer<typeof insertSDLCPreviewSchema>;
export type SDLCPreview = typeof sdlcPreviews.$inferSelect;

// Conversational Workflow Types
export const conversationPhaseSchema = z.enum([
  "understanding",
  "refining",
  "personas",
  "artifacts",
  "complete",
]);

export const conversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.date(),
  quickReplies: z.array(z.string()).optional(),
});

export const capturedRequirementsSchema = z.object({
  businessGoals: z.array(z.string()).default([]),
  targetUsers: z.array(z.string()).default([]),
  keyFeatures: z.array(z.string()).default([]),
  technicalConstraints: z.array(z.string()).default([]),
  functionalRequirements: z.array(z.string()).default([]),
  nonFunctionalRequirements: z.array(z.string()).default([]),
  edgeCases: z.array(z.string()).default([]),
  priorityItems: z.array(z.string()).default([]),
  excludedTopics: z.array(z.string()).default([]),
  impliedNeeds: z.array(z.string()).default([]),
});

export const exportFormatSchema = z.enum(["azure-devops", "jira", "none"]);

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedHours: z.number(),
});

export const testCaseSchema = z.object({
  id: z.string(),
  scenario: z.string(),
  steps: z.array(z.string()),
  expectedResult: z.string(),
});

export const enhancedUserStorySchema = userStorySchema.extend({
  subtasks: z.array(subtaskSchema).default([]),
  testCases: z.array(testCaseSchema).default([]),
});

export type ConversationPhase = z.infer<typeof conversationPhaseSchema>;
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type CapturedRequirements = z.infer<typeof capturedRequirementsSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type EnhancedUserStory = z.infer<typeof enhancedUserStorySchema>;
