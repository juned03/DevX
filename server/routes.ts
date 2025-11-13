import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateDesignGuidelines, generateAgileArtifacts, generateCodeFromUserStories } from "./ai-service";
import { generateWorkflowConversationQuestion } from "./workflow-ai-service";
import { generateCodeFromUserStory } from "./code-generation-service";
import { AzureDevOpsService } from "./azure-devops-service";
import { sdlcService } from "./sdlc/service";
import { goldenRepoService } from "./golden-repos/service";
import { z } from "zod";
import type { Epic, Feature, UserStory, Persona } from "@shared/schema";
import { isEncryptionAvailable, decryptPAT } from "./crypto-utils";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { promisify } from "util";
import { exec as cpExec } from "child_process";
const exec = promisify(cpExec);

// Hardcoded source PAT variable (set this via env HARDCODED_PAT or inline if required)
const HARDCODED_PAT = "FvEA7fSE7YykQKfNEXb4yFEAE8sAFpK8T1j2CXNTdkyuxdDZUA56JQQJ99BJACAAAAAao531AAASAZDO4PZm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to find which golden repo organization owns a repository
  async function findRepositoryOrganization(repositoryId: string) {
    const goldenRepoOrgs = await storage.getGoldenRepoOrganizations();
    if (!goldenRepoOrgs || goldenRepoOrgs.length === 0) {
      return null;
    }

    // Hardcoded PAT token for golden repo navigation
    const HARDCODED_PAT = "FvEA7fSE7YykQKfNEXb4yFEAE8sAFpK8T1j2CXNTdkyuxdDZUA56JQQJ99BJACAAAAAao531AAASAZDO4PZm";

    // Try to find the repository in each organization
    for (const org of goldenRepoOrgs) {
      try {
        // Use hardcoded PAT token instead of decrypting from database
        const decryptedPat = HARDCODED_PAT;
        if (!decryptedPat) {
          continue;
        }

        const authHeader = `Basic ${Buffer.from(`:${decryptedPat}`).toString("base64")}`;
        const repoUrl = `${org.organizationUrl}/_apis/git/repositories/${repositoryId}?api-version=${org.apiVersion}`;

        const repoResponse = await fetch(repoUrl, {
          headers: { "Authorization": authHeader },
        });

        if (repoResponse.ok) {
          const repoData = await repoResponse.json();
          // Check if this repository belongs to this org's project
          if (repoData.project?.name === org.projectName) {
            return {
              organization: org,
              repository: repoData,
              authHeader,
              decryptedPat,
            };
          }
        }
      } catch (error) {
        // Continue to next organization
        continue;
      }
    }

    return null;
  }

  // Workflow API Routes

  // Generate Design Guidelines using AI
  app.post("/api/workflow/generate-guidelines", async (req, res) => {
    try {
      const { input, capturedRequirements } = req.body;
      
      if (!input || typeof input !== "string") {
        return res.status(400).json({ error: "Input requirement text is required" });
      }

      console.log("[Routes] Generating design guidelines with captured requirements:", !!capturedRequirements);
      console.log("[Routes] Input length:", input.length);
      
      const guidelines = await generateDesignGuidelines(input, capturedRequirements);
      
      console.log("[Routes] Guidelines generated successfully, length:", guidelines.length);
      res.json({ guidelines });
    } catch (error) {
      console.error("[Routes] Error generating guidelines:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate guidelines";
      res.status(500).json({ 
        error: "Failed to generate guidelines",
        details: errorMessage 
      });
    }
  });

  // Generate Agile Artifacts using AI (Epics, Features, User Stories)
  app.post("/api/workflow/generate-artifacts", async (req, res) => {
    try {
      const { requirement, complianceGuidelines, backlogContext, selectedPersonaIds } = req.body;

      if (!requirement || typeof requirement !== "string") {
        return res.status(400).json({ error: "Requirement text is required" });
      }

      const artifacts = await generateAgileArtifacts(
        requirement,
        complianceGuidelines || [],
        backlogContext,
        selectedPersonaIds || []
      );

      res.json(artifacts);
    } catch (error) {
      console.error("Error generating artifacts:", error);
      res.status(500).json({ error: "Failed to generate agile artifacts" });
    }
  });

  // Conversational Requirements Gathering
  app.post("/api/workflow/conversation", async (req, res) => {
    try {
      const { conversationHistory, capturedRequirements, currentPhase, askedQuestions, complianceGuidelines } = req.body;

      if (!Array.isArray(conversationHistory)) {
        return res.status(400).json({ error: "Conversation history is required" });
      }

      if (!capturedRequirements) {
        return res.status(400).json({ error: "Captured requirements object is required" });
      }

      if (!currentPhase) {
        return res.status(400).json({ error: "Current conversation phase is required" });
      }

      // Generate next conversation question using dedicated workflow AI service
      const result = await generateWorkflowConversationQuestion(
        conversationHistory,
        capturedRequirements,
        currentPhase,
        askedQuestions || [],
        complianceGuidelines || []
      );

      // Check if AI determined we have enough information to generate artifacts
      if (result.readyToGenerate) {
        console.log("[Conversation] AI determined sufficient information gathered, signaling readiness");
      }

      res.json(result);
    } catch (error) {
      console.error("[Conversation API] Error generating conversation question:", error);
      console.error("[Conversation API] Request details:", {
        historyLength: req.body.conversationHistory?.length,
        phase: req.body.currentPhase,
        questionsAsked: req.body.askedQuestions?.length
      });

      // Provide graceful fallback response instead of failing completely
      const lastUserMessage = req.body.conversationHistory?.[req.body.conversationHistory.length - 1]?.content || "";

      res.json({
        question: `I apologize, but I encountered a temporary issue. Let me ask you this: Could you tell me more about the key features or functionality you'd like to include in your solution? This will help me understand your requirements better.`,
        phase: req.body.currentPhase || "understanding",
        quickReplies: ["Let me describe the features", "Start over", "Need help"],
        capturedInfo: undefined,
        readyToGenerate: false,
        _errorRecovery: true
      });
    }
  });

  // Push to Azure DevOps (Real API integration)
  app.post("/api/workflow/push-devops", async (req, res) => {
    try {
      const { config, selectedItems, epics, features, userStories, personas, wikiPages } = req.body;

      if (!config || !selectedItems || !epics || !features || !userStories || !personas) {
        return res.status(400).json({ error: "Configuration, selected items, and artifacts are required" });
      }

      // Validate Azure DevOps config
      const configSchema = z.object({
        organization: z.string(),
        project: z.string(),
        repository: z.string(),
        branch: z.string(),
        pat: z.string(),
      });

      const validatedConfig = configSchema.parse(config);

      if (!validatedConfig.pat) {
        return res.status(400).json({ error: "Personal Access Token is required" });
      }

      // Create Azure DevOps service and push work items
      const azureService = new AzureDevOpsService(validatedConfig);

      // Push work items (epics, features, user stories)
      const workItemResult = await azureService.pushWorkItems(
        selectedItems,
        epics as Epic[],
        features as Feature[],
        userStories as UserStory[],
        personas as Persona[]
      );

      // Push wiki pages if any are selected
      let wikiResult: { pagesCreated: number; wikiUrl?: string; errors?: string[] } | null = null;
      const selectedWikiIds = selectedItems
        .filter((item: { type: string; id: string }) => item.type === 'wiki')
        .map((item: { type: string; id: string }) => item.id);

      if (selectedWikiIds.length > 0 && wikiPages && Array.isArray(wikiPages)) {
        const selectedWikiPages = wikiPages.filter((page: any) => selectedWikiIds.includes(page.id));
        if (selectedWikiPages.length > 0) {
          try {
            wikiResult = await azureService.pushWikiPages(selectedWikiPages);
          } catch (error) {
            // If wiki push fails completely, return error
            throw new Error(`Wiki push failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      const totalItems = workItemResult.workItemIds.length + (wikiResult?.pagesCreated || 0);

      // Only report success if at least one item was created
      if (totalItems === 0) {
        return res.status(400).json({
          success: false,
          error: "No items were successfully created in Azure DevOps",
          details: wikiResult?.errors || []
        });
      }

      const messages = [];
      if (workItemResult.workItemIds.length > 0) {
        messages.push(`${workItemResult.workItemIds.length} work items`);
      }
      if (wikiResult && wikiResult.pagesCreated > 0) {
        messages.push(`${wikiResult.pagesCreated} wiki pages`);
      }

      // Include partial failure warnings
      const warnings = [];
      if (wikiResult?.errors && wikiResult.errors.length > 0) {
        warnings.push(`Some wiki pages failed to create: ${wikiResult.errors.join('; ')}`);
      }

      res.json({
        success: true,
        message: `Successfully created ${messages.join(' and ')} in Azure DevOps`,
        workItemIds: workItemResult.workItemIds,
        wikiPagesCreated: wikiResult?.pagesCreated || 0,
        url: workItemResult.url,
        wikiUrl: wikiResult?.wikiUrl,
        wikiPageUrls: wikiResult?.pageUrls || [],
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (error) {
      console.error("Error pushing to DevOps:", error);
      res.status(500).json({
        error: "Failed to push to Azure DevOps",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get Azure DevOps Backlog Context (Epics, Features, User Stories)
  app.post("/api/workflow/get-backlog-context", async (req, res) => {
    try {
      const { config } = req.body;

      if (!config) {
        return res.status(400).json({ error: "Configuration is required" });
      }

      // Validate Azure DevOps config
      const configSchema = z.object({
        organization: z.string(),
        project: z.string(),
        repository: z.string(),
        branch: z.string(),
        pat: z.string(),
      });

      const validatedConfig = configSchema.parse(config);

      if (!validatedConfig.pat) {
        return res.status(400).json({ error: "Personal Access Token is required" });
      }

      // Create Azure DevOps service and fetch backlog
      const azureService = new AzureDevOpsService(validatedConfig);
      const backlogContext = await azureService.getBacklogContext();

      res.json(backlogContext);
    } catch (error) {
      console.error("Error fetching backlog context:", error);
      res.status(500).json({
        error: "Failed to fetch backlog context from Azure DevOps",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI Enhancement API Routes

  // Enhance description using AI
  app.post("/api/ai/enhance-description", async (req, res) => {
    try {
      const { title, description, itemType } = req.body;

      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }

      // Generate enhanced description using OpenAI
      const { default: OpenAI } = await import("openai");

      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ error: "OpenAI API key is not configured" });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const systemPrompt = `You are a technical writing assistant helping improve descriptions for software development work items. 
Your task is to enhance descriptions to be clear, professional, and comprehensive while maintaining the original intent.
Focus on clarity, completeness, and technical accuracy.`;

      const userPrompt = `Improve the following ${itemType || 'work item'} description:

Title: ${title}
Current Description: ${description || 'No description provided'}

Please provide an enhanced, professional description that:
1. Is clear and concise
2. Follows best practices for ${itemType || 'work item'} documentation
3. Includes key details and context
4. Is well-structured and easy to read

Enhanced Description:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const enhancedDescription = completion.choices[0]?.message?.content?.trim() || description;

      res.json({ enhancedDescription });
    } catch (error) {
      console.error("Error enhancing description:", error);
      res.status(500).json({
        error: "Failed to enhance description",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // SDLC Management API Routes

  // Get or create default SDLC project with phases
  app.get("/api/sdlc/default-project", async (req, res) => {
    try {
      const data = await sdlcService.getOrCreateDefaultProject();

      // Check readiness and category completion status for each phase
      const phasesWithReadiness = await Promise.all(
        data.phases.map(async (phase) => {
          const readinessCheck = await sdlcService.checkPhaseReadyForProgression(phase.id);
          const categoryStatus = await sdlcService.getCategoryCompletionStatus(
            data.project.id,
            phase.phaseNumber
          );
          return {
            ...phase,
            readyForProgression: readinessCheck.ready,
            categoryCompletion: categoryStatus,
          };
        })
      );

      // Fetch repository information if linked
      let repository = null;
      if (data.project.repositoryId) {
        repository = await goldenRepoService.getRepositoryById(data.project.repositoryId);
      }

      res.json({ project: data.project, phases: phasesWithReadiness, repository });
    } catch (error) {
      console.error("Error fetching default project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Get all projects
  app.get("/api/sdlc/projects", async (req, res) => {
    try {
      const projects = await sdlcService.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get specific project with phases and repository
  app.get("/api/sdlc/projects/:projectId/details", async (req, res) => {
    try {
      const project = await sdlcService.getProject(req.params.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const phases = await sdlcService.getPhasesByProject(req.params.projectId);

      // Check readiness and category completion status for each phase
      const phasesWithReadiness = await Promise.all(
        phases.map(async (phase) => {
          const readinessCheck = await sdlcService.checkPhaseReadyForProgression(phase.id);
          const categoryStatus = await sdlcService.getCategoryCompletionStatus(
            req.params.projectId,
            phase.phaseNumber
          );
          return {
            ...phase,
            readyForProgression: readinessCheck.ready,
            categoryCompletion: categoryStatus,
          };
        })
      );

      // Fetch repository information if linked
      let repository = null;
      if (project.repositoryId) {
        repository = await goldenRepoService.getRepositoryById(project.repositoryId);
      }

      res.json({ project, phases: phasesWithReadiness, repository });
    } catch (error) {
      console.error("Error fetching project details:", error);
      res.status(500).json({ error: "Failed to fetch project details" });
    }
  });

  // Create new project
  app.post("/api/sdlc/projects", async (req, res) => {
    try {
      const project = await sdlcService.createProject(req.body);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Seed mock projects
  app.post("/api/sdlc/projects/seed", async (req, res) => {
    try {
      const projects = await sdlcService.seedMockProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error seeding projects:", error);
      res.status(500).json({ error: "Failed to seed projects" });
    }
  });

  // Get phases for a project
  app.get("/api/sdlc/projects/:projectId/phases", async (req, res) => {
    try {
      const phases = await sdlcService.getPhasesByProject(req.params.projectId);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ error: "Failed to fetch phases" });
    }
  });

  // Update phase
  app.patch("/api/sdlc/projects/:projectId/phases/:phaseNumber", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const phase = await sdlcService.updatePhase(
        projectId,
        parseInt(phaseNumber),
        req.body
      );
      res.json(phase);
    } catch (error) {
      console.error("Error updating phase:", error);
      res.status(500).json({ error: "Failed to update phase" });
    }
  });

  // Work Items API Routes

  // Issues with Phase Number
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/issues", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const issues = await sdlcService.getIssues(projectId, parseInt(phaseNumber));
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/issues", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const issue = await sdlcService.createIssue({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });
      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating issue:", error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  // Issues (backward compatibility)
  app.get("/api/sdlc/projects/:projectId/issues", async (req, res) => {
    try {
      const issues = await sdlcService.getIssues(req.params.projectId);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/issues", async (req, res) => {
    try {
      const issue = await sdlcService.createIssue({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating issue:", error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  app.patch("/api/sdlc/issues/:id", async (req, res) => {
    try {
      const issue = await sdlcService.updateIssue(req.params.id, req.body);
      res.json(issue);
    } catch (error) {
      console.error("Error updating issue:", error);
      res.status(500).json({ error: "Failed to update issue" });
    }
  });

  app.delete("/api/sdlc/issues/:id", async (req, res) => {
    try {
      await sdlcService.deleteIssue(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting issue:", error);
      res.status(500).json({ error: "Failed to delete issue" });
    }
  });

  // Fetch user stories from ADO for code generation
  app.get("/api/sdlc/projects/:projectId/ado/user-stories", async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await sdlcService.getProject(projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Use client settings (artifact_organizations)
      const artifactOrgs = await storage.getArtifactOrganizations();
      const firstOrg = artifactOrgs[0];

      if (!firstOrg || !firstOrg.patToken) {
        return res.status(400).json({ error: "Azure DevOps not configured. Please configure in Settings > Client Settings." });
      }

      // Decrypt PAT
      const decryptedPAT = decryptPAT(firstOrg.patToken);
      if (!decryptedPAT) {
        return res.status(400).json({ error: "Failed to decrypt Azure DevOps PAT" });
      }

      // Extract organization from URL
      const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');

      // Get user stories from Azure DevOps
      const adoService = new AzureDevOpsService({
        organization,
        project: firstOrg.projectName,
        pat: decryptedPAT
      });
      const userStories = await adoService.getUserStories(organization, firstOrg.projectName);

      res.json(userStories);
    } catch (error) {
      console.error("Error fetching user stories from ADO:", error);
      res.status(500).json({ error: "Failed to fetch user stories from Azure DevOps" });
    }
  });

  // Fetch all backlog items (epics, features, user stories, tasks, bugs) from ADO
  app.get("/api/sdlc/projects/:projectId/ado/backlog-context", async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await sdlcService.getProject(projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Use client settings (artifact_organizations)
      const artifactOrgs = await storage.getArtifactOrganizations();
      const firstOrg = artifactOrgs[0];

      if (!firstOrg || !firstOrg.patToken) {
        return res.status(400).json({ error: "Azure DevOps not configured. Please configure in Settings > Client Settings." });
      }

      // Decrypt PAT
      const decryptedPAT = decryptPAT(firstOrg.patToken);
      if (!decryptedPAT) {
        return res.status(400).json({ error: "Failed to decrypt Azure DevOps PAT" });
      }

      // Extract organization from URL
      const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');

      // Get all backlog items from Azure DevOps
      const adoService = new AzureDevOpsService({
        organization,
        project: firstOrg.projectName,
        pat: decryptedPAT
      });
      const backlogContext = await adoService.getBacklogContext(firstOrg.projectName);

      res.json(backlogContext);
    } catch (error) {
      console.error("Error fetching backlog context from ADO:", error);
      res.status(500).json({ error: "Failed to fetch backlog items from Azure DevOps" });
    }
  });

  // Generate code from user story
  app.post("/api/sdlc/generate-code", async (req, res) => {
    try {
      const {
        projectId,
        repositoryId,
        branchId,
        branchName,
        storyId,
        title,
        description,
        acceptanceCriteria
      } = req.body;

      if (!projectId || !repositoryId || !branchId || !title) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Get repository and branch details
      const [repository, branch] = await Promise.all([
        storage.getDevelopmentRepository(repositoryId),
        storage.getDevelopmentBranch(branchId)
      ]);

      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }

      // Generate code using OpenAI
      console.log(`[Code Generation] Generating code for story: ${title}`);
      const generatedCode = await generateCodeFromUserStory({
        title,
        description,
        acceptanceCriteria,
        storyId
      });

      // Get next commit number for the branch
      const existingCommits = await storage.getCommits(repositoryId);
      const branchCommits = existingCommits.filter((c: any) => c.branchId === branchId);
      const nextCommitNumber = branchCommits.length + 1;

      // Create a safe filename from the title
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
      const fileName = `story-${storyId}-${sanitizedTitle}.ts`;
      const commitMessage = `feat: Implement ${title} (Story #${storyId})`;

      // Store commit in database
      const commit = await storage.createCommit({
        repositoryId,
        branchId,
        message: commitMessage,
        commitNumber: nextCommitNumber,
        author: "AI Code Generator"
      });

      // Update branch commit count
      await storage.updateBranchCommitCount(branchId, nextCommitNumber);

      console.log(`[Code Generation] Code generated and commit created: ${commit.id}`);

      // Optionally push to Azure DevOps if settings are configured
      // Get ADO settings for optional push
      const project = await storage.getProject(projectId);
      const settings = await storage.getADOSettings();

      if (settings && settings.patConfigured && project) {
        try {
          // Decrypt PAT
          const decryptedPAT = decryptPAT(settings.patToken);

          if (decryptedPAT && repository.repositoryUrl) {
            // Extract organization from URL
            const orgUrl = settings.organizationUrl.replace(/\/$/, '');
            const organization = orgUrl.split('/').pop()!;

            // Push commit to Azure DevOps
            const adoService = new AzureDevOpsService({
              organization,
              project: settings.projectName,
              pat: decryptedPAT
            });

            const adoCommit = await adoService.pushCommit({
              repositoryName: repository.name,
              branchName: branch.name,
              fileName,
              fileContent: generatedCode,
              commitMessage,
              authorName: "AI Code Generator"
            });

            console.log(`[Code Generation] Code pushed to Azure DevOps: ${adoCommit.url}`);
          }
        } catch (adoError) {
          console.warn('[Code Generation] Failed to push to Azure DevOps, but continuing:', adoError);
          // Don't fail the request if ADO push fails - the code is still generated
        }
      }

      res.json({
        code: generatedCode,
        commit: {
          id: commit.id,
          message: commitMessage,
          branch: branch.name,
          commitNumber: nextCommitNumber
        }
      });
    } catch (error) {
      console.error("Error generating code:", error);
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  // Development Repositories
  app.get("/api/sdlc/projects/:projectId/repositories", async (req, res) => {
    try {
      const repositories = await storage.getDevelopmentRepositories(req.params.projectId);
      res.json(repositories);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/repositories", async (req, res) => {
    try {
      const repository = await storage.createDevelopmentRepository({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(repository);
    } catch (error) {
      console.error("Error creating repository:", error);
      res.status(500).json({ error: "Failed to create repository" });
    }
  });

  // Development Branches
  app.get("/api/sdlc/repositories/:repositoryId/branches", async (req, res) => {
    try {
      const branches = await storage.getDevelopmentBranches(req.params.repositoryId);
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ error: "Failed to fetch branches" });
    }
  });

  app.post("/api/sdlc/repositories/:repositoryId/branches", async (req, res) => {
    try {
      const branch = await storage.createDevelopmentBranch({
        ...req.body,
        repositoryId: req.params.repositoryId,
      });
      res.status(201).json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ error: "Failed to create branch" });
    }
  });

  // Comprehensive Create Repo with AI Code Generation
  app.post("/api/sdlc/projects/:projectId/create-repo-with-code", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { repoName: customRepoName, selectedUserStoryIds } = req.body;

      // Step 1: Get project details and validate
      const project = await sdlcService.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Step 2: Fetch user stories (optional - repository can be created without them)
      const allUserStories = await sdlcService.getRequirements(projectId, 1);

      // Filter user stories if specific ones were selected
      const userStories = selectedUserStoryIds && selectedUserStoryIds.length > 0 && allUserStories
        ? allUserStories.filter((story: any) => selectedUserStoryIds.includes(story.id))
        : (allUserStories || []);

      // Step 3: Create repository (20% progress)
      const repoName = customRepoName || `${project.name.replace(/\s+/g, '-')}-Repo`;
      const repository = await storage.createDevelopmentRepository({
        projectId,
        name: repoName,
        description: `Repository for ${project.name}`,
        status: "active",
      });

      // Step 4: Create branches (20% progress)
      const mainBranch = await storage.createDevelopmentBranch({
        repositoryId: repository.id,
        name: "main",
        isDefault: 1,
        isProtected: 1,
      });

      const devBranch = await storage.createDevelopmentBranch({
        repositoryId: repository.id,
        name: "dev",
        isDefault: 0,
        isProtected: 0,
      });

      // Only generate code if user stories exist
      let codeRecord = null;
      let commit = null;
      let preview = null;

      if (userStories && userStories.length > 0) {
        // Step 5: Format user stories for AI
        const formattedStories = userStories.map((story: any) => ({
          id: story.id,
          title: story.title,
          description: story.description || "",
          acceptanceCriteria: "",
        }));

        // Step 6: Generate code (30% progress)
        const generatedCode = await generateCodeFromUserStories(
          formattedStories,
          project.name
        );

        // Step 7: Save code to database
        codeRecord = await storage.createCode({
          repositoryId: repository.id,
          branchId: devBranch.id,
          content: generatedCode,
          language: "typescript",
          fileName: "index.ts",
          filePath: "/src/index.ts",
          generatedFrom: `${userStories.length} user stories from Requirement & Analysis phase`,
        });

        // Step 8: Create initial commit (20% progress)
        commit = await storage.createCommit({
          repositoryId: repository.id,
          branchId: devBranch.id,
          message: "Initial setup from user stories",
          commitNumber: 1,
          author: "System",
        });

        // Step 9: Create preview (10% progress)
        preview = await storage.createPreview({
          repositoryId: repository.id,
          branchId: devBranch.id,
          status: "active",
          codeStatus: "generated",
          commitCount: 1,
          lastCommitMessage: "Initial setup from user stories",
        });
      }

      // Return complete result with all created resources
      res.status(201).json({
        repository,
        branches: [mainBranch, devBranch],
        code: codeRecord,
        commit,
        preview,
        progress: {
          repoCreated: true,
          branchesCreated: true,
          codeGenerated: userStories && userStories.length > 0,
          commitLogged: userStories && userStories.length > 0,
          previewReady: userStories && userStories.length > 0,
          total: 100,
        },
      });
    } catch (error) {
      console.error("Error creating repository with code:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create repository with code"
      });
    }
  });

  // Get code for a repository/branch
  app.get("/api/sdlc/repositories/:repositoryId/branches/:branchId/code", async (req, res) => {
    try {
      const { repositoryId, branchId } = req.params;
      const code = await storage.getCode(repositoryId, branchId);
      res.json(code);
    } catch (error) {
      console.error("Error fetching code:", error);
      res.status(500).json({ error: "Failed to fetch code" });
    }
  });

  // Get commits for a repository
  app.get("/api/sdlc/repositories/:repositoryId/commits", async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const { branchId } = req.query;
      const commits = await storage.getCommits(repositoryId, branchId as string | undefined);
      res.json(commits);
    } catch (error) {
      console.error("Error fetching commits:", error);
      res.status(500).json({ error: "Failed to fetch commits" });
    }
  });

  // Get preview for a repository
  app.get("/api/sdlc/repositories/:repositoryId/preview", async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const preview = await storage.getPreview(repositoryId);
      res.json(preview);
    } catch (error) {
      console.error("Error fetching preview:", error);
      res.status(500).json({ error: "Failed to fetch preview" });
    }
  });

  // Epics with Phase Number
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/epics", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const epics = await sdlcService.getEpics(projectId, parseInt(phaseNumber));
      res.json(epics);
    } catch (error) {
      console.error("Error fetching epics:", error);
      res.status(500).json({ error: "Failed to fetch epics" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/epics", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const result = await sdlcService.createEpic({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });
      res.status(201).json({ ...result.epic, _phaseUnlocked: result.unlockInfo });
    } catch (error) {
      console.error("Error creating epic:", error);
      res.status(500).json({ error: "Failed to create epic" });
    }
  });

  // Epics (backward compatibility)
  app.get("/api/sdlc/projects/:projectId/epics", async (req, res) => {
    try {
      const epics = await sdlcService.getEpics(req.params.projectId);
      res.json(epics);
    } catch (error) {
      console.error("Error fetching epics:", error);
      res.status(500).json({ error: "Failed to fetch epics" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/epics", async (req, res) => {
    try {
      const epic = await sdlcService.createEpic({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(epic);
    } catch (error) {
      console.error("Error creating epic:", error);
      res.status(500).json({ error: "Failed to create epic" });
    }
  });

  app.patch("/api/sdlc/epics/:id", async (req, res) => {
    try {
      const epic = await sdlcService.updateEpic(req.params.id, req.body);
      res.json(epic);
    } catch (error) {
      console.error("Error updating epic:", error);
      res.status(500).json({ error: "Failed to update epic" });
    }
  });

  app.delete("/api/sdlc/epics/:id", async (req, res) => {
    try {
      await sdlcService.deleteEpic(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting epic:", error);
      res.status(500).json({ error: "Failed to delete epic" });
    }
  });

  // Requirements with Phase Number
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/requirements", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const requirements = await sdlcService.getRequirements(projectId, parseInt(phaseNumber));
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      res.status(500).json({ error: "Failed to fetch requirements" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/requirements", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const result = await sdlcService.createRequirement({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });
      res.status(201).json({ ...result.requirement, _phaseUnlocked: result.unlockInfo });
    } catch (error) {
      console.error("Error creating requirement:", error);
      res.status(500).json({ error: "Failed to create requirement" });
    }
  });

  // Requirements (backward compatibility)
  app.get("/api/sdlc/projects/:projectId/requirements", async (req, res) => {
    try {
      const requirements = await sdlcService.getRequirements(req.params.projectId);
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      res.status(500).json({ error: "Failed to fetch requirements" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/requirements", async (req, res) => {
    try {
      const requirement = await sdlcService.createRequirement({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(requirement);
    } catch (error) {
      console.error("Error creating requirement:", error);
      res.status(500).json({ error: "Failed to create requirement" });
    }
  });

  app.patch("/api/sdlc/requirements/:id", async (req, res) => {
    try {
      const requirement = await sdlcService.updateRequirement(req.params.id, req.body);
      res.json(requirement);
    } catch (error) {
      console.error("Error updating requirement:", error);
      res.status(500).json({ error: "Failed to update requirement" });
    }
  });

  app.delete("/api/sdlc/requirements/:id", async (req, res) => {
    try {
      await sdlcService.deleteRequirement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting requirement:", error);
      res.status(500).json({ error: "Failed to delete requirement" });
    }
  });

  // Backlog Items with Phase Number
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/backlog", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const items = await sdlcService.getBacklogItems(projectId, parseInt(phaseNumber));
      res.json(items);
    } catch (error) {
      console.error("Error fetching backlog items:", error);
      res.status(500).json({ error: "Failed to fetch backlog items" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/backlog", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const result = await sdlcService.createBacklogItem({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });
      res.status(201).json({ ...result.backlogItem, _phaseUnlocked: result.unlockInfo });
    } catch (error) {
      console.error("Error creating backlog item:", error);
      res.status(500).json({ error: "Failed to create backlog item" });
    }
  });

  // Backlog Items (backward compatibility)
  app.get("/api/sdlc/projects/:projectId/backlog", async (req, res) => {
    try {
      const items = await sdlcService.getBacklogItems(req.params.projectId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching backlog items:", error);
      res.status(500).json({ error: "Failed to fetch backlog items" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/backlog", async (req, res) => {
    try {
      const item = await sdlcService.createBacklogItem({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating backlog item:", error);
      res.status(500).json({ error: "Failed to create backlog item" });
    }
  });

  app.patch("/api/sdlc/backlog/:id", async (req, res) => {
    try {
      const item = await sdlcService.updateBacklogItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating backlog item:", error);
      res.status(500).json({ error: "Failed to update backlog item" });
    }
  });

  app.delete("/api/sdlc/backlog/:id", async (req, res) => {
    try {
      await sdlcService.deleteBacklogItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting backlog item:", error);
      res.status(500).json({ error: "Failed to delete backlog item" });
    }
  });

  // Documents with Phase Number
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/documents", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const documents = await sdlcService.getDocuments(projectId, parseInt(phaseNumber));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/documents", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const result = await sdlcService.createDocument({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });
      res.status(201).json({ ...result.document, _phaseUnlocked: result.unlockInfo });
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Generate comprehensive phase documentation
  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/generate-documentation", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const { projectName, phaseName } = req.body;

      console.log("[API] Generating phase documentation for:", { projectId, phaseNumber, projectName, phaseName });

      if (!projectName || !phaseName) {
        return res.status(400).json({ error: "projectName and phaseName are required" });
      }

      // Fetch all work items for this phase
      const allBacklogItems = await sdlcService.getBacklogItems(projectId, parseInt(phaseNumber));
      const userStories = allBacklogItems.filter((item: any) => item.type === 'story');
      const requirements = await sdlcService.getRequirements(projectId, parseInt(phaseNumber));
      const documents = await sdlcService.getDocuments(projectId, parseInt(phaseNumber));

      console.log("[API] Fetched work items:", {
        userStories: userStories.length,
        requirements: requirements.length,
        backlog: allBacklogItems.length,
        documents: documents.length
      });

      // Generate documentation using AI
      const { generatePhaseDocumentation } = await import("./ai-service");
      const documentation = await generatePhaseDocumentation(
        phaseName,
        parseInt(phaseNumber),
        projectName,
        {
          userStories,
          requirements,
          backlog: allBacklogItems,
          documents
        }
      );

      console.log("[API] Documentation generated, length:", documentation.length);

      // Save the generated documentation
      const result = await sdlcService.createDocument({
        projectId,
        phaseNumber: parseInt(phaseNumber),
        title: `${phaseName} - Complete Phase Documentation`,
        content: documentation,
        type: "phase_summary"
      });

      console.log("[API] Documentation saved to database");

      res.status(201).json({
        ...result.document,
        _phaseUnlocked: result.unlockInfo,
        message: "Phase documentation generated successfully"
      });
    } catch (error) {
      console.error("Error generating phase documentation:", error);
      res.status(500).json({
        error: "Failed to generate phase documentation",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Documents (backward compatibility)
  app.get("/api/sdlc/projects/:projectId/documents", async (req, res) => {
    try {
      const documents = await sdlcService.getDocuments(req.params.projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/documents", async (req, res) => {
    try {
      const document = await sdlcService.createDocument({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/sdlc/documents/:id", async (req, res) => {
    try {
      const document = await sdlcService.updateDocument(req.params.id, req.body);
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/sdlc/documents/:id", async (req, res) => {
    try {
      await sdlcService.deleteDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Fetch requirement documents from Azure DevOps for design generation
  app.get("/api/sdlc/projects/:projectId/ado-requirements", async (req, res) => {
    try {
      const { projectId } = req.params;

      let requirements: any[] = [];
      let userStories: any[] = [];
      let tasks: any[] = [];
      let fetchSucceeded = false;

      const { AzureDevOpsService } = await import("./azure-devops-service");

      // Try 1: DevXPlatform with environment variable PAT
      const adoPAT = process.env.ADO_PAT;
      if (adoPAT && !fetchSucceeded) {
        try {
          console.log("[ADO Fetch] Attempting DevXPlatform/NousAugmentedDevX with env PAT");
          const adoService = new AzureDevOpsService({
            organization: "DevXPlatform",
            project: "NousAugmentedDevX",
            pat: adoPAT,
          });

          [requirements, userStories, tasks] = await Promise.all([
            adoService.getWorkItemsByType('Requirement', "NousAugmentedDevX", 50),
            adoService.getWorkItemsByType('User Story', "NousAugmentedDevX", 50),
            adoService.getWorkItemsByType('Task', "NousAugmentedDevX", 50),
          ]);

          fetchSucceeded = true;
          console.log("[ADO Fetch] Success with DevXPlatform");
        } catch (devXError) {
          console.log("[ADO Fetch] DevXPlatform failed, will try fallback:", devXError instanceof Error ? devXError.message : String(devXError));
        }
      }

      // Try 2: Fallback to client settings (artifact_organizations)
      if (!fetchSucceeded) {
        const artifactOrgs = await storage.getArtifactOrganizations();
        const firstOrg = artifactOrgs[0];

        if (!firstOrg || !firstOrg.patToken) {
          return res.status(400).json({
            error: "Azure DevOps not configured. Please set ADO_PAT environment variable or configure in Settings > Client Settings."
          });
        }

        const decryptedPAT = decryptPAT(firstOrg.patToken);
        if (!decryptedPAT) {
          return res.status(400).json({
            error: "Azure DevOps PAT could not be decrypted."
          });
        }

        const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');
        const project = firstOrg.projectName;

        console.log(`[ADO Fetch] Attempting ${organization}/${project} with client settings PAT`);
        const adoService = new AzureDevOpsService({
          organization,
          project,
          pat: decryptedPAT,
        });

        [requirements, userStories, tasks] = await Promise.all([
          adoService.getWorkItemsByType('Requirement', project, 50),
          adoService.getWorkItemsByType('User Story', project, 50),
          adoService.getWorkItemsByType('Task', project, 50),
        ]);

        console.log(`[ADO Fetch] Success with ${organization}/${project}`);
      }

      // Helper function to extract assignee name from various ADO formats
      const getAssignedTo = (assignedToField: any): string => {
        if (!assignedToField) return 'Unassigned';

        // Handle string format: "Jane Doe <jane@contoso.com>"
        if (typeof assignedToField === 'string') {
          return assignedToField;
        }

        // Handle object format with displayName property
        if (assignedToField.displayName) {
          return assignedToField.displayName;
        }

        return 'Unassigned';
      };

      // Format the documents for the UI with enhanced fields
      const documents = [
        ...requirements.map((req: any) => ({
          id: req.fields['System.Id'],
          title: req.fields['System.Title'],
          description: req.fields['System.Description'] || '',
          acceptanceCriteria: req.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
          assignedTo: getAssignedTo(req.fields['System.AssignedTo']),
          tags: req.fields['System.Tags'] || '',
          areaPath: req.fields['System.AreaPath'] || '',
          type: 'Requirement',
          state: req.fields['System.State'],
        })),
        ...userStories.map((story: any) => ({
          id: story.fields['System.Id'],
          title: story.fields['System.Title'],
          description: story.fields['System.Description'] || '',
          acceptanceCriteria: story.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
          assignedTo: getAssignedTo(story.fields['System.AssignedTo']),
          tags: story.fields['System.Tags'] || '',
          areaPath: story.fields['System.AreaPath'] || '',
          type: 'User Story',
          state: story.fields['System.State'],
        })),
        ...tasks.map((task: any) => ({
          id: task.fields['System.Id'],
          title: task.fields['System.Title'],
          description: task.fields['System.Description'] || '',
          acceptanceCriteria: task.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
          assignedTo: getAssignedTo(task.fields['System.AssignedTo']),
          tags: task.fields['System.Tags'] || '',
          areaPath: task.fields['System.AreaPath'] || '',
          type: 'Task',
          state: task.fields['System.State'],
        })),
      ];

      res.json({ documents });
    } catch (error) {
      console.error("Error fetching ADO requirements:", error);
      res.status(500).json({
        error: "Failed to fetch requirements from Azure DevOps",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate Design with AI
  app.post("/api/sdlc/projects/:projectId/generate-design", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { designType, requirementDocument } = req.body;

      console.log("[API] Generating design for:", { projectId, designType });

      if (!designType || !requirementDocument) {
        return res.status(400).json({ error: "Design type and requirement document are required" });
      }

      // Map design type to category
      const designCategoryMap: Record<string, string> = {
        "System Architecture": "system-architecture",
        "Database Design": "database-design",
        "Component Design": "component-design",
      };

      const designCategory = designCategoryMap[designType];
      if (!designCategory) {
        return res.status(400).json({ error: "Invalid design type" });
      }

      // Attempt to fetch ADO backlog context
      let adoBacklogContext = undefined;
      let adoDataAvailable = false;
      try {
        // Use client settings (artifact_organizations)
        const artifactOrgs = await storage.getArtifactOrganizations();
        const firstOrg = artifactOrgs[0];

        if (firstOrg?.patToken) {
          const decryptedPAT = decryptPAT(firstOrg.patToken);

          if (decryptedPAT) {
            console.log("[API] Fetching ADO backlog context for design generation");
            const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');

            const { AzureDevOpsService } = await import("./azure-devops-service");
            const adoService = new AzureDevOpsService({
              organization,
              project: firstOrg.projectName,
              pat: decryptedPAT,
            });

            // Fetch backlog items from ADO
            const backlogContext = await adoService.getBacklogContext(firstOrg.projectName);

            adoBacklogContext = {
              epics: backlogContext.epics || [],
              features: backlogContext.features || [],
              userStories: backlogContext.userStories || [],
              tasks: backlogContext.tasks || [],
              bugs: backlogContext.bugs || [],
            };

            const totalItems = (backlogContext.epics?.length || 0) +
              (backlogContext.features?.length || 0) +
              (backlogContext.userStories?.length || 0) +
              (backlogContext.tasks?.length || 0) +
              (backlogContext.bugs?.length || 0);
            adoDataAvailable = totalItems > 0;
            console.log("[API] ADO backlog fetched:", {
              epics: adoBacklogContext.epics.length,
              features: adoBacklogContext.features.length,
              userStories: adoBacklogContext.userStories.length,
              tasks: adoBacklogContext.tasks.length,
              bugs: adoBacklogContext.bugs.length,
            });
          }
        }
      } catch (adoError) {
        console.warn("[API] Could not fetch ADO backlog context:", adoError);
        // Continue without ADO data - not a fatal error
      }

      // Generate design content using AI
      const { generateDesignContent } = await import("./ai-service");
      const designContent = await generateDesignContent(designType, requirementDocument, adoBacklogContext);

      console.log("[API] Design content generated, length:", designContent.length);

      // Create a temporary file URL (in production, this would be stored in cloud storage)
      const fileName = `${designCategory}-${Date.now()}.md`;
      const fileUrl = `data:text/markdown;base64,${Buffer.from(designContent).toString('base64')}`;

      // Save the generated design to design assets
      const asset = await sdlcService.createDesignAsset({
        projectId,
        phaseNumber: 2, // Design phase
        name: designType,
        description: `AI-generated ${designType} based on requirements`,
        fileUrl,
        fileType: "markdown",
        fileSize: designContent.length,
        source: "ai-generated",
        designCategory,
      });

      console.log("[API] Design asset saved to database");

      // Sync to Azure DevOps if configured
      let adoWorkItemId = null;
      try {
        // Use client settings (artifact_organizations)
        const artifactOrgs = await storage.getArtifactOrganizations();
        const firstOrg = artifactOrgs[0];

        if (firstOrg?.patToken) {
          const decryptedPAT = decryptPAT(firstOrg.patToken);

          if (decryptedPAT) {
            // Extract organization from URL
            const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');

            const { AzureDevOpsService } = await import("./azure-devops-service");
            const adoService = new AzureDevOpsService({
              organization,
              project: firstOrg.projectName,
              pat: decryptedPAT,
            });

            // Create a Task work item in ADO for the design document
            const workItemTitle = `${designType} - ${new Date().toLocaleDateString()}`;
            const workItemDescription = `<h2>AI-Generated ${designType}</h2>
<p>Generated on: ${new Date().toLocaleString()}</p>
<p>Project: ${firstOrg.projectName}</p>
<h3>Design Content</h3>
<pre>${designContent.substring(0, 5000)}${designContent.length > 5000 ? '...\n\n(Full content available in Design Phase of DevPlatform)' : ''}</pre>`;

            adoWorkItemId = await adoService.createWorkItemFromChat(
              'Task',
              workItemTitle,
              workItemDescription,
              undefined,
              undefined,
              undefined,
              undefined,
              ['design', 'ai-generated', designCategory]
            );

            console.log(`[API] Design synced to Azure DevOps as work item #${adoWorkItemId}`);
          }
        }
      } catch (adoError) {
        console.error('[API] Failed to sync to Azure DevOps (non-fatal):', adoError);
        // Don't fail the whole request if ADO sync fails
      }

      res.status(201).json({
        success: true,
        asset,
        adoWorkItemId,
        adoDataUsed: adoDataAvailable,
        message: `${designType} generated successfully${adoDataAvailable ? ' using Azure DevOps backlog context' : ''}${adoWorkItemId ? ` and synced to ADO (Work Item #${adoWorkItemId})` : ''}`
      });
    } catch (error) {
      console.error("Error generating design:", error);
      res.status(500).json({
        error: "Failed to generate design",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Design Assets API Routes
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/design-assets", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const assets = await sdlcService.getDesignAssets(projectId, parseInt(phaseNumber));
      res.json(assets);
    } catch (error) {
      console.error("Error fetching design assets:", error);
      res.status(500).json({ error: "Failed to fetch design assets" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/design-assets", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;

      const { validateDesignAssetSchema } = await import("@shared/schema");
      const validationResult = validateDesignAssetSchema.safeParse({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors.map(e => e.message).join(", ")
        });
      }

      const asset = await sdlcService.createDesignAsset(validationResult.data);
      res.status(201).json(asset);
    } catch (error) {
      console.error("Error creating design asset:", error);
      res.status(500).json({ error: "Failed to create design asset" });
    }
  });

  app.patch("/api/sdlc/design-assets/:id", async (req, res) => {
    try {
      const asset = await sdlcService.updateDesignAsset(req.params.id, req.body);
      res.json(asset);
    } catch (error) {
      console.error("Error updating design asset:", error);
      res.status(500).json({ error: "Failed to update design asset" });
    }
  });

  app.delete("/api/sdlc/design-assets/:id", async (req, res) => {
    try {
      await sdlcService.deleteDesignAsset(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting design asset:", error);
      res.status(500).json({ error: "Failed to delete design asset" });
    }
  });

  // Sync documents from Requirement & Analysis to Design Assets
  app.post("/api/sdlc/projects/:projectId/sync-documents-to-design", async (req, res) => {
    try {
      const { projectId } = req.params;
      const result = await sdlcService.syncDocumentsToDesignAssets(projectId);
      res.json(result);
    } catch (error) {
      console.error("Error syncing documents to design assets:", error);
      res.status(500).json({ error: "Failed to sync documents" });
    }
  });

  // Figma Links API Routes
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/figma-links", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const links = await sdlcService.getFigmaLinks(projectId, parseInt(phaseNumber));
      res.json(links);
    } catch (error) {
      console.error("Error fetching Figma links:", error);
      res.status(500).json({ error: "Failed to fetch Figma links" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/figma-links", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;

      const { validateFigmaLinkSchema } = await import("@shared/schema");
      const validationResult = validateFigmaLinkSchema.safeParse({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors.map(e => e.message).join(", ")
        });
      }

      const link = await sdlcService.createFigmaLink(validationResult.data);
      res.status(201).json(link);
    } catch (error) {
      console.error("Error creating Figma link:", error);
      res.status(500).json({ error: "Failed to create Figma link" });
    }
  });

  app.patch("/api/sdlc/figma-links/:id", async (req, res) => {
    try {
      const link = await sdlcService.updateFigmaLink(req.params.id, req.body);
      res.json(link);
    } catch (error) {
      console.error("Error updating Figma link:", error);
      res.status(500).json({ error: "Failed to update Figma link" });
    }
  });

  app.delete("/api/sdlc/figma-links/:id", async (req, res) => {
    try {
      await sdlcService.deleteFigmaLink(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Figma link:", error);
      res.status(500).json({ error: "Failed to delete Figma link" });
    }
  });

  // Design Reviews API Routes
  app.get("/api/sdlc/projects/:projectId/phases/:phaseNumber/design-reviews", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;
      const reviews = await sdlcService.getDesignReviews(projectId, parseInt(phaseNumber));
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching design reviews:", error);
      res.status(500).json({ error: "Failed to fetch design reviews" });
    }
  });

  app.post("/api/sdlc/projects/:projectId/phases/:phaseNumber/design-reviews", async (req, res) => {
    try {
      const { projectId, phaseNumber } = req.params;

      const { validateDesignReviewSchema } = await import("@shared/schema");
      const validationResult = validateDesignReviewSchema.safeParse({
        ...req.body,
        projectId,
        phaseNumber: parseInt(phaseNumber),
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors.map(e => e.message).join(", ")
        });
      }

      const review = await sdlcService.createDesignReview(validationResult.data);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating design review:", error);
      res.status(500).json({ error: "Failed to create design review" });
    }
  });

  app.patch("/api/sdlc/design-reviews/:id", async (req, res) => {
    try {
      const review = await sdlcService.updateDesignReview(req.params.id, req.body);
      res.json(review);
    } catch (error) {
      console.error("Error updating design review:", error);
      res.status(500).json({ error: "Failed to update design review" });
    }
  });

  app.delete("/api/sdlc/design-reviews/:id", async (req, res) => {
    try {
      await sdlcService.deleteDesignReview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting design review:", error);
      res.status(500).json({ error: "Failed to delete design review" });
    }
  });

  // ADO Design Sync API Routes

  // Get ADO sync status for a project
  app.get("/api/sdlc/projects/:projectId/ado-sync-status", async (req, res) => {
    try {
      const sync = await sdlcService.getAdoDesignSync(req.params.projectId);
      res.json(sync || null);
    } catch (error) {
      console.error("Error fetching ADO sync status:", error);
      res.status(500).json({ error: "Failed to fetch ADO sync status" });
    }
  });

  // Trigger manual ADO sync for a project
  app.post("/api/sdlc/projects/:projectId/sync-from-ado", async (req, res) => {
    try {
      const { projectId } = req.params;

      // Get client settings (artifact_organizations) to initialize Azure DevOps service
      const artifactOrgs = await storage.getArtifactOrganizations();
      const firstOrg = artifactOrgs[0];

      if (!firstOrg || !firstOrg.patToken) {
        return res.status(400).json({ error: "Azure DevOps not configured. Please configure in Settings > Client Settings." });
      }

      // Decrypt PAT token
      const decryptedPAT = decryptPAT(firstOrg.patToken);

      // Get or create sync record
      let syncRecord = await sdlcService.getAdoDesignSync(projectId);

      if (!syncRecord) {
        syncRecord = await sdlcService.createAdoDesignSync({
          projectId,
          phaseNumber: 2,
          syncStatus: 'pending',
        });
      }

      // Update sync status to syncing
      await sdlcService.updateAdoDesignSync(syncRecord.id, {
        syncStatus: 'syncing',
        lastSyncAt: new Date(),
      });

      try {
        // Initialize Azure DevOps service
        const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');
        const { AzureDevOpsService } = await import("./azure-devops-service");
        const adoService = new AzureDevOpsService({
          organization,
          project: firstOrg.projectName,
          pat: decryptedPAT || "",
        });

        // Fetch categorized design work items from ADO
        const categorizedWorkItems = await adoService.getDesignWorkItems();

        // Sync work items to design phase
        const result = await sdlcService.syncDesignFromAdo(projectId, categorizedWorkItems);

        // Update sync record with results
        await sdlcService.updateAdoDesignSync(syncRecord.id, {
          syncStatus: result.errors.length > 0 ? 'failed' : 'completed',
          syncedItemsCount: result.syncedCount,
          errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
        });

        res.json({
          success: true,
          syncedCount: result.syncedCount,
          errors: result.errors,
          message: `Successfully synced ${result.syncedCount} design items from Azure DevOps`,
        });
      } catch (syncError) {
        // Update sync record with error
        const errorMsg = syncError instanceof Error ? syncError.message : 'Unknown sync error';
        await sdlcService.updateAdoDesignSync(syncRecord.id, {
          syncStatus: 'failed',
          errorMessage: errorMsg,
        });

        throw syncError;
      }
    } catch (error) {
      console.error("Error syncing from ADO:", error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Failed to sync from ADO: ${errorMsg}` });
    }
  });

  // Phase Confirmation API Routes

  // Get confirmations for a specific phase
  app.get("/api/sdlc/phases/:phaseId/confirmations", async (req, res) => {
    try {
      const confirmations = await sdlcService.getConfirmationsByPhaseId(req.params.phaseId);
      res.json(confirmations);
    } catch (error) {
      console.error("Error fetching confirmations:", error);
      res.status(500).json({ error: "Failed to fetch confirmations" });
    }
  });

  // Initialize confirmations for a phase (creates 3 pending confirmations)
  app.post("/api/sdlc/phases/:phaseId/confirmations/initialize", async (req, res) => {
    try {
      const confirmations = await sdlcService.initializePhaseConfirmations(req.params.phaseId);
      res.status(201).json(confirmations);
    } catch (error) {
      console.error("Error initializing confirmations:", error);
      res.status(500).json({ error: "Failed to initialize confirmations" });
    }
  });

  // Submit or update a confirmation
  app.put("/api/sdlc/confirmations/:confirmationId", async (req, res) => {
    try {
      const { status, confirmerName, comments } = req.body;

      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be pending, approved, or rejected" });
      }

      const confirmation = await sdlcService.updateConfirmation(req.params.confirmationId, {
        status,
        confirmerName,
        comments,
        confirmedAt: status !== "pending" ? new Date() : null,
      });

      res.json(confirmation);
    } catch (error) {
      console.error("Error updating confirmation:", error);
      res.status(500).json({ error: "Failed to update confirmation" });
    }
  });

  // Check if phase is ready for progression (80% progress + all 3 confirmations approved)
  app.get("/api/sdlc/phases/:phaseId/ready-for-progression", async (req, res) => {
    try {
      const result = await sdlcService.checkPhaseReadyForProgression(req.params.phaseId);
      res.json(result);
    } catch (error) {
      console.error("Error checking phase readiness:", error);
      res.status(500).json({ error: "Failed to check phase readiness" });
    }
  });

  // Golden Repositories API Routes

  // Get all repositories (with optional domain filter)
  app.get("/api/golden-repos", async (req, res) => {
    try {
      const { domain } = req.query;

      // Return all repositories if domain is "all" or not provided
      const repos = domain && typeof domain === "string" && domain !== "all"
        ? await goldenRepoService.getRepositoriesByDomain(domain)
        : await goldenRepoService.getAllRepositories();

      res.json(repos);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // Get repository by ID
  app.get("/api/golden-repos/:id", async (req, res) => {
    try {
      const repo = await goldenRepoService.getRepositoryById(req.params.id);
      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }
      res.json(repo);
    } catch (error) {
      console.error("Error fetching repository:", error);
      res.status(500).json({ error: "Failed to fetch repository" });
    }
  });

  // Create repository
  app.post("/api/golden-repos", async (req, res) => {
    try {
      const repo = await goldenRepoService.createRepository(req.body);
      res.status(201).json(repo);
    } catch (error) {
      console.error("Error creating repository:", error);
      res.status(500).json({ error: "Failed to create repository" });
    }
  });

  // Create SDLC project from selected repositories
  app.post("/api/golden-repos/create-sdlc-project", async (req, res) => {
    try {
      const { repositoryIds, repositoryName, projectName, projectDescription } = req.body;

      if (!repositoryIds || !Array.isArray(repositoryIds) || repositoryIds.length === 0) {
        return res.status(400).json({ error: "Repository IDs are required" });
      }

      // These are ADO repository IDs, not golden repository IDs
      // Create SDLC project without linking to a golden repository
      const repoName = repositoryName || projectName || "Repository";
      const projectData = {
        name: projectName || `${repoName} - SDLC Project`,
        description: projectDescription || `SDLC tracking for ${repoName}`,
        repositoryId: null, // ADO repositories are not stored in golden_repositories table
        status: "active" as const,
      };

      const project = await sdlcService.createProject(projectData);

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating SDLC project:", error);
      res.status(500).json({ error: "Failed to create SDLC project" });
    }
  });

  // Seed initial repository data
  app.post("/api/golden-repos/seed", async (req, res) => {
    try {
      await goldenRepoService.seedInitialData();
      res.json({ message: "Initial data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  // Golden Repo Preview - Extract and serve file tree
  app.get("/api/golden-repos/preview/:repoId/tree", async (req, res) => {
    try {
      const { repoId } = req.params;
      const fileTree = await goldenRepoService.extractFileTree(repoId);
      res.json(fileTree);
    } catch (error) {
      console.error("Error extracting file tree:", error);
      res.status(500).json({ error: "Failed to extract file tree" });
    }
  });

  // Golden Repo Preview - Get file content
  app.get("/api/golden-repos/preview/:repoId/file", async (req, res) => {
    try {
      const { repoId } = req.params;
      const { path, source } = req.query;

      if (!path || typeof path !== "string") {
        return res.status(400).json({ error: "File path is required" });
      }

      const sourceType = typeof source === "string" ? source : "repository";
      const fileContent = await goldenRepoService.getFileContent(repoId, path, sourceType);
      res.json(fileContent);
    } catch (error) {
      console.error("Error getting file content:", error);
      res.status(500).json({ error: "Failed to get file content" });
    }
  });

  // Golden Repo - Download as ZIP
  app.get("/api/golden-repos/:repoId/download", async (req, res) => {
    try {
      const { repoId } = req.params;
      const repo = await goldenRepoService.getRepositoryById(repoId);

      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }

      const zipData = await goldenRepoService.downloadRepository(repoId);

      // Ensure filename does not include branch suffix like -main or _main (or -main-anything)
      const sanitizedName = (repo.name || 'repository')
        .replace(/\s+/g, '_')
        .replace(/[-_]main([-_].*)?$/i, ''); // Remove -main or _main and anything after

      console.log(`[download endpoint] Original repo.name: "${repo.name}", Sanitized filename: "${sanitizedName}.zip"`);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedName}.zip"`);
      res.send(zipData);
    } catch (error) {
      console.error("Error downloading repository:", error);
      res.status(500).json({ error: "Failed to download repository" });
    }
  });

  // Golden Repo - Fork (Create new SDLC project from repository)
  app.post("/api/golden-repos/:repoId/fork", async (req, res) => {
    try {
      const { repoId } = req.params;
      const { projectName, projectDescription, organizationId } = req.body;

      const repo = await goldenRepoService.getRepositoryById(repoId);

      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // Create a new SDLC project from the forked repository
      const projectData = {
        organizationId: organizationId || "default-org",
        name: projectName || `${repo.name} (Forked)`,
        description: projectDescription || `Forked from ${repo.name} - ${repo.description}`,
        repositoryId: repoId,
        status: "active" as const,
      };

      const project = await sdlcService.createProject(projectData);

      res.status(201).json({
        success: true,
        message: "Repository forked successfully",
        project,
      });
    } catch (error) {
      console.error("Error forking repository:", error);
      res.status(500).json({ error: "Failed to fork repository" });
    }
  });

  // Chatbot API - Chat with Azure AI Foundry Agent (Tia Bot) with ADO Integration
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Validate environment variables - use AZURE_OPENAI_* for consistency with ai-service.ts
      const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01";

      if (!azureApiKey || !azureEndpoint || !deploymentName) {
        return res.status(500).json({
          error: "Azure AI configuration is missing. Please check environment variables AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT."
        });
      }

      // Check if ADO integration is available using client settings (artifact_organizations)
      const artifactOrgs = await storage.getArtifactOrganizations();
      const firstOrg = artifactOrgs[0];
      const decryptedPat = firstOrg?.patToken ? decryptPAT(firstOrg.patToken) : null;
      const hasAdoIntegration = !!(decryptedPat && firstOrg?.organizationUrl && firstOrg?.projectName);

      console.log('[Chat API] ADO Integration status:', hasAdoIntegration ? 'enabled' : 'disabled');
      if (firstOrg) {
        // Extract organization name from URL (e.g., https://dev.azure.com/OrgName -> OrgName)
        const orgName = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');
        console.log('[Chat API] Central ADO settings details:', {
          organizationUrl: firstOrg.organizationUrl,
          organizationName: orgName,
          projectName: firstOrg.projectName,
          hasPatToken: !!firstOrg.patToken,
          patDecrypted: !!decryptedPat,
          hasIntegration: hasAdoIntegration
        });
      } else {
        console.log('[Chat API] No central ADO settings found in database');
      }

      // Interactive Agile Story Assistant system prompt with enhanced ADO integration
      let systemPromptContent = `You are Tia - an intelligent, friendly, and highly interactive AI assistant designed to help users create Agile user stories, backlogs, epics, and tasks in an interactive way.

Your PRIMARY GOAL is to generate user stories, backlogs, epics, and tasks through natural, human-like conversation while leveraging Azure DevOps data to ask better, more contextual questions.`;

      // Add ADO integration instructions if available
      if (hasAdoIntegration && firstOrg) {
        const orgName = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');
        systemPromptContent += `\n\n## AZURE DEVOPS INTEGRATION (CRITICAL)

You have real-time access to Azure DevOps through function calling! This is your SUPERPOWER.

**Current ADO Configuration:**
- Organization: ${orgName}
- Project: ${firstOrg.projectName}

**Available ADO Functions:**
- \`get_repositories\` - List all repositories
- \`get_pipelines\` - Show build pipelines  
- \`get_work_items_by_type\` - Query User Stories, Tasks, Bugs, Epics, Features
- \`search_work_items\` - Search work items by keywords
- \`get_work_item_with_children\` - Get work item with subtasks
- \`get_pull_requests\` - View PRs for repositories
- \`get_commits\` - See recent commits
- \`get_recent_builds\` - Check pipeline runs
- \`get_projects\` - List all projects

**WHEN CREATING USER STORIES - USE ADO DATA TO ASK BETTER QUESTIONS:**

When a user asks to create a user story, PROACTIVELY fetch relevant ADO data to ask intelligent, contextual questions:

1. **Before asking about repositories:** Fetch existing repositories to reference them
   - Example: "I see you have repositories like \`frontend-app\` and \`backend-api\`. Which one is this story related to?"

2. **Before asking about related work:** Fetch existing user stories and epics
   - Example: "I found these existing user stories: #1234 Login Feature, #1235 Dashboard. Is this new story related to any of them?"

3. **When gathering context:** Reference existing work items for consistency
   - Example: "I notice you have Epic #100 'User Management System'. Should this story be part of that epic?"

4. **Check pipelines and PRs:** Understand active development
   - Example: "I see there's recent activity in the \`authentication\` repo. Is this story related to that work?"

**GENERATE STORIES CONSIDERING EXISTING ADO WORK ITEMS:**
- Always check for similar or related existing user stories before generating new ones
- Ensure consistency with existing epics, features, and work item patterns
- Reference existing work item IDs when suggesting relationships
- Maintain naming conventions from existing work items`;
      }

      systemPromptContent += `\n\n## CORE BEHAVIOR GUIDELINES

### 1. Human-Like Tone (CRITICAL):
- Sound warm, polite, and conversational - like a helpful colleague
- Use phrases like:
  - "Got it!"
  - "That's great!"
  - "Sounds interesting!"
  - "Let's refine that a bit…"
  - "Perfect!"
  - "I see what you mean!"
- Avoid robotic or overly formal language
- Keep responses SHORT (2-3 sentences max) except when presenting final story or ADO data

### 2. Interactive Flow - ONE QUESTION AT A TIME (CRITICAL - ABSOLUTELY MANDATORY):

**RULE: Ask ONLY ONE SINGLE QUESTION per message. NEVER ask multiple questions.**

**CORRECT Example:**
User: "Hey, can you create a user story for me?"
You: "Sure, I'd be happy to help with that! Could you please share some details about the project or feature you're working on?"

User: "It's an automation platform project and the story is for the Dashboard UI screen."
You: "Great, thanks for the details! Could you tell me who the primary users of this Dashboard will be?"

**WRONG Example (DO NOT DO THIS):**
User: "Hey, can you create a user story for me?"
You: "Sure! What project is this for? Who are the users? What functionality do you need?"
☝️ NEVER do this - too many questions at once!

**Every message you send must:**
1. **First:** Acknowledge what the user just said (1 sentence)
2. **Second:** Ask ONE specific, focused question to gather the next piece of information
3. **Never:** Ask multiple questions in the same message
4. **Never:** List several questions like "What is X? What is Y? What is Z?"

### 3. Context Awareness (CRITICAL - AVOID RE-ASKING):
- **ALWAYS remember the full conversation context**
- **NEVER ask for information the user already provided**
- Reference previous answers in your acknowledgments
- **Use ADO data to inform your questions** (fetch repos, work items, etc.)
- Adapt your tone to match the user's style

**SMART QUESTIONING RULES:**
1. Before asking ANY question, check if the user already answered it
2. If user mentioned something in passing, acknowledge it and don't ask again
3. Build on previous context instead of starting from scratch
4. Example:
   - ❌ BAD: User says "Dashboard for managers" → You ask "Who will use this?"
   - ✅ GOOD: User says "Dashboard for managers" → You acknowledge "managers" and move to next question

## ENHANCED USER STORY CREATION WORKFLOW

### PHASE 1: Information Gathering (ONE QUESTION AT A TIME - STEP-BY-STEP)

**CRITICAL RULE:** Ask ONLY ONE question per message. Wait for the user's answer before asking the next question.

Guide the conversation through these topics in order (but ask ONE at a time):

1. **Project/Feature Context:** 
   - Ask: "What project or feature is this story for?"
   - After they answer, fetch relevant ADO repos/epics to provide context
   - Then acknowledge and move to next question

2. **Primary Users:**
   - Ask: "Who will use this feature?"
   - Acknowledge their answer before next question

3. **Main Functionality:**
   - Ask: "What should this feature do?" or "What key functionalities should it include?"
   - Acknowledge their answer before next question

4. **Related Work Items (if relevant):**
   - Ask: "Is this related to any existing user stories or epics?"
   - Use ADO to search and suggest related work items
   - Acknowledge their answer before next question

5. **User Goal/Benefit:**
   - Ask: "What do users achieve with this?" or "What's the main benefit?"
   - Acknowledge their answer before next question

6. **Acceptance Criteria:**
   - Ask: "What conditions must be met for this to be 'done'?"
   - Acknowledge their answer before next question

7. **Test Scenarios (if needed):**
   - Ask: "How would you verify it works?"
   - Acknowledge their answer before proceeding to Phase 2

**Remember:** After each user response, acknowledge what they said, then ask the NEXT single question.

### PHASE 2: Story Metadata Collection (CRITICAL - MANDATORY BEFORE GENERATION)

**RULE:** You MUST collect ALL metadata BEFORE generating the story summary in Phase 3. Never skip this phase.

After gathering story details, collect these REQUIRED fields (ask ONE at a time):

8. **Priority (REQUIRED):**
   - Ask: "What's the priority for this story - High, Medium, or Low?"
   - If user doesn't provide, evaluate based on impact and suggest one
   - Acknowledge their answer before next question

9. **Assignee (REQUIRED):**
   - Ask: "Who should be assigned to this story? You can provide a name or email."
   - If they don't know, offer to leave it unassigned
   - Acknowledge their answer before next question

10. **Story Points (REQUIRED):**
    - Ask: "What's your story point estimation for this?"
    - If user doesn't provide: **YOU MUST EVALUATE IT YOURSELF** based on complexity
    - Say: "Based on the complexity, I'd estimate this as [X] story points. Does that sound right?"
    - Use Fibonacci scale: 1, 2, 3, 5, 8, 13, 21
    - Acknowledge their answer before next question

11. **Tags/Labels (OPTIONAL):**
    - Only ask if relevant to the project context
    - "Are there any tags or labels you'd like to add?"

**Remember:** You MUST have Priority, Assignee, and Story Points BEFORE moving to Phase 3. Continue asking ONE question at a time until you have all required metadata.

### PHASE 3: Story Generation (ONLY AFTER COLLECTING ALL METADATA)

**PREREQUISITE CHECK:** Before generating, ensure you have:
✅ Story details (persona, functionality, acceptance criteria, etc.)
✅ Priority (High/Medium/Low)
✅ Assignee (name/email or "Unassigned")
✅ Story Points (number)

**If ANY of these are missing, go back to Phase 2 and collect them first.**

Generate the user story in this EXACT format:

\`\`\`
**User Story**
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

**Metadata:**
• Assignee: [name or "Unassigned"]
• Story Points: [number]
• Priority: [High/Medium/Low]
• Related Work Items: [#IDs if any]
\`\`\`

### PHASE 4: Approval Workflow (CRITICAL - MANDATORY FLOW WITH REGENERATION)

After presenting the story, **ALWAYS ASK FOR APPROVAL** - This is MANDATORY:

"Does this user story look good to you, or would you like me to regenerate it with changes?"

**If user says NO or requests changes:**
- Ask what they'd like to change
- Regenerate the ENTIRE story with the modifications incorporated
- Show the UPDATED story in the same format
- Ask for approval again (repeat this phase until approved)

**If user provides ADDITIONAL INFORMATION after seeing the story:**
- **MANDATORY ACTION:** You MUST go back to Phase 3 (Story Generation)
- Acknowledge the new information: "Got it! Let me update the story with that information."
- Rebuild the COMPLETE story from scratch incorporating:
  - All original information from the conversation
  - The new details the user just provided
  - All metadata (Priority, Assignee, Story Points)
- Show the FULLY UPDATED story in the exact same format
- **Return to approval step** - Ask "Does this updated story look good?"
- **Repeat this cycle** until user approves without adding more information

**REGENERATION RULES (CRITICAL - MUST FOLLOW):**
1. User adds ANY new information after seeing summary → Go back to Phase 3 → Regenerate COMPLETE story
2. User requests changes to summary → Go back to Phase 3 → Regenerate COMPLETE story with changes
3. ALWAYS show the FULL updated story (never say "I've updated it" without showing it)
4. ALWAYS rebuild description AND acceptance criteria with new information
5. Keep the approval loop running until user explicitly says YES/approves with NO additional info
6. Each regeneration must include ALL information from the entire conversation, not just the new bits

**EXAMPLE REGENERATION FLOW:**
- You: [Show story v1]
- User: "Looks good but also add email notification feature"
- You: "Got it! Let me update the story with email notifications." [Show COMPLETE story v2 with email notifications integrated into description AND acceptance criteria]
- You: "Does this updated story look good?"
- User: "Yes, also needs to handle errors gracefully"  
- You: "Perfect! Let me add error handling." [Show COMPLETE story v3 with email notifications AND error handling integrated]
- You: "Does this updated story look good?"
- User: "Yes, that's perfect"
- You: "Great! I can create this in Azure DevOps. [CREATE_IN_ADO]"

**If user says YES or approves:**
- Respond with: "Great! I can create this story in Azure DevOps for you."
- **IMPORTANT:** Include this EXACT text in your response:
  \`\`\`
  [CREATE_IN_ADO]
  \`\`\`
- The frontend will detect this marker and show a "Create story in ADO" button
- **DO NOT** call any functions at this step
- **DO NOT** create the work item yet
- **WAIT** for the user to click the button (they will say "Create this story in Azure DevOps")

### PHASE 5: Creating Work Item in Azure DevOps (CRITICAL - FIELD SEPARATION)

**CRITICAL TIMING:** ONLY proceed to this phase when the user explicitly says "Create this story in Azure DevOps" (this happens when they click the button after approving the story).

**Detection:** If the conversation flow is:
1. You showed the story
2. User approved it  
3. You included [CREATE_IN_ADO] marker
4. User's next message is "Create this story in Azure DevOps"

Then and ONLY then, call the \`create_work_item\` function.

**DO NOT call create_work_item if:**
- User is still answering your questions
- You just generated the story and are asking for approval
- User approved but hasn't clicked the button yet
- The previous message was anything other than showing the [CREATE_IN_ADO] marker

**WHEN TO CALL THE FUNCTION:**
When user says "Create this story in Azure DevOps", **YOU MUST call the \`create_work_item\` function** with these parameters - **CRITICALLY IMPORTANT: SEPARATE THE FIELDS PROPERLY**:

- \`workItemType\`: "User Story" (or "Epic", "Task", "Bug" as appropriate)

- \`title\`: ONLY the story title (short, descriptive, one line)
  Example: "Implement Dashboard Analytics Widget"

- \`description\`: **ONLY the core functional description** formatted in HTML. Include:
  • The "As a [persona], I want [goal] so that [benefit]" statement
  • Persona information
  • List of key functionalities
  • Any context or background information
  
  **DO NOT include:** Acceptance Criteria, Test Cases, or Metadata in this field
  
  Example format:
  \`\`\`html
  <p><strong>User Story:</strong> As a Product Manager, I want to view real-time analytics on the dashboard so that I can make data-driven decisions.</p>
  <p><strong>Persona:</strong> Product Manager</p>
  <p><strong>Functionalities:</strong></p>
  <ul>
    <li>Display key metrics (users, revenue, conversion rate)</li>
    <li>Interactive charts and graphs</li>
    <li>Customizable date range filters</li>
  </ul>
  \`\`\`

- \`acceptanceCriteria\`: **ONLY the acceptance criteria** formatted in HTML with proper structure:
  
  Example format:
  \`\`\`html
  <ol>
    <li>The dashboard must load within 2 seconds</li>
    <li>All metrics must update in real-time (max 5 second delay)</li>
    <li>Users can filter data by date range (last 7, 30, 90 days)</li>
    <li>Charts must be responsive and mobile-friendly</li>
  </ol>
  <p><strong>Test Cases:</strong></p>
  <ol>
    <li>Verify dashboard loads with all widgets visible</li>
    <li>Test date range filter changes data correctly</li>
    <li>Confirm metrics match database values</li>
  </ol>
  \`\`\`

- \`assignedTo\`: The assignee's full name or email (if provided by user)
  Examples: "Juned Khan (BLR GSS)" or "juned.khan@company.com"

- \`storyPoints\`: The story points as a NUMBER (not string)
  Examples: 5, 8, 13

- \`priority\`: **Use these EXACT numeric values:**
  • 1 for High priority
  • 2 for Medium priority  
  • 3 for Low priority
  • 4 for Very Low priority

- \`tags\`: Comma-separated tags (optional)
  Example: "dashboard, analytics, frontend"

- \`projectName\`: (optional) The ADO project name if different from default

**CRITICAL RULES FOR FIELD SEPARATION:**
1. ❌ **NEVER** put acceptance criteria in the description field
2. ❌ **NEVER** put test cases in the description field
3. ❌ **NEVER** put metadata (assignee, story points, priority) in the description
4. ✅ **ALWAYS** use HTML formatting (<p>, <ul>, <li>, <ol>, <strong>) for description and acceptance criteria
5. ✅ **ALWAYS** separate description and acceptance criteria into their respective parameters
6. ✅ **ALWAYS** format lists properly with <ul> or <ol> tags
7. ✅ **ALWAYS** use the EXACT content from the story you showed and the user approved - don't modify or regenerate it

**PRESERVING APPROVED CONTENT:**
When creating the work item, use the EXACT same content you showed to the user earlier. Don't regenerate or modify the story. The user already approved specific content - that's what should go into ADO.

After the function returns successfully, inform the user with the work item ID and link.

## CRITICAL REMINDERS - READ BEFORE EVERY RESPONSE:

1. ⚠️ **ASK ONLY ONE QUESTION PER MESSAGE** - This is MANDATORY. Never ask 2+ questions.
2. ⚠️ **NEVER re-ask for information already provided** - Check conversation history first
3. **Always acknowledge** what the user said first (1 sentence)
4. **Then ask ONE specific question** to move forward
5. **Reference ADO data** when it helps ask better contextual questions
6. **Generate stories considering existing ADO work items** for consistency
7. ⚠️ **ALWAYS collect Priority, Assignee, and Story Points BEFORE generating story** - This is MANDATORY
8. **Evaluate story points yourself** if user doesn't provide them
9. **Always ask for approval** after generating story
10. **Regenerate complete story** if user adds information or requests changes
11. **Include [CREATE_IN_ADO] marker** when user approves to trigger button
12. ⚠️ **DO NOT call create_work_item function** until user says "Create this story in Azure DevOps" (after clicking button)

**METADATA COLLECTION - MANDATORY:**
- ALWAYS ask for Priority, Assignee, and Story Points BEFORE generating story
- These are REQUIRED fields - never skip them

**APPROVAL FLOW - MANDATORY:**
Step 1: Collect ALL metadata (Priority, Assignee, Story Points)
Step 2: Show the full generated story
Step 3: Ask "Does this look good?"
Step 4: If user adds info/requests changes → Regenerate complete story → Go back to Step 2
Step 5: If YES → include [CREATE_IN_ADO] marker → STOP (don't call function yet)
Step 6: Wait for user to click button (message: "Create this story in Azure DevOps")
Step 7: NOW call create_work_item with properly separated fields

**CONTEXT AWARENESS:**
- Before asking ANY question, check if user already provided that information
- Build on previous answers, don't start from scratch
- Reference what user already told you

**Example conversation flow (with regeneration):**
- User: "Create a user story for a dashboard"
- You: "Great! What project is this for?" ✅ ONE question
- User: "Analytics platform"
- You: "Perfect! Who are the primary users?" ✅ ONE question  
- User: "Data analysts and managers"
- You: "Excellent! What key functionalities should it include?" ✅ ONE question
- User: "Real-time charts and filters"
- You: "What acceptance criteria should we include?" ✅ ONE question
- User: "Charts load under 2 seconds, filters work correctly"
- You: "What's the priority - High, Medium, or Low?" ✅ Collecting metadata
- User: "High"
- You: "Who should be assigned to this?" ✅ Collecting metadata
- User: "Sarah Johnson"
- You: "Based on the complexity, I'd estimate 5 story points. Does that sound right?" ✅ Collecting metadata
- User: "Yes"
- You: [Show COMPLETE story with all details] "Does this look good?" ✅ Asking for approval
- User: "Yes but also add export to PDF feature" ✅ User adds new info
- You: "Got it! Let me update the story with PDF export." [Show COMPLETE updated story v2] "Does this updated story look good?" ✅ Regenerated and asking again
- User: "Perfect!"
- You: "Great! I can create this in Azure DevOps. [CREATE_IN_ADO]" ✅ NO function call yet
- User: "Create this story in Azure DevOps" [Button clicked]
- You: [NOW call create_work_item function] ✅ Function call happens here

Now respond naturally following these rules.`;

      const systemPrompt = {
        role: "system",
        content: systemPromptContent
      };

      // Prepare messages with system prompt
      let chatMessages = [systemPrompt, ...messages];

      // Import ADO functions if integration is available
      let adoFunctionsTools;
      let adoConfig;
      if (hasAdoIntegration && firstOrg) {
        const { adoFunctions } = await import('./ado-chatbot-functions');
        const { AzureDevOpsService } = await import('./azure-devops-service');

        // Extract organization name from URL
        const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');

        adoConfig = {
          organization,
          project: firstOrg.projectName,
          pat: decryptedPat!
        };

        console.log('[Chat API] ADO config created:', {
          organization,
          project: firstOrg.projectName,
          patLength: decryptedPat?.length || 0
        });

        adoFunctionsTools = adoFunctions.map(fn => ({
          type: 'function',
          function: fn
        }));
      }

      // Call Azure OpenAI API with optional function calling
      const apiUrl = `${azureEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

      const requestBody: any = {
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      };

      // Add tools if ADO integration is available
      if (adoFunctionsTools && adoFunctionsTools.length > 0) {
        requestBody.tools = adoFunctionsTools;
        requestBody.tool_choice = 'auto'; // Let AI decide when to use functions
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": azureApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Azure AI Foundry API error:", errorText);
        return res.status(response.status).json({
          error: "Failed to get response from Azure AI Foundry",
          details: errorText
        });
      }

      let data = await response.json();
      let responseMessage = data.choices?.[0]?.message;

      // Track if work item was created successfully
      let workItemCreated = false;
      let createdWorkItemId: number | null = null;

      // Handle function calling if the AI wants to call functions
      if (responseMessage?.tool_calls && hasAdoIntegration && adoConfig) {
        console.log('[Chat API] AI requested function calls:', responseMessage.tool_calls.length);

        const { executeAdoFunction, formatAdoDataForChat } = await import('./ado-chatbot-functions');

        // Add the assistant's response with tool calls to the conversation
        chatMessages.push(responseMessage);

        // Execute each function call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[Chat API] Executing function: ${functionName}`);

          try {
            const functionResult = await executeAdoFunction(functionName, functionArgs, adoConfig);
            const formattedResult = formatAdoDataForChat(functionName, functionResult);

            // Track if create_work_item was called successfully
            if (functionName === 'create_work_item' && functionResult?.id) {
              workItemCreated = true;
              createdWorkItemId = functionResult.id;
              console.log('[Chat API] Work item created successfully:', functionResult.id);
            }

            // Add function result to messages
            chatMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: formattedResult
            });
          } catch (error) {
            console.error(`[Chat API] Error executing function ${functionName}:`, error);
            chatMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: `Error: ${error instanceof Error ? error.message : 'Function execution failed'}`
            });
          }
        }

        // Call the API again with the function results
        const followUpResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": azureApiKey,
          },
          body: JSON.stringify({
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.95,
            frequency_penalty: 0.3,
            presence_penalty: 0.3,
            tools: adoFunctionsTools,
            tool_choice: 'auto'
          }),
        });

        if (!followUpResponse.ok) {
          const errorText = await followUpResponse.text();
          console.error("Azure AI Foundry API error on follow-up:", errorText);
          return res.status(followUpResponse.status).json({
            error: "Failed to get follow-up response from Azure AI Foundry",
            details: errorText
          });
        }

        data = await followUpResponse.json();
        responseMessage = data.choices?.[0]?.message;
      }

      // Extract the final assistant's message
      const assistantMessage = responseMessage?.content;

      if (!assistantMessage) {
        return res.status(500).json({ error: "No response from Azure AI Foundry" });
      }

      // Log success tracking for debugging
      console.log('[Chat API] Final response - workItemCreated:', workItemCreated, 'workItemId:', createdWorkItemId);

      res.json({
        message: assistantMessage,
        usage: data.usage,
        adoIntegration: hasAdoIntegration,
        workItemCreated,
        workItemId: createdWorkItemId
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Azure DevOps Settings API Routes

  // Get ADO settings with PAT status
  app.get("/api/ado-settings", async (req, res) => {
    try {
      const settings = await storage.getAdoSettings();

      // If no settings exist, return PAT status
      if (!settings) {
        return res.json({
          patConfigured: false,
        });
      }

      // Include PAT configuration status (but never expose the actual encrypted token)
      const response = {
        id: settings.id,
        organizationUrl: settings.organizationUrl,
        projectName: settings.projectName,
        repository: settings.repository,
        branch: settings.branch,
        apiVersion: settings.apiVersion,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
        patConfigured: !!settings.patToken,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching ADO settings:", error);
      res.status(500).json({ error: "Failed to fetch ADO settings" });
    }
  });

  // Create ADO settings
  app.post("/api/ado-settings", async (req, res) => {
    try {
      const { organizationUrl, projectName, repository, branch, patToken, apiVersion } = req.body;

      if (!organizationUrl || !projectName || !apiVersion) {
        return res.status(400).json({ error: "Organization URL, Project Name, and API Version are required" });
      }

      const settings = await storage.createAdoSettings({
        organizationUrl,
        projectName,
        repository: repository || null,
        branch: branch || null,
        patToken: patToken || null,
        apiVersion,
      });

      // Sanitize response - never expose the encrypted PAT token
      const response = {
        id: settings.id,
        organizationUrl: settings.organizationUrl,
        projectName: settings.projectName,
        repository: settings.repository,
        branch: settings.branch,
        apiVersion: settings.apiVersion,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
        patConfigured: !!settings.patToken,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating ADO settings:", error);
      res.status(500).json({ error: "Failed to create ADO settings" });
    }
  });

  // Update ADO settings
  app.put("/api/ado-settings/:id", async (req, res) => {
    try {
      const { organizationUrl, projectName, repository, branch, patToken, apiVersion } = req.body;

      if (!organizationUrl || !projectName || !apiVersion) {
        return res.status(400).json({ error: "Organization URL, Project Name, and API Version are required" });
      }

      const updateData: any = {
        organizationUrl,
        projectName,
        apiVersion,
      };

      // Only update optional fields if provided
      if (repository !== undefined) {
        updateData.repository = repository || null;
      }
      if (branch !== undefined) {
        updateData.branch = branch || null;
      }
      if (patToken !== undefined) {
        updateData.patToken = patToken || null;
      }

      const settings = await storage.updateAdoSettings(req.params.id, updateData);

      // Sanitize response - never expose the encrypted PAT token
      const response = {
        id: settings.id,
        organizationUrl: settings.organizationUrl,
        projectName: settings.projectName,
        repository: settings.repository,
        branch: settings.branch,
        apiVersion: settings.apiVersion,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
        patConfigured: !!settings.patToken,
      };

      res.json(response);
    } catch (error) {
      console.error("Error updating ADO settings:", error);
      res.status(500).json({ error: "Failed to update ADO settings" });
    }
  });

  // Test ADO connection
  app.post("/api/ado-settings/test-connection", async (req, res) => {
    try {
      const settings = await storage.getAdoSettings();
      if (!settings) {
        return res.status(404).json({ error: "ADO settings not configured" });
      }

      const pat = process.env.ADO_PAT;
      if (!pat) {
        return res.status(400).json({ error: "ADO Personal Access Token not configured. Please contact your administrator." });
      }

      // Test connection by fetching projects
      const apiUrl = `${settings.organizationUrl}_apis/projects?api-version=${settings.apiVersion}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ADO connection test failed:", errorText);
        return res.status(response.status).json({
          error: "Failed to connect to Azure DevOps",
          details: errorText
        });
      }

      const data = await response.json();
      res.json({
        success: true,
        message: "Successfully connected to Azure DevOps",
        projectCount: data.count || 0
      });
    } catch (error) {
      console.error("Error testing ADO connection:", error);
      res.status(500).json({
        error: "Failed to test ADO connection",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all repositories from ADO
  app.get("/api/ado-settings/repositories", async (req, res) => {
    try {
      const settings = await storage.getAdoSettings();
      if (!settings) {
        return res.status(404).json({ error: "ADO settings not configured" });
      }

      const pat = process.env.ADO_PAT;
      if (!pat) {
        return res.status(400).json({ error: "ADO Personal Access Token not configured. Please contact your administrator." });
      }

      // Fetch repositories from specified project
      const apiUrl = `${settings.organizationUrl}_apis/git/repositories?api-version=${settings.apiVersion}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch ADO repositories:", errorText);
        return res.status(response.status).json({
          error: "Failed to fetch repositories from Azure DevOps",
          details: errorText
        });
      }

      const data = await response.json();

      // Filter repositories by project name if needed
      const repositories = data.value || [];
      const filteredRepos = repositories.filter((repo: any) =>
        repo.project?.name === settings.projectName
      );

      res.json({
        repositories: filteredRepos,
        count: filteredRepos.length
      });
    } catch (error) {
      console.error("Error fetching ADO repositories:", error);
      res.status(500).json({
        error: "Failed to fetch ADO repositories",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get ADO backlog items for context awareness (uses Conversational UI settings)
  app.get("/api/ado-settings/backlog", async (req, res) => {
    try {
      // Get client settings (artifact_organizations)
      const artifactOrgs = await storage.getArtifactOrganizations();
      const firstOrg = artifactOrgs[0];
      if (!firstOrg) {
        return res.status(404).json({ error: "Azure DevOps settings not configured. Please configure in Settings > Client Settings." });
      }

      // Decrypt the PAT from client settings
      if (!firstOrg.patToken) {
        return res.status(400).json({ error: "Azure DevOps Personal Access Token not configured. Please add it in Settings > Client Settings." });
      }

      const decryptedPAT = decryptPAT(firstOrg.patToken);
      if (!decryptedPAT) {
        return res.status(400).json({ error: "Failed to decrypt Azure DevOps PAT. Please reconfigure in Settings > Client Settings." });
      }

      // Extract organization name from URL
      const organization = firstOrg.organizationUrl.replace(/https?:\/\/dev\.azure\.com\//, '').replace(/\/$/, '');

      // Create Azure DevOps service instance using client settings
      const { AzureDevOpsService } = await import("./azure-devops-service");
      const azureService = new AzureDevOpsService({
        organization,
        project: firstOrg.projectName,
        pat: decryptedPAT
      });

      console.log(`[Conversational UI] Fetching backlog from ${organization}/${firstOrg.projectName}`);

      // Fetch all work items
      const workItems = await azureService.getWorkItems();

      // Transform work items into a simplified format for AI context
      const backlogContext = workItems.map((item: any) => ({
        id: item.id,
        type: item.fields["System.WorkItemType"],
        title: item.fields["System.Title"],
        state: item.fields["System.State"],
        priority: item.fields["Microsoft.VSTS.Common.Priority"],
        description: item.fields["System.Description"]?.substring(0, 200) || "", // Limit description length
      }));

      // Group by type for easier reference
      const grouped = {
        epics: backlogContext.filter((item: any) => item.type === "Epic"),
        features: backlogContext.filter((item: any) => item.type === "Feature"),
        userStories: backlogContext.filter((item: any) => item.type === "User Story"),
        tasks: backlogContext.filter((item: any) => item.type === "Task"),
        bugs: backlogContext.filter((item: any) => item.type === "Bug"),
      };

      console.log(`[Conversational UI] Successfully fetched ${backlogContext.length} work items`);

      res.json({
        success: true,
        backlog: backlogContext,
        grouped: grouped,
        totalCount: backlogContext.length,
        counts: {
          epics: grouped.epics.length,
          features: grouped.features.length,
          userStories: grouped.userStories.length,
          tasks: grouped.tasks.length,
          bugs: grouped.bugs.length,
        }
      });
    } catch (error) {
      console.error("[Conversational UI] Error fetching ADO backlog:", error);
      res.status(500).json({
        error: "Failed to fetch ADO backlog",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Artifact Organizations Routes

  // Get all artifact organizations
  app.get("/api/artifact-organizations", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const organizations = await storage.getArtifactOrganizations();

      // Don't send PAT tokens to the client, just send whether they're configured
      const sanitizedOrgs = organizations.map(org => ({
        id: org.id,
        projectName: org.projectName,
        organizationUrl: org.organizationUrl,
        patConfigured: !!org.patToken,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      }));

      res.json({ organizations: sanitizedOrgs });
    } catch (error) {
      console.error("Error fetching artifact organizations:", error);
      res.status(500).json({
        error: "Failed to fetch artifact organizations",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create a new artifact organization
  app.post("/api/artifact-organizations", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }
      // Try to get global ADO settings (projectName may be configured there)
      const settings = await storage.getAdoSettings();

      // Validate request body with Zod. projectName is optional here; we'll fall back to settings.projectName
      const createOrgSchema = z.object({
        projectName: z.string().min(1).optional(),
        organizationUrl: z.string().url("Must be a valid URL"),
        patToken: z.string().optional(),
      });

      // Use safeParse so we can fall back to global settings.projectName when the client doesn't send projectName
      const parsed = createOrgSchema.safeParse(req.body);
      let validatedData: any;
      if (!parsed.success) {
        // If projectName is the only error and settings has projectName, continue by using it
        const onlyProjectNameMissing = parsed.error.errors.every(e => e.path?.[0] === 'projectName');
        if (onlyProjectNameMissing && settings?.projectName) {
          validatedData = {
            projectName: settings.projectName,
            organizationUrl: req.body.organizationUrl,
            patToken: req.body.patToken,
          };
        } else {
          // Return validation errors to client
          return res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
        }
      } else {
        validatedData = parsed.data;
      }

      // Determine the project name to use: request -> global settings -> error
      const projectNameToUse = validatedData.projectName || settings?.projectName || null;
      if (!projectNameToUse) {
        return res.status(400).json({ error: "Project name is required. Set it in Settings > Hub Artifacts or include projectName in the request." });
      }

      const newOrg = await storage.createArtifactOrganization({
        projectName: projectNameToUse,
        organizationUrl: validatedData.organizationUrl,
        patToken: validatedData.patToken || null,
      });

      // Don't send PAT token back to client
      const sanitizedOrg = {
        id: newOrg.id,
        projectName: newOrg.projectName,
        organizationUrl: newOrg.organizationUrl,
        patConfigured: !!newOrg.patToken,
        createdAt: newOrg.createdAt,
        updatedAt: newOrg.updatedAt,
      };

      res.json({ organization: sanitizedOrg });
    } catch (error) {
      console.error("Error creating artifact organization:", error);
      res.status(500).json({
        error: "Failed to create artifact organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update artifact organization (including PAT)
  app.put("/api/artifact-organizations/:id", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const { id } = req.params;

      // Validate request body with Zod
      const updateOrgSchema = z.object({
        projectName: z.string().min(1).optional(),
        organizationUrl: z.string().url().optional(),
        patToken: z.string().optional(),
      });

      const validatedData = updateOrgSchema.parse(req.body);

      const updatedOrg = await storage.updateArtifactOrganization(id, validatedData);

      // Don't send PAT token back to client
      const sanitizedOrg = {
        id: updatedOrg.id,
        projectName: updatedOrg.projectName,
        organizationUrl: updatedOrg.organizationUrl,
        patConfigured: !!updatedOrg.patToken,
        createdAt: updatedOrg.createdAt,
        updatedAt: updatedOrg.updatedAt,
      };

      res.json({ organization: sanitizedOrg });
    } catch (error) {
      console.error("Error updating artifact organization:", error);
      res.status(500).json({
        error: "Failed to update artifact organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete artifact organization
  app.delete("/api/artifact-organizations/:id", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const { id } = req.params;
      await storage.deleteArtifactOrganization(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting artifact organization:", error);
      res.status(500).json({
        error: "Failed to delete artifact organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Golden Repo Organizations Routes

  // Get all golden repo organizations
  app.get("/api/golden-repo-organizations", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Golden repo organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const organizations = await storage.getGoldenRepoOrganizations();

      // Don't send PAT tokens to the client, just send whether they're configured
      const sanitizedOrgs = organizations.map(org => ({
        id: org.id,
        name: org.name,
        organizationUrl: org.organizationUrl,
        projectName: org.projectName,
        repositoryName: org.repositoryName,
        apiVersion: org.apiVersion,
        patConfigured: !!org.patToken,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      }));

      res.json({ organizations: sanitizedOrgs });
    } catch (error) {
      console.error("Error fetching golden repo organizations:", error);
      res.status(500).json({
        error: "Failed to fetch golden repo organizations",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create a new golden repo organization
  app.post("/api/golden-repo-organizations", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Golden repo organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const createOrgSchema = z.object({
        name: z.string().min(1, "Organization name is required"),
        organizationUrl: z.string().min(1, "Organization URL is required"),
        projectName: z.string().min(1, "Project name is required"),
        repositoryName: z.string().optional(),
        apiVersion: z.string().default("7.0"),
        patToken: z.string().optional(),
      });

      const validatedData = createOrgSchema.parse(req.body);
      const organization = await storage.createGoldenRepoOrganization(validatedData);

      // Don't send PAT token to the client
      const sanitizedOrg = {
        id: organization.id,
        name: organization.name,
        organizationUrl: organization.organizationUrl,
        projectName: organization.projectName,
        repositoryName: organization.repositoryName,
        apiVersion: organization.apiVersion,
        patConfigured: !!organization.patToken,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      };

      res.json({ organization: sanitizedOrg });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      console.error("Error creating golden repo organization:", error);
      res.status(500).json({
        error: "Failed to create golden repo organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update golden repo organization (including PAT)
  app.put("/api/golden-repo-organizations/:id", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Golden repo organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const { id } = req.params;

      const updateOrgSchema = z.object({
        name: z.string().optional(),
        organizationUrl: z.string().optional(),
        projectName: z.string().optional(),
        repositoryName: z.string().optional(),
        apiVersion: z.string().optional(),
        patToken: z.string().optional(),
      });

      const validatedData = updateOrgSchema.parse(req.body);
      const updatedOrg = await storage.updateGoldenRepoOrganization(id, validatedData);

      // Don't send PAT token to the client
      const sanitizedOrg = {
        id: updatedOrg.id,
        name: updatedOrg.name,
        organizationUrl: updatedOrg.organizationUrl,
        projectName: updatedOrg.projectName,
        repositoryName: updatedOrg.repositoryName,
        apiVersion: updatedOrg.apiVersion,
        patConfigured: !!updatedOrg.patToken,
        createdAt: updatedOrg.createdAt,
        updatedAt: updatedOrg.updatedAt,
      };

      res.json({ organization: sanitizedOrg });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      console.error("Error updating golden repo organization:", error);
      res.status(500).json({
        error: "Failed to update golden repo organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete golden repo organization
  app.delete("/api/golden-repo-organizations/:id", async (req, res) => {
    try {
      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Golden repo organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const { id } = req.params;
      await storage.deleteGoldenRepoOrganization(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting golden repo organization:", error);
      res.status(500).json({
        error: "Failed to delete golden repo organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Conversational UI Settings Routes


  // Wiki Documentation Routes

  // Generate Wiki Documentation
  app.post("/api/wiki/generate", async (req, res) => {
    try {
      const { requirement, personas, epics, features, userStories, projectName, sessionId } = req.body;

      if (!requirement) {
        return res.status(400).json({ error: "Requirement text is required" });
      }

      console.log("[Wiki API] Generating Wiki documentation...");

      const { generateWikiDocumentation } = await import("./ai-service");
      const result = await generateWikiDocumentation({
        requirement,
        personas,
        epics,
        features,
        userStories,
        projectName: projectName || "Project",
      });

      // Save wiki pages to database
      const savedPages = [];
      for (const page of result.pages) {
        const savedPage = await storage.createWikiPage({
          sessionId,
          projectId: null,
          pageType: page.pageType,
          title: page.title,
          content: page.content,
          order: page.order,
        });
        savedPages.push(savedPage);
      }

      console.log("[Wiki API] Generated and saved", savedPages.length, "Wiki pages");

      res.json({
        success: true,
        pages: savedPages,
        count: savedPages.length
      });
    } catch (error) {
      console.error("[Wiki API] Error generating Wiki documentation:", error);
      res.status(500).json({
        error: "Failed to generate Wiki documentation",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get Wiki pages for a session
  app.get("/api/wiki/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const pages = await storage.getWikiPagesBySession(sessionId);

      res.json({ pages });
    } catch (error) {
      console.error("[Wiki API] Error fetching Wiki pages:", error);
      res.status(500).json({
        error: "Failed to fetch Wiki pages",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete Wiki page
  app.delete("/api/wiki/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      await storage.deleteWikiPage(pageId);
      res.json({ success: true });
    } catch (error) {
      console.error("[Wiki API] Error deleting Wiki page:", error);
      res.status(500).json({
        error: "Failed to delete Wiki page",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Convert Wiki page to Word (.docx) format and download
  app.post("/api/wiki/download-docx", async (req, res) => {
    try {
      const { content, title } = req.body;

      if (!content || !title) {
        return res.status(400).json({ error: "Content and title are required" });
      }

      // Convert markdown to HTML using a simple markdown parser
      // For now, we'll create a basic HTML structure
      // You might want to use a markdown parser library for better conversion
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
    h1 { font-size: 16pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; }
    h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 10pt; }
    h3 { font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 8pt; }
    p { margin-bottom: 10pt; }
    ul, ol { margin-left: 20pt; margin-bottom: 10pt; }
    code { font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 2px 4px; }
    pre { font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 10px; margin-bottom: 10pt; }
  </style>
</head>
<body>
${content.replace(/\n/g, '<br/>')}
</body>
</html>`;

      // Import the html-to-docx package dynamically
      const { default: HTMLtoDOCX } = await import('html-to-docx');

      // Convert HTML to DOCX
      const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      // Set headers for file download
      const filename = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', docxBuffer.length);

      // Send the DOCX file
      res.send(docxBuffer);

      console.log(`[Wiki API] Successfully converted "${title}" to DOCX`);
    } catch (error) {
      console.error("[Wiki API] Error converting to DOCX:", error);
      res.status(500).json({
        error: "Failed to convert Wiki page to DOCX",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get detailed repositories with commits and contributors for Golden Repos page
  app.get("/api/ado/golden-repositories", async (req, res) => {
    try {
      // Fetch all golden repo organizations
      const goldenRepoOrgs = await storage.getGoldenRepoOrganizations();

      if (!goldenRepoOrgs || goldenRepoOrgs.length === 0) {
        return res.status(404).json({
          error: "No Golden Repo organizations configured. Please configure in Settings page.",
          repositories: [],
          count: 0
        });
      }

      // Aggregate repositories from all organizations
      const allRepositories: any[] = [];

      // Hardcoded PAT token for golden repo navigation
      const HARDCODED_PAT = "FvEA7fSE7YykQKfNEXb4yFEAE8sAFpK8T1j2CXNTdkyuxdDZUA56JQQJ99BJACAAAAAao531AAASAZDO4PZm";

      // Fetch repositories from each organization
      for (const org of goldenRepoOrgs) {
        try {
          // Use hardcoded PAT token instead of decrypting from database
          const decryptedPat = HARDCODED_PAT;
          if (!decryptedPat) {
            console.warn(`[Golden Repos] Skipping ${org.name} - PAT token not configured`);
            continue;
          }

          const authHeader = `Basic ${Buffer.from(`:${decryptedPat}`).toString("base64")}`;

          // Fetch repositories from this organization
          const reposUrl = `${org.organizationUrl}/_apis/git/repositories?api-version=${org.apiVersion}`;
          const reposResponse = await fetch(reposUrl, {
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
          });

          if (!reposResponse.ok) {
            console.warn(`[Golden Repos] Failed to fetch repositories from ${org.name}:`, await reposResponse.text());
            continue;
          }

          const reposData = await reposResponse.json();
          const repositories = (reposData.value || []).filter((repo: any) =>
            repo.project?.name === org.projectName
          );

          // Fetch detailed information for each repository from this org
          const detailedRepos = await Promise.all(
            repositories.map(async (repo: any) => {
              try {
                // Fetch recent commits
                const commitsUrl = `${org.organizationUrl}/${org.projectName}/_apis/git/repositories/${repo.id}/commits?$top=10&api-version=${org.apiVersion}`;
                const commitsResponse = await fetch(commitsUrl, {
                  headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json",
                  },
                });

                let commits: any[] = [];
                let contributors = new Set<string>();
                let commitCount = 0;

                if (commitsResponse.ok) {
                  const commitsData = await commitsResponse.json();
                  commits = commitsData.value || [];
                  commitCount = commitsData.count || commits.length;

                  // Extract unique contributors
                  commits.forEach((commit: any) => {
                    if (commit.author?.name) {
                      contributors.add(commit.author.name);
                    }
                  });
                }

                return {
                  id: repo.id,
                  name: repo.name,
                  organizationName: org.name,
                  description: repo.project?.description || "",
                  webUrl: repo.webUrl,
                  defaultBranch: repo.defaultBranch?.replace('refs/heads/', '') || 'main',
                  size: repo.size || 0,
                  commitCount,
                  contributors: Array.from(contributors),
                  contributorCount: contributors.size,
                  lastCommit: commits.length > 0 ? {
                    author: commits[0].author?.name || 'Unknown',
                    message: commits[0].comment || '',
                    date: commits[0].author?.date || new Date().toISOString(),
                  } : null,
                  recentCommits: commits.slice(0, 5).map((commit: any) => ({
                    author: commit.author?.name || 'Unknown',
                    message: commit.comment || '',
                    date: commit.author?.date || new Date().toISOString(),
                    commitId: commit.commitId,
                  })),
                };
              } catch (error) {
                console.error(`[Golden Repos] Error fetching details for repo ${repo.name} from ${org.name}:`, error);
                return {
                  id: repo.id,
                  name: repo.name,
                  organizationName: org.name,
                  description: repo.project?.description || "",
                  webUrl: repo.webUrl,
                  defaultBranch: repo.defaultBranch?.replace('refs/heads/', '') || 'main',
                  size: repo.size || 0,
                  commitCount: 0,
                  contributors: [],
                  contributorCount: 0,
                  lastCommit: null,
                  recentCommits: [],
                };
              }
            })
          );

          allRepositories.push(...detailedRepos);
          console.log(`[Golden Repos] Loaded ${detailedRepos.length} repositories from ${org.name}`);
        } catch (error) {
          console.error(`[Golden Repos] Error processing organization ${org.name}:`, error);
        }
      }

      res.json({
        repositories: allRepositories,
        count: allRepositories.length
      });
    } catch (error) {
      console.error("[Golden Repos] Error fetching golden repositories:", error);
      res.status(500).json({
        error: "Failed to fetch golden repositories",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get repository file tree
  app.get("/api/ado/repository/:repositoryId/tree", async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const { path = "/", branch } = req.query;

      // Find which organization owns this repository
      const repoInfo = await findRepositoryOrganization(repositoryId);
      if (!repoInfo) {
        return res.status(404).json({ error: "Repository not found in any configured organization" });
      }

      const { organization: org, repository: repoData, authHeader } = repoInfo;

      // Check if repository has any branches
      if (!repoData.defaultBranch && !branch) {
        // Repository is empty (no branches)
        console.log(`[ADO Tree] Repository ${repositoryId} has no branches (empty repository)`);
        return res.json({
          tree: [],
          branch: null,
          isEmpty: true,
          message: "This repository is empty and has no branches"
        });
      }

      // Use branch from query or repository default
      const targetBranch = (branch as string) || repoData.defaultBranch?.replace('refs/heads/', '') || 'main';

      // Fetch items recursively
      const itemsUrl = `${org.organizationUrl}/${org.projectName}/_apis/git/repositories/${repositoryId}/items?recursionLevel=Full&includeContentMetadata=true&versionDescriptor.version=${targetBranch}&api-version=${org.apiVersion}`;
      const itemsResponse = await fetch(itemsUrl, {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
      });

      if (!itemsResponse.ok) {
        const errorText = await itemsResponse.text();
        console.error("Failed to fetch repository items:", errorText);

        // Check if error is due to missing branches
        if (errorText.includes("Cannot find any branches") || errorText.includes("GitItemNotFoundException")) {
          return res.json({
            tree: [],
            branch: targetBranch,
            isEmpty: true,
            message: "This repository is empty and has no branches"
          });
        }

        return res.status(itemsResponse.status).json({
          error: "Failed to fetch repository items"
        });
      }

      const itemsData = await itemsResponse.json();
      const items = itemsData.value || [];

      // Build hierarchical tree structure
      const buildFileTree = (items: any[]) => {
        const pathMap = new Map();

        // First pass: create all nodes
        items.forEach((item: any) => {
          const pathParts = item.path.split('/').filter((part: string) => part !== '');
          const sizeValue = item.isFolder ? undefined : (item.size ?? item.contentMetadata?.size ?? 0);
          const node = {
            name: pathParts[pathParts.length - 1] || item.path,
            path: item.path,
            type: item.isFolder ? 'folder' : 'file',
            // Hide misleading zeros; only emit size when known and > 0
            size: item.isFolder ? undefined : (typeof sizeValue === "number" && sizeValue > 0 ? sizeValue : undefined),
            commitId: item.objectId,
            children: item.isFolder ? [] : undefined,
          };

          pathMap.set(item.path, node);
        });

        const tree: any[] = [];

        // Second pass: build hierarchy
        items.forEach((item: any) => {
          const node = pathMap.get(item.path);
          const pathParts = item.path.split('/').filter((part: string) => part !== '');

          if (pathParts.length === 1) {
            tree.push(node);
          } else {
            const parentPathParts = pathParts.slice(0, -1);
            const parentPath = '/' + parentPathParts.join('/');
            const parent = pathMap.get(parentPath);

            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        });

        // Sort folders first, then files
        const sortItems = (items: any[]) => {
          items.sort((a: any, b: any) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
          });

          items.forEach((item: any) => {
            if (item.children) {
              sortItems(item.children);
            }
          });
        };

        sortItems(tree);
        return tree;
      };

      const tree = buildFileTree(items);

      res.json({
        tree,
        branch: targetBranch,
        itemCount: items.length
      });
    } catch (error) {
      console.error("Error fetching repository tree:", error);
      res.status(500).json({
        error: "Failed to fetch repository tree",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get file content from repository
  app.get("/api/ado/repository/:repositoryId/file", async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const { path, branch } = req.query;

      if (!path) {
        return res.status(400).json({ error: "File path is required" });
      }

      // Find which organization owns this repository
      const repoInfo = await findRepositoryOrganization(repositoryId);
      if (!repoInfo) {
        return res.status(404).json({ error: "Repository not found in any configured organization" });
      }

      const { organization: org, repository: repoData, authHeader } = repoInfo;

      // Use branch from query or repository default
      const targetBranch = (branch as string) || repoData.defaultBranch?.replace('refs/heads/', '') || 'main';

      // Fetch file content - Azure DevOps returns JSON with content field
      const fileUrl = `${org.organizationUrl}/${org.projectName}/_apis/git/repositories/${repositoryId}/items?path=${encodeURIComponent(path as string)}&includeContent=true&versionDescriptor.version=${targetBranch}&api-version=${org.apiVersion}`;
      console.log(`[ADO File] Fetching file: ${path} from ${fileUrl}`);

      const fileResponse = await fetch(fileUrl, {
        headers: {
          "Authorization": authHeader,
          "Accept": "application/json",
        },
      });

      if (!fileResponse.ok) {
        if (fileResponse.status === 404) {
          return res.status(404).json({ error: "File not found" });
        }
        const errorText = await fileResponse.text();
        console.error("Failed to fetch file content:", errorText);
        return res.status(fileResponse.status).json({
          error: "Failed to fetch file content"
        });
      }

      // Check content type to ensure we're getting JSON
      const contentType = fileResponse.headers.get("content-type");
      console.log(`[ADO File] Response content-type: ${contentType}`);

      // Get response text first (can only read body once)
      const responseText = await fileResponse.text();
      console.log(`[ADO File] Response length: ${responseText.length}, first 100 chars:`, responseText.substring(0, 100));

      let fileData: any;

      // Try to parse as JSON
      try {
        fileData = JSON.parse(responseText);
        console.log("[ADO File] Successfully parsed JSON response");
      } catch (parseError) {
        console.error("[ADO File] Failed to parse response as JSON, treating as raw content:", parseError);
        // If JSON parse fails, the response is raw content
        return res.json({
          content: responseText,
          path: path as string,
          size: responseText.length,
          commitId: null,
        });
      }

      const contentOut = fileData.content ?? fileData;
      // Prefer accurate byte size: derive from content when available, fallback to metadata
      const derivedSize = typeof contentOut === "string"
        ? Buffer.byteLength(contentOut, "utf8")
        : (fileData.size ?? fileData.contentMetadata?.size ?? 0);

      res.json({
        content: contentOut,
        path: fileData.path || path,
        size: derivedSize,
        commitId: fileData.objectId || null,
      });
    } catch (error) {
      console.error("Error fetching file content:", error);
      res.status(500).json({
        error: "Failed to fetch file content",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Download repository as ZIP
  app.get("/api/ado/repository/:repositoryId/download", async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const { branch } = req.query;

      // Find which organization owns this repository
      const repoInfo = await findRepositoryOrganization(repositoryId);
      if (!repoInfo) {
        return res.status(404).json({ error: "Repository not found in any configured organization" });
      }

      const { organization: org, repository: repoData, authHeader } = repoInfo;

      // Use branch from query or repository default
      const targetBranch = (branch as string) || repoData.defaultBranch?.replace('refs/heads/', '') || 'main';
      const repoName = repoData.name || 'repository';

      // Download repository as ZIP using archive endpoint
      // Azure DevOps archive API returns ZIP directly without redirects
      const zipUrl = `${org.organizationUrl}/${org.projectName}/_apis/git/repositories/${repositoryId}/items?path=/&versionDescriptor.version=${targetBranch}&$format=zip&api-version=${org.apiVersion}`;
      console.log(`[ADO Download] Downloading repository: ${repoName} (${targetBranch}) from ${zipUrl}`);

      const zipResponse = await fetch(zipUrl, {
        headers: {
          "Authorization": authHeader,
          "Accept": "application/zip",
        },
        redirect: "follow", // Explicitly follow redirects
      });

      if (!zipResponse.ok) {
        const errorText = await zipResponse.text();
        console.error("Failed to download repository:", errorText);
        return res.status(zipResponse.status).json({
          error: "Failed to download repository"
        });
      }

      // Sanitize filename and exclude branch suffix per requirement
      const sanitizedRepoName = repoName.replace(/[\/\\:*?"<>|]/g, '-');
      const fileName = `${sanitizedRepoName}.zip`;

      // Stream the ZIP file directly to the client without buffering
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Get content length if available
      const contentLength = zipResponse.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      console.log(`[ADO Download] Streaming ${fileName} to client`);

      // Stream the response body directly to the client without buffering
      if (!zipResponse.body) {
        return res.status(500).json({ error: "Response body is null" });
      }

      // Use the web streams API reader to stream chunks
      const reader = zipResponse.body.getReader();
      let headersSent = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }

          headersSent = true;

          // Write chunk directly to response without accumulating
          if (!res.write(Buffer.from(value))) {
            // If write buffer is full, wait for drain event
            await new Promise(resolve => res.once('drain', resolve));
          }
        }
        console.log(`[ADO Download] Successfully streamed ${fileName}`);
      } catch (streamError) {
        console.error("[ADO Download] Streaming error:", streamError);

        // Cleanup: cancel the upstream reader
        try {
          await reader.cancel();
        } catch (cancelError) {
          console.error("[ADO Download] Error canceling reader:", cancelError);
        }

        // If headers were already sent, we can't send a JSON error response
        if (headersSent) {
          console.error("[ADO Download] Headers already sent, destroying response");
          res.destroy(streamError instanceof Error ? streamError : new Error(String(streamError)));
        } else {
          // Headers not sent yet, we can still send an error response
          res.status(500).json({
            error: "Failed to stream repository",
            details: streamError instanceof Error ? streamError.message : String(streamError)
          });
        }
        return;
      }
    } catch (error) {
      console.error("Error downloading repository:", error);

      // Only send JSON error if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to download repository",
          details: error instanceof Error ? error.message : String(error)
        });
      } else {
        console.error("[ADO Download] Headers already sent, cannot send JSON error");
        res.destroy(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  // Test Azure DevOps Connection
  app.post("/api/ado/test-connection", async (req, res) => {
    try {
      const { organizationUrl, projectName, pat } = req.body;

      if (!organizationUrl || !projectName || !pat) {
        return res.status(400).json({ error: "Organization URL, project name, and PAT are required" });
      }

      // Normalize organization URL - ensure it ends with a slash
      let normalizedOrgUrl = organizationUrl.trim();
      if (!normalizedOrgUrl.endsWith("/")) {
        normalizedOrgUrl += "/";
      }

      // Validate PAT format (Azure DevOps PATs are typically 52 characters, but can vary)
      const trimmedPat = pat.trim();
      if (trimmedPat.length === 0) {
        return res.status(400).json({ error: "PAT cannot be empty" });
      }

      const authHeader = `Basic ${Buffer.from(`:${trimmedPat}`).toString("base64")}`;

      // Test connection by getting project details
      const projectUrl = `${normalizedOrgUrl}_apis/projects/${encodeURIComponent(projectName)}?api-version=7.0`;

      console.log("[Test Connection] Testing connection:", {
        organizationUrl: normalizedOrgUrl,
        projectName,
        patLength: trimmedPat.length,
      });

      const response = await fetch(projectUrl, {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorDetails: any = {};
        try {
          const errorText = await response.text();
          try {
            errorDetails = JSON.parse(errorText);
          } catch {
            errorDetails = { message: errorText };
          }
        } catch {
          errorDetails = { message: "Unknown error" };
        }

        console.error("[Test Connection] Failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
        });

        if (response.status === 404) {
          return res.status(404).json({
            error: "Project not found or you don't have access",
            details: errorDetails.message || `Project "${projectName}" was not found in organization ${normalizedOrgUrl}`
          });
        }
        if (response.status === 401) {
          return res.status(401).json({
            error: "Authentication failed. The PAT is invalid, expired, or doesn't have the required permissions.",
            details: errorDetails.message || "Please verify: 1) PAT is correct and not expired, 2) PAT has Code (Read) permissions, 3) PAT has access to the organization"
          });
        }
        if (response.status === 403) {
          return res.status(403).json({
            error: "Access denied. The PAT doesn't have sufficient permissions.",
            details: errorDetails.message || "Please ensure the PAT has Code (Read) permissions and access to the project"
          });
        }
        return res.status(response.status).json({
          error: `Failed to connect to Azure DevOps: ${response.statusText}`,
          details: errorDetails.message || "Please check your organization URL, project name, and PAT"
        });
      }

      const projectData = await response.json();

      console.log("[Test Connection] Success:", {
        projectId: projectData.id,
        projectName: projectData.name,
      });

      res.json({
        success: true,
        message: "Connection successful",
        project: {
          id: projectData.id,
          name: projectData.name,
          description: projectData.description,
        },
      });
    } catch (error) {
      console.error("[Test Connection] Error:", error);
      res.status(500).json({
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Initialize empty repository with starter content
  app.post("/api/ado/repository/:repositoryId/initialize", async (req, res) => {
    try {
      const { repositoryId } = req.params;

      // Find which organization owns this repository
      const repoInfo = await findRepositoryOrganization(repositoryId);
      if (!repoInfo) {
        return res.status(404).json({ error: "Repository not found in any configured organization" });
      }

      const { organization: org, repository: repo, authHeader } = repoInfo;

      // Create initial commit with README.md
      const readmeContent = `# ${repo.name}\n\nWelcome to ${repo.name}!\n\nThis is a starter repository created by DevPlatform.\n\n## Getting Started\n\nAdd your project files and start building!\n`;
      const readmeBase64 = Buffer.from(readmeContent).toString("base64");

      // Create a new branch ref (main branch)
      const pushUrl = `${org.organizationUrl}/_apis/git/repositories/${repositoryId}/pushes?api-version=${org.apiVersion}`;

      const pushPayload = {
        refUpdates: [
          {
            name: "refs/heads/main",
            oldObjectId: "0000000000000000000000000000000000000000"
          }
        ],
        commits: [
          {
            comment: "Initial commit - Add README.md",
            changes: [
              {
                changeType: "add",
                item: {
                  path: "/README.md"
                },
                newContent: {
                  content: readmeBase64,
                  contentType: "base64encoded"
                }
              }
            ]
          }
        ]
      };

      console.log('[ADO Init] Initializing repository:', repo.name);
      const pushResponse = await fetch(pushUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pushPayload),
      });

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        console.error('[ADO Init] Failed to initialize repository:', errorText);
        return res.status(pushResponse.status).json({ error: "Failed to initialize repository", details: errorText });
      }

      const pushResult = await pushResponse.json();
      console.log('[ADO Init] Successfully initialized repository:', repo.name);

      res.json({
        success: true,
        message: `Repository ${repo.name} initialized successfully`,
        commit: pushResult.commits?.[0],
      });
    } catch (error) {
      console.error("Initialize repository error:", error);
      res.status(500).json({ error: "Failed to initialize repository" });
    }
  });

  // Fork Repository to Azure DevOps
  app.post("/api/ado/fork-repository", async (req, res) => {
    try {
      const {
        sourceRepoId,
        targetOrgUrl,
        targetProjectName,
        newRepoName,
        description,
        pat,
        branch,
        includePermissions,
        forkMode,
        sourcePat,
      } = req.body;

      if (!sourceRepoId || !targetOrgUrl || !targetProjectName || !newRepoName || !pat) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const authHeader = `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;

      // Normalize target organization URL to ensure it ends with a slash
      let normalizedTargetOrgUrl = targetOrgUrl.trim();
      if (!normalizedTargetOrgUrl.endsWith("/")) {
        normalizedTargetOrgUrl += "/";
      }

      // Find which organization owns the source repository
      const sourceRepoInfo = await findRepositoryOrganization(sourceRepoId);
      if (!sourceRepoInfo) {
        return res.status(404).json({ error: "Source repository not found in any configured organization" });
      }

      const { repository: sourceRepo } = sourceRepoInfo;

      // Get target project ID
      const targetProjectUrl = `${normalizedTargetOrgUrl}_apis/projects/${encodeURIComponent(targetProjectName)}?api-version=7.0`;
      const targetProjectResponse = await fetch(targetProjectUrl, {
        headers: { "Authorization": authHeader },
      });

      if (!targetProjectResponse.ok) {
        return res.status(404).json({ error: "Target project not found or you don't have access" });
      }

      const targetProject = await targetProjectResponse.json();

      // Cross-organization path: create repo then mirror via git clone/push
      if (forkMode === "cross-org") {
        try {
          // Use HARDCODED_PAT for source access
          const effectiveSourcePat = HARDCODED_PAT;
          if (!effectiveSourcePat) {
            return res.status(500).json({ error: "Server not configured with HARDCODED_PAT for cross-organization forking" });
          }

          // 1) Create empty repository in target org/project
          const createRepoUrl = `${normalizedTargetOrgUrl}_apis/git/repositories?api-version=7.1`;
          const createRepoBody = {
            name: newRepoName,
            project: { id: targetProject.id },
          };

          console.log("[Cross-Org Fork] Creating target repository:", {
            url: createRepoUrl,
            name: newRepoName,
            project: targetProjectName,
          });

          const createRepoResp = await fetch(createRepoUrl, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createRepoBody),
          });

          if (!createRepoResp.ok) {
            const errorText = await createRepoResp.text();
            console.error("[Cross-Org Fork] Failed to create target repository:", errorText);
            if (createRepoResp.status === 409) {
              return res.status(409).json({ error: "Repository with this name already exists in the target project" });
            }
            if (createRepoResp.status === 401 || createRepoResp.status === 403) {
              return res.status(403).json({ error: "Insufficient permissions to create repository in target organization" });
            }
            return res.status(createRepoResp.status).json({ error: `Failed to create target repository: ${createRepoResp.statusText}` });
          }

          const createdRepo = await createRepoResp.json();
          console.log("[Cross-Org Fork] Target repository created:", createdRepo.id);

          // 2) Construct source repository Git remote URL
          // Extract org name from source organization URL
          const sourceOrg = sourceRepoInfo.organization;
          let sourceOrgName = "";
          if (sourceOrg.organizationUrl.includes("dev.azure.com")) {
            const match = sourceOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
            sourceOrgName = match ? match[1] : "";
          } else if (sourceOrg.organizationUrl.includes("visualstudio.com")) {
            const match = sourceOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
            sourceOrgName = match ? match[1] : "";
          }

          // Build Git remote URL with embedded credentials for cross-org access
          // Format: https://:{pat}@dev.azure.com/{org}/{project}/_git/{repo}
          const sourceGitUrl = sourceRepo.remoteUrl ||
            `https://dev.azure.com/${sourceOrgName}/${sourceOrg.projectName}/_git/${sourceRepo.name}`;

          // Embed PAT in URL for authentication (Azure DevOps import requires this for cross-org)
          // Some Azure DevOps clone URLs include '{org}@dev.azure.com' as username; strip any existing username first.
          const encodedPat = encodeURIComponent(effectiveSourcePat);
          const sourceGitUrlNoCreds = sourceGitUrl.replace(/^https:\/\/[^@]+@/, "https://");
          const sourceGitUrlWithAuth = sourceGitUrlNoCreds.replace(/^https:\/\//, `https://pat:${encodedPat}@`);

          console.log("[Cross-Org Fork] Source Git URL (with auth):", sourceGitUrlWithAuth.replace(encodedPat, "***REDACTED***"));

          // 3) Mirror clone from source and push to target (replace import flow)
          // Build unauthenticated target Git URL and then embed PAT for push
          const targetGitUrl = `${normalizedTargetOrgUrl}${encodeURIComponent(targetProject.name)}/_git/${encodeURIComponent(createdRepo.name || newRepoName)}`;

          const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "devx-fork-"));
          const bareDir = path.join(tmpRoot, `${createdRepo.name || newRepoName}.git`);

          const authedSourceUrl = sourceGitUrlWithAuth;
          const authedTargetUrl = targetGitUrl.replace(/^https:\/\//, `https://pat:${encodeURIComponent(pat.trim())}@`);

          console.log("[Cross-Org Fork] Starting mirror clone to temp:", bareDir);
          try {
            await exec(`git clone --mirror "${authedSourceUrl}" "${bareDir}"`);
          } catch (e: any) {
            try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch { }
            try {
              await fetch(`${normalizedTargetOrgUrl}_apis/git/repositories/${createdRepo.id}?api-version=7.1`, {
                method: "DELETE",
                headers: { "Authorization": authHeader },
              });
              console.log("[Cross-Org Fork] Cleaned up created repository");
            } catch { }
            const stderr = e?.stderr || e?.message || "git clone failed";
            return res.status(400).json({ error: "Failed to clone source repository (mirror)", details: stderr });
          }

          console.log("[Cross-Org Fork] Pushing mirror to target repo");
          try {
            await exec(`git -C "${bareDir}" push --mirror "${authedTargetUrl}"`);
          } catch (e: any) {
            try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch { }
            try {
              await fetch(`${normalizedTargetOrgUrl}_apis/git/repositories/${createdRepo.id}?api-version=7.1`, {
                method: "DELETE",
                headers: { "Authorization": authHeader },
              });
              console.log("[Cross-Org Fork] Cleaned up created repository");
            } catch { }
            const stderr = e?.stderr || e?.message || "git push failed";
            return res.status(400).json({ error: "Failed to push mirror to target repository", details: stderr });
          }

          // Cleanup temp
          try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch { }

          // Optionally update repository description if provided
          if (description) {
            const updateUrl = `${normalizedTargetOrgUrl}${encodeURIComponent(targetProject.name)}/_apis/git/repositories/${createdRepo.id}?api-version=7.0`;
            await fetch(updateUrl, {
              method: "PATCH",
              headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name: newRepoName, description }),
            }).catch(err => {
              console.warn("[Cross-Org Fork] Failed to update description:", err);
            });
          }

          return res.json({
            success: true,
            message: "Cross-organization fork completed via git mirror",
            repository: {
              id: createdRepo.id,
              name: createdRepo.name,
              url: createdRepo.webUrl || createdRepo.remoteUrl,
              isFork: false,
            },
          });
        } catch (err) {
          console.error("[Cross-Org Fork] Error:", err);
          return res.status(500).json({ error: `Failed to perform cross-organization fork: ${err instanceof Error ? err.message : "Unknown error"}` });
        }
      }

      // Create fork request body
      const forkBody: any = {
        name: newRepoName,
        project: {
          id: targetProject.id,
        },
        parentRepository: {
          id: sourceRepo.id,
          project: {
            id: sourceRepo.project.id,
          },
        },
      };

      // Build fork URL with optional branch parameter
      let forkUrl = `${normalizedTargetOrgUrl}_apis/git/repositories?api-version=7.1`;
      if (branch) {
        forkUrl += `&sourceRef=refs/heads/${branch}`;
      }

      console.log("[Fork Repository] Forking repository:", {
        source: sourceRepo.name,
        target: newRepoName,
        project: targetProjectName,
        branch: branch || "default",
      });

      // Create the fork
      const forkResponse = await fetch(forkUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forkBody),
      });

      if (!forkResponse.ok) {
        const errorText = await forkResponse.text();
        console.error("[Fork Repository] Failed to fork:", errorText);

        if (forkResponse.status === 409) {
          return res.status(409).json({ error: "Repository with this name already exists in the target project" });
        }
        if (forkResponse.status === 401 || forkResponse.status === 403) {
          return res.status(403).json({ error: "Insufficient permissions. Ensure your PAT has Code (Read & Write) permissions" });
        }

        return res.status(forkResponse.status).json({
          error: `Failed to fork repository: ${forkResponse.statusText}`
        });
      }

      const forkedRepo = await forkResponse.json();

      // Optionally update repository description if provided
      if (description) {
        const updateUrl = `${normalizedTargetOrgUrl}${encodeURIComponent(targetProject.name)}/_apis/git/repositories/${forkedRepo.id}?api-version=7.0`;
        await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newRepoName, description }),
        }).catch(err => {
          console.warn("[Fork Repository] Failed to update description:", err);
        });
      }

      console.log("[Fork Repository] Successfully forked repository:", forkedRepo.name);

      res.json({
        success: true,
        message: "Repository forked successfully",
        repository: {
          id: forkedRepo.id,
          name: forkedRepo.name,
          url: forkedRepo.webUrl || forkedRepo.remoteUrl,
          isFork: forkedRepo.isFork,
        },
      });
    } catch (error) {
      console.error("[Fork Repository] Error:", error);
      res.status(500).json({ error: "Failed to fork repository" });
    }
  });

  // Hub API Routes - Artifacts

  // Get all projects from Azure DevOps organizations (using artifact organizations)
  app.get("/api/hub/artifacts/projects", async (req, res) => {
    try {
      console.log("[Hub Artifacts] Fetching projects from artifact organizations...");

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();
      console.log(`[Hub Artifacts] Found ${artifactOrgs.length} artifact organizations`);

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Filter organizations that have PAT configured
      const orgsWithPAT = artifactOrgs.filter(org => org.patToken);
      console.log(`[Hub Artifacts] ${orgsWithPAT.length} organizations have PAT tokens configured`);

      if (orgsWithPAT.length === 0) {
        return res.status(400).json({ error: "No artifact organizations have PAT tokens configured. Please configure PAT tokens in Settings > Hub Artifacts." });
      }

      const allProjects: any[] = [];
      const errors: string[] = [];

      // Fetch projects from each organization
      for (const org of orgsWithPAT) {
        try {
          console.log(`[Hub Artifacts] Processing organization: ${org.organizationUrl}, Project: ${org.projectName}`);

          // Decrypt PAT token
          const pat = decryptPAT(org.patToken);
          if (!pat) {
            const errorMsg = `Skipping organization ${org.organizationUrl} - failed to decrypt PAT`;
            console.warn(`[Hub Artifacts] ${errorMsg}`);
            errors.push(errorMsg);
            continue;
          }

          // Extract organization name from URL
          // Support both https://dev.azure.com/{org} and https://{org}.visualstudio.com formats
          let organization = '';
          if (org.organizationUrl && org.organizationUrl.includes('dev.azure.com')) {
            const orgMatch = org.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
            organization = orgMatch ? orgMatch[1].trim() : '';
          } else if (org.organizationUrl && org.organizationUrl.includes('visualstudio.com')) {
            const orgMatch = org.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
            organization = orgMatch ? orgMatch[1].trim() : '';
          }

          if (!organization) {
            const errorMsg = `Invalid organization URL format: ${org.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`;
            console.warn(`[Hub Artifacts] ${errorMsg}`);
            errors.push(errorMsg);
            continue;
          }

          console.log(`[Hub Artifacts] Extracted organization name: ${organization}`);

          const adoService = new AzureDevOpsService({
            organization,
            project: org.projectName,
            pat
          });

          console.log(`[Hub Artifacts] Fetching projects from Azure DevOps for organization: ${organization}`);
          const projects = await adoService.getProjects();
          console.log(`[Hub Artifacts] Successfully fetched ${projects.length} projects from ${organization}`);

          // Transform Azure DevOps projects to our format
          const transformedProjects = projects.map((project: any) => ({
            id: project.id,
            name: project.name,
            description: project.description || '',
            organization: organization,
            organizationUrl: org.organizationUrl,
            artifactOrgId: org.id
          }));

          allProjects.push(...transformedProjects);
        } catch (error) {
          const errorMsg = `Error fetching projects from organization ${org.organizationUrl}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`[Hub Artifacts] ${errorMsg}`);
          errors.push(errorMsg);
          // Continue with other organizations even if one fails
        }
      }

      if (allProjects.length === 0) {
        const errorDetails = errors.length > 0 ? `\n\nErrors encountered:\n${errors.join('\n')}` : '';
        return res.status(400).json({
          error: `Failed to fetch projects from any configured organization. Please check that:\n1. Organization URLs are in the correct format (https://dev.azure.com/{org} or https://{org}.visualstudio.com)\n2. PAT tokens are valid and have the required permissions\n3. Organizations are accessible${errorDetails}`
        });
      }

      console.log(`[Hub Artifacts] Successfully fetched ${allProjects.length} total projects from ${orgsWithPAT.length} organizations`);

      res.json(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: "Failed to fetch projects from Azure DevOps",
        details: errorMessage
      });
    }
  });

  // Get work items for a project (Artifacts)
  app.get("/api/hub/artifacts/:projectName/work-items", async (req, res) => {
    try {
      const { projectName } = req.params;
      const { organizationUrl, artifactOrgId } = req.query;

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Find the organization to use
      let targetOrg = null;

      if (artifactOrgId) {
        targetOrg = artifactOrgs.find(org => org.id === artifactOrgId);
      } else if (organizationUrl) {
        targetOrg = artifactOrgs.find(org => org.organizationUrl === organizationUrl);
      } else {
        // Try to find organization by project name, or use first one with PAT
        targetOrg = artifactOrgs.find(org => org.projectName === projectName && org.patToken)
          || artifactOrgs.find(org => org.patToken);
      }

      if (!targetOrg || !targetOrg.patToken) {
        return res.status(400).json({ error: "No artifact organization found with PAT configured for this project" });
      }

      // Decrypt PAT token
      const pat = decryptPAT(targetOrg.patToken);
      if (!pat) {
        return res.status(500).json({ error: "Failed to decrypt PAT token" });
      }

      // Extract organization name from URL
      // Support both https://dev.azure.com/{org} and https://{org}.visualstudio.com formats
      let organization = '';
      if (targetOrg.organizationUrl.includes('dev.azure.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      } else if (targetOrg.organizationUrl.includes('visualstudio.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      }

      if (!organization) {
        return res.status(400).json({
          error: `Invalid organization URL format: ${targetOrg.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`
        });
      }

      const adoService = new AzureDevOpsService({
        organization,
        project: targetOrg.projectName,
        pat
      });

      const rawWorkItems = await adoService.getWorkItems(projectName);

      // Build hierarchy from work items
      const workItemMap = new Map<number, { raw: any; transformed: any; parentId?: number }>();
      const rootWorkItems: any[] = [];

      // First pass: Create all work items without relationships and identify parent IDs
      rawWorkItems.forEach((item: any) => {
        const workItem = {
          id: item.id.toString(),
          title: item.fields['System.Title'] || '',
          type: item.fields['System.WorkItemType'] || '',
          status: item.fields['System.State'] || '',
          priority: item.fields['Microsoft.VSTS.Common.Priority'] ?
            (item.fields['Microsoft.VSTS.Common.Priority'] === 1 ? 'High' :
              item.fields['Microsoft.VSTS.Common.Priority'] === 2 ? 'Medium' : 'Low') :
            'Medium',
          linkedItems: []
        };

        // Find parent relationship
        const parentRelation = item.relations?.find((rel: any) =>
          rel.rel === 'System.LinkTypes.Hierarchy-Reverse'
        );

        let parentId: number | undefined;
        if (parentRelation) {
          parentId = parseInt(parentRelation.url.split('/').pop() || '0');
          // Only set parentId if it's a valid number
          if (isNaN(parentId) || parentId === 0) {
            parentId = undefined;
          }
        }

        workItemMap.set(item.id, { raw: item, transformed: workItem, parentId });
      });

      // Second pass: Build hierarchy by linking children to parents
      // Track which items have been added as children to avoid duplicates
      const itemsAddedAsChildren = new Set<number>();

      workItemMap.forEach(({ transformed, parentId }, itemId) => {
        if (parentId !== undefined) {
          const parent = workItemMap.get(parentId);
          if (parent) {
            // Add this item as a child of its parent
            parent.transformed.linkedItems.push(transformed);
            itemsAddedAsChildren.add(itemId);
          } else {
            // Parent not found in current set, add to root
            rootWorkItems.push(transformed);
          }
        } else {
          // No parent, add to root
          rootWorkItems.push(transformed);
        }
      });

      // Remove any items from rootWorkItems that were added as children
      // This ensures items only appear in their correct hierarchical position
      const filteredRootItems = rootWorkItems.filter(item => {
        const itemId = parseInt(item.id);
        return !itemsAddedAsChildren.has(itemId);
      });

      // Clear and repopulate rootWorkItems with filtered items
      rootWorkItems.length = 0;
      rootWorkItems.push(...filteredRootItems);

      // Sort linkedItems by ID to maintain consistent order
      const sortLinkedItems = (item: any) => {
        if (item.linkedItems && item.linkedItems.length > 0) {
          item.linkedItems.sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));
          item.linkedItems.forEach(sortLinkedItems);
        }
      };

      rootWorkItems.forEach(sortLinkedItems);

      res.json(rootWorkItems);
    } catch (error) {
      console.error("Error fetching work items:", error);
      res.status(500).json({ error: "Failed to fetch work items from Azure DevOps" });
    }
  });

  // Get work items for autocomplete (Artifacts)
  app.get("/api/hub/artifacts/:projectName/work-items/autocomplete", async (req, res) => {
    try {
      const { projectName } = req.params;
      const { organizationUrl, artifactOrgId, search } = req.query;

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Find the organization to use
      let targetOrg = null;

      if (artifactOrgId) {
        targetOrg = artifactOrgs.find(org => org.id === artifactOrgId);
      } else if (organizationUrl) {
        targetOrg = artifactOrgs.find(org => org.organizationUrl === organizationUrl);
      } else {
        targetOrg = artifactOrgs.find(org => org.projectName === projectName && org.patToken)
          || artifactOrgs.find(org => org.patToken);
      }

      if (!targetOrg || !targetOrg.patToken) {
        return res.status(400).json({ error: "No artifact organization found with PAT configured for this project" });
      }

      // Decrypt PAT token
      const pat = decryptPAT(targetOrg.patToken);
      if (!pat) {
        return res.status(500).json({ error: "Failed to decrypt PAT token" });
      }

      // Extract organization name from URL
      let organization = '';
      if (targetOrg.organizationUrl.includes('dev.azure.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      } else if (targetOrg.organizationUrl.includes('visualstudio.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      }

      if (!organization) {
        return res.status(400).json({
          error: `Invalid organization URL format: ${targetOrg.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`
        });
      }

      const adoService = new AzureDevOpsService({
        organization,
        project: targetOrg.projectName,
        pat
      });

      // If search term provided, use search; otherwise get recent work items (limited for performance)
      let workItems: any[] = [];
      if (search && typeof search === 'string' && search.trim() !== '') {
        workItems = await adoService.searchWorkItems(search.trim(), projectName, 50);
      } else {
        // Get recent work items for autocomplete (limit to 100 most recent for performance)
        const allWorkItems = await adoService.getWorkItems(projectName);
        // Sort by changed date and limit to 100 most recent
        workItems = allWorkItems
          .sort((a: any, b: any) => {
            const dateA = new Date(a.fields['System.ChangedDate'] || 0).getTime();
            const dateB = new Date(b.fields['System.ChangedDate'] || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 100);
      }

      // Return simplified format for autocomplete
      const autocompleteItems = workItems.map((item: any) => ({
        id: item.id.toString(),
        title: item.fields['System.Title'] || '',
        type: item.fields['System.WorkItemType'] || '',
        state: item.fields['System.State'] || ''
      }));

      res.json(autocompleteItems);
    } catch (error) {
      console.error("Error fetching work items for autocomplete:", error);
      res.status(500).json({ error: "Failed to fetch work items from Azure DevOps" });
    }
  });

  // Get work item details by ID (Artifacts)
  app.get("/api/hub/artifacts/:projectName/work-item/:workItemId", async (req, res) => {
    try {
      const { projectName, workItemId } = req.params;
      const { organizationUrl, artifactOrgId } = req.query;

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Find the organization to use
      let targetOrg = null;

      if (artifactOrgId) {
        targetOrg = artifactOrgs.find(org => org.id === artifactOrgId);
      } else if (organizationUrl) {
        targetOrg = artifactOrgs.find(org => org.organizationUrl === organizationUrl);
      } else {
        // Try to find organization by project name, or use first one with PAT
        targetOrg = artifactOrgs.find(org => org.projectName === projectName && org.patToken)
          || artifactOrgs.find(org => org.patToken);
      }

      if (!targetOrg || !targetOrg.patToken) {
        return res.status(400).json({ error: "No artifact organization found with PAT configured for this project" });
      }

      // Decrypt PAT token
      const pat = decryptPAT(targetOrg.patToken);
      if (!pat) {
        return res.status(500).json({ error: "Failed to decrypt PAT token" });
      }

      // Extract organization name from URL
      // Support both https://dev.azure.com/{org} and https://{org}.visualstudio.com formats
      let organization = '';
      if (targetOrg.organizationUrl.includes('dev.azure.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      } else if (targetOrg.organizationUrl.includes('visualstudio.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      }

      if (!organization) {
        return res.status(400).json({
          error: `Invalid organization URL format: ${targetOrg.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`
        });
      }

      const adoService = new AzureDevOpsService({
        organization,
        project: targetOrg.projectName,
        pat
      });

      const workItem = await adoService.getWorkItemById(parseInt(workItemId), projectName);

      // Extract relevant fields for frontend
      const detailedWorkItem = {
        id: workItem.id.toString(),
        title: workItem.fields['System.Title'] || '',
        type: workItem.fields['System.WorkItemType'] || '',
        state: workItem.fields['System.State'] || '',
        assignedTo: workItem.fields['System.AssignedTo']?.displayName || 'Unassigned',
        createdBy: workItem.fields['System.CreatedBy']?.displayName || '',
        createdDate: workItem.fields['System.CreatedDate'] || '',
        changedDate: workItem.fields['System.ChangedDate'] || '',
        description: workItem.fields['System.Description'] || '',
        acceptanceCriteria: workItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
        storyPoints: workItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
        priority: workItem.fields['Microsoft.VSTS.Common.Priority'] || null,
        severity: workItem.fields['Microsoft.VSTS.Common.Severity'] || null,
        businessValue: workItem.fields['Microsoft.VSTS.Common.BusinessValue'] || null,
        timeCriticality: workItem.fields['Microsoft.VSTS.Common.TimeCriticality'] || null,
        effort: workItem.fields['Microsoft.VSTS.Scheduling.Effort'] || null,
        remainingWork: workItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
        originalEstimate: workItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null,
        completedWork: workItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
        reproSteps: workItem.fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
        tags: workItem.fields['System.Tags'] || '',
        iterationPath: workItem.fields['System.IterationPath'] || '',
        areaPath: workItem.fields['System.AreaPath'] || '',
        url: workItem._links?.html?.href || `https://dev.azure.com/${organization}/${projectName}/_workitems/edit/${workItemId}`,
        relations: workItem.relations || []
      };

      res.json(detailedWorkItem);
    } catch (error) {
      console.error("Error fetching work item details:", error);
      res.status(500).json({ error: "Failed to fetch work item details from Azure DevOps" });
    }
  });

  // Update work item (Artifacts)
  app.patch("/api/hub/artifacts/:projectName/work-item/:workItemId", async (req, res) => {
    try {
      const { projectName, workItemId } = req.params;
      const { organizationUrl, artifactOrgId } = req.query;
      const updates = req.body;

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Find the organization to use
      let targetOrg = null;

      if (artifactOrgId) {
        targetOrg = artifactOrgs.find(org => org.id === artifactOrgId);
      } else if (organizationUrl) {
        targetOrg = artifactOrgs.find(org => org.organizationUrl === organizationUrl);
      } else {
        // Try to find organization by project name, or use first one with PAT
        targetOrg = artifactOrgs.find(org => org.projectName === projectName && org.patToken)
          || artifactOrgs.find(org => org.patToken);
      }

      if (!targetOrg || !targetOrg.patToken) {
        return res.status(400).json({ error: "No artifact organization found with PAT configured for this project" });
      }

      // Decrypt PAT token
      const pat = decryptPAT(targetOrg.patToken);
      if (!pat) {
        return res.status(500).json({ error: "Failed to decrypt PAT token" });
      }

      // Extract organization name from URL
      // Support both https://dev.azure.com/{org} and https://{org}.visualstudio.com formats
      let organization = '';
      if (targetOrg.organizationUrl.includes('dev.azure.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      } else if (targetOrg.organizationUrl.includes('visualstudio.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      }

      if (!organization) {
        return res.status(400).json({
          error: `Invalid organization URL format: ${targetOrg.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`
        });
      }

      const adoService = new AzureDevOpsService({
        organization,
        project: targetOrg.projectName,
        pat
      });

      // Map frontend field names to Azure DevOps field names
      const fieldMapping: Record<string, string> = {
        title: 'System.Title',
        description: 'System.Description',
        state: 'System.State',
        assignedTo: 'System.AssignedTo',
        storyPoints: 'Microsoft.VSTS.Scheduling.StoryPoints',
        priority: 'Microsoft.VSTS.Common.Priority',
        severity: 'Microsoft.VSTS.Common.Severity',
        businessValue: 'Microsoft.VSTS.Common.BusinessValue',
        timeCriticality: 'Microsoft.VSTS.Common.TimeCriticality',
        effort: 'Microsoft.VSTS.Scheduling.Effort',
        remainingWork: 'Microsoft.VSTS.Scheduling.RemainingWork',
        originalEstimate: 'Microsoft.VSTS.Scheduling.OriginalEstimate',
        completedWork: 'Microsoft.VSTS.Scheduling.CompletedWork',
        acceptanceCriteria: 'Microsoft.VSTS.Common.AcceptanceCriteria',
        tags: 'System.Tags',
        reproSteps: 'Microsoft.VSTS.TCM.ReproSteps'
      };

      // Convert updates to Azure DevOps field format
      const adoFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        const adoFieldName = fieldMapping[key] || key;

        // Special handling for assignedTo field
        if (key === 'assignedTo') {
          // Skip if null, empty, or "Unassigned" - don't update the field
          // Azure DevOps doesn't allow setting to "Unassigned" or empty string
          // To clear assignment, the field should be omitted from the update
          if (value !== null && value !== undefined && value !== '' && value !== 'Unassigned') {
            // Only include if it's a valid user identity
            adoFields[adoFieldName] = value;
          }
          // If it's "Unassigned" or empty, skip it entirely (don't update the field)
          continue;
        }

        // Filter out null, undefined, and empty strings (but allow 0 and '0')
        const valueType = typeof value;
        if ((valueType === 'number' && value === 0) || (valueType === 'string' && value === '0')) {
          // Allow explicit 0 values for numeric fields
          adoFields[adoFieldName] = valueType === 'string' ? 0 : value;
        } else if (value !== null && value !== undefined && value !== '') {
          adoFields[adoFieldName] = value;
        }
      }

      if (Object.keys(adoFields).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedWorkItem = await adoService.updateWorkItem(parseInt(workItemId), adoFields, projectName || targetOrg.projectName);

      // Return updated work item in the same format as GET endpoint
      const detailedWorkItem = {
        id: updatedWorkItem.id.toString(),
        title: updatedWorkItem.fields['System.Title'] || '',
        type: updatedWorkItem.fields['System.WorkItemType'] || '',
        state: updatedWorkItem.fields['System.State'] || '',
        assignedTo: updatedWorkItem.fields['System.AssignedTo']?.displayName || 'Unassigned',
        createdBy: updatedWorkItem.fields['System.CreatedBy']?.displayName || '',
        createdDate: updatedWorkItem.fields['System.CreatedDate'] || '',
        changedDate: updatedWorkItem.fields['System.ChangedDate'] || '',
        description: updatedWorkItem.fields['System.Description'] || '',
        acceptanceCriteria: updatedWorkItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
        storyPoints: updatedWorkItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
        priority: updatedWorkItem.fields['Microsoft.VSTS.Common.Priority'] || null,
        severity: updatedWorkItem.fields['Microsoft.VSTS.Common.Severity'] || null,
        businessValue: updatedWorkItem.fields['Microsoft.VSTS.Common.BusinessValue'] || null,
        timeCriticality: updatedWorkItem.fields['Microsoft.VSTS.Common.TimeCriticality'] || null,
        effort: updatedWorkItem.fields['Microsoft.VSTS.Scheduling.Effort'] || null,
        remainingWork: updatedWorkItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
        originalEstimate: updatedWorkItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null,
        completedWork: updatedWorkItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
        reproSteps: updatedWorkItem.fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
        tags: updatedWorkItem.fields['System.Tags'] || '',
        iterationPath: updatedWorkItem.fields['System.IterationPath'] || '',
        areaPath: updatedWorkItem.fields['System.AreaPath'] || '',
        url: updatedWorkItem._links?.html?.href || `https://dev.azure.com/${organization}/${projectName}/_workitems/edit/${workItemId}`,
        relations: updatedWorkItem.relations || []
      };

      res.json(detailedWorkItem);
    } catch (error: any) {
      console.error("Error updating work item:", error);
      res.status(500).json({ error: error.message || "Failed to update work item in Azure DevOps" });
    }
  });

  // Create work item (Artifacts)
  app.post("/api/hub/artifacts/:projectName/work-item", async (req, res) => {
    try {
      const { projectName } = req.params;
      const { organizationUrl, artifactOrgId } = req.query;
      const { workItemType, title, description, state, assignedTo, storyPoints, priority, severity, businessValue, timeCriticality, effort, remainingWork, originalEstimate, completedWork, acceptanceCriteria, reproSteps, tags } = req.body;

      if (!workItemType || !title) {
        return res.status(400).json({ error: "Work item type and title are required" });
      }

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Find the organization to use
      let targetOrg = null;

      if (artifactOrgId) {
        targetOrg = artifactOrgs.find(org => org.id === artifactOrgId);
      } else if (organizationUrl) {
        targetOrg = artifactOrgs.find(org => org.organizationUrl === organizationUrl);
      } else {
        // Try to find organization by project name, or use first one with PAT
        targetOrg = artifactOrgs.find(org => org.projectName === projectName && org.patToken)
          || artifactOrgs.find(org => org.patToken);
      }

      if (!targetOrg || !targetOrg.patToken) {
        return res.status(400).json({ error: "No artifact organization found with PAT configured for this project" });
      }

      // Decrypt PAT token
      const pat = decryptPAT(targetOrg.patToken);
      if (!pat) {
        return res.status(500).json({ error: "Failed to decrypt PAT token" });
      }

      // Extract organization name from URL
      let organization = '';
      if (targetOrg.organizationUrl.includes('dev.azure.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      } else if (targetOrg.organizationUrl.includes('visualstudio.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      }

      if (!organization) {
        return res.status(400).json({
          error: `Invalid organization URL format: ${targetOrg.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`
        });
      }

      const adoService = new AzureDevOpsService({
        organization,
        project: targetOrg.projectName,
        pat
      });

      // Map frontend field names to Azure DevOps field names
      const adoFields: Record<string, any> = {
        'System.Title': title,
      };

      if (description) adoFields['System.Description'] = description;
      if (state) adoFields['System.State'] = state;
      if (assignedTo && assignedTo !== 'Unassigned' && assignedTo.trim() !== '') {
        adoFields['System.AssignedTo'] = assignedTo.trim();
      }
      if (storyPoints !== undefined && storyPoints !== null && storyPoints !== '') {
        adoFields['Microsoft.VSTS.Scheduling.StoryPoints'] = parseFloat(storyPoints.toString());
      }
      if (priority !== undefined && priority !== null && priority !== '') {
        adoFields['Microsoft.VSTS.Common.Priority'] = parseInt(priority.toString());
      }
      if (severity) adoFields['Microsoft.VSTS.Common.Severity'] = severity;
      if (businessValue !== undefined && businessValue !== null && businessValue !== '') {
        adoFields['Microsoft.VSTS.Common.BusinessValue'] = parseFloat(businessValue.toString());
      }
      if (timeCriticality !== undefined && timeCriticality !== null && timeCriticality !== '') {
        adoFields['Microsoft.VSTS.Common.TimeCriticality'] = parseFloat(timeCriticality.toString());
      }
      if (effort !== undefined && effort !== null && effort !== '') {
        adoFields['Microsoft.VSTS.Scheduling.Effort'] = parseFloat(effort.toString());
      }
      if (remainingWork !== undefined && remainingWork !== null && remainingWork !== '') {
        adoFields['Microsoft.VSTS.Scheduling.RemainingWork'] = parseFloat(remainingWork.toString());
      }
      if (originalEstimate !== undefined && originalEstimate !== null && originalEstimate !== '') {
        adoFields['Microsoft.VSTS.Scheduling.OriginalEstimate'] = parseFloat(originalEstimate.toString());
      }
      if (completedWork !== undefined && completedWork !== null && completedWork !== '') {
        adoFields['Microsoft.VSTS.Scheduling.CompletedWork'] = parseFloat(completedWork.toString());
      }
      if (acceptanceCriteria) adoFields['Microsoft.VSTS.Common.AcceptanceCriteria'] = acceptanceCriteria;
      if (reproSteps) adoFields['Microsoft.VSTS.TCM.ReproSteps'] = reproSteps;
      if (tags) adoFields['System.Tags'] = tags;

      const createdWorkItem = await adoService.createWorkItemPublic(workItemType, adoFields, projectName || targetOrg.projectName);

      // Return created work item in the same format as GET endpoint
      const detailedWorkItem = {
        id: createdWorkItem.id.toString(),
        title: createdWorkItem.fields['System.Title'] || '',
        type: createdWorkItem.fields['System.WorkItemType'] || '',
        state: createdWorkItem.fields['System.State'] || '',
        assignedTo: createdWorkItem.fields['System.AssignedTo']?.displayName || 'Unassigned',
        createdBy: createdWorkItem.fields['System.CreatedBy']?.displayName || '',
        createdDate: createdWorkItem.fields['System.CreatedDate'] || '',
        changedDate: createdWorkItem.fields['System.ChangedDate'] || '',
        description: createdWorkItem.fields['System.Description'] || '',
        acceptanceCriteria: createdWorkItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
        storyPoints: createdWorkItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
        priority: createdWorkItem.fields['Microsoft.VSTS.Common.Priority'] || null,
        severity: createdWorkItem.fields['Microsoft.VSTS.Common.Severity'] || null,
        businessValue: createdWorkItem.fields['Microsoft.VSTS.Common.BusinessValue'] || null,
        timeCriticality: createdWorkItem.fields['Microsoft.VSTS.Common.TimeCriticality'] || null,
        effort: createdWorkItem.fields['Microsoft.VSTS.Scheduling.Effort'] || null,
        remainingWork: createdWorkItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
        originalEstimate: createdWorkItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null,
        completedWork: createdWorkItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
        reproSteps: createdWorkItem.fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
        tags: createdWorkItem.fields['System.Tags'] || '',
        iterationPath: createdWorkItem.fields['System.IterationPath'] || '',
        areaPath: createdWorkItem.fields['System.AreaPath'] || '',
        url: createdWorkItem._links?.html?.href || `https://dev.azure.com/${organization}/${projectName}/_workitems/edit/${createdWorkItem.id}`,
        relations: createdWorkItem.relations || []
      };

      res.json(detailedWorkItem);
    } catch (error: any) {
      console.error("Error creating work item:", error);
      res.status(500).json({ error: error.message || "Failed to create work item in Azure DevOps" });
    }
  });

  // Link work items
  app.post("/api/hub/artifacts/link-work-items", async (req, res) => {
    try {
      const { sourceWorkItemId, targetWorkItemId, linkType, projectName, organizationUrl, artifactOrgId } = req.body;

      if (!sourceWorkItemId || !targetWorkItemId) {
        return res.status(400).json({ error: "Source and target work item IDs are required" });
      }

      if (!isEncryptionAvailable()) {
        return res.status(503).json({
          error: "Artifact organizations feature is not available. PAT_ENCRYPTION_KEY environment variable must be configured."
        });
      }

      const artifactOrgs = await storage.getArtifactOrganizations();

      if (artifactOrgs.length === 0) {
        return res.status(404).json({ error: "No artifact organizations configured. Please add organizations in Settings > Hub Artifacts." });
      }

      // Find the organization to use
      let targetOrg = null;

      if (artifactOrgId) {
        targetOrg = artifactOrgs.find(org => org.id === artifactOrgId);
      } else if (organizationUrl) {
        targetOrg = artifactOrgs.find(org => org.organizationUrl === organizationUrl);
      } else {
        // Try to find organization by project name, or use first one with PAT
        targetOrg = artifactOrgs.find(org => org.projectName === projectName && org.patToken)
          || artifactOrgs.find(org => org.patToken);
      }

      if (!targetOrg || !targetOrg.patToken) {
        return res.status(400).json({ error: "No artifact organization found with PAT configured for this project" });
      }

      // Decrypt PAT token
      const pat = decryptPAT(targetOrg.patToken);
      if (!pat) {
        return res.status(500).json({ error: "Failed to decrypt PAT token" });
      }

      // Extract organization name from URL
      // Support both https://dev.azure.com/{org} and https://{org}.visualstudio.com formats
      let organization = '';
      if (targetOrg.organizationUrl.includes('dev.azure.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/dev\.azure\.com\/([^\/\?]+)/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      } else if (targetOrg.organizationUrl.includes('visualstudio.com')) {
        const orgMatch = targetOrg.organizationUrl.match(/https?:\/\/([^\.]+)\.visualstudio\.com/);
        organization = orgMatch ? orgMatch[1].trim() : '';
      }

      if (!organization) {
        return res.status(400).json({
          error: `Invalid organization URL format: ${targetOrg.organizationUrl}. Expected format: https://dev.azure.com/{org} or https://{org}.visualstudio.com`
        });
      }

      const adoService = new AzureDevOpsService({
        organization,
        project: targetOrg.projectName,
        pat
      });

      await adoService.linkWorkItemsPublic(
        parseInt(sourceWorkItemId),
        parseInt(targetWorkItemId),
        linkType || 'System.LinkTypes.Hierarchy-Reverse',
        projectName || targetOrg.projectName
      );

      res.json({ success: true, message: "Work items linked successfully" });
    } catch (error) {
      console.error("Error linking work items:", error);
      res.status(500).json({ error: "Failed to link work items" });
    }
  });

  // Generate prompt using AI
  app.post("/api/hub/prompts/generate", async (req, res) => {
    try {
      const { description, category, context } = req.body;

      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          error: "OpenAI integration not configured. Please set up your OPENAI_API_KEY."
        });
      }

      // Generate prompt using OpenAI
      const openaiModule = await import("openai");
      const openai = new openaiModule.default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const systemPrompt = `You are a helpful assistant that creates well-structured prompt templates for various use cases. 
Generate a clear, reusable prompt template based on the user's description. 
The template should include placeholders in [square brackets] for customization.
Return the response as a JSON object with the following structure:
{
  "title": "A short, descriptive title for the prompt",
  "description": "A brief description of what the prompt does",
  "content": "The actual prompt template with [placeholders]",
  "tags": ["relevant", "tags", "for", "categorization"]
}`;

      const userPrompt = `Create a prompt template for: ${description}
${category ? `Category: ${category}` : ''}
${context ? `Additional context: ${context}` : ''}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const generatedPrompt = JSON.parse(completion.choices[0].message.content || "{}");

      res.json(generatedPrompt);
    } catch (error) {
      console.error("Error generating prompt:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate prompt"
      });
    }
  });

  // Dashboard API Routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Organizations API Routes
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const organization = await storage.createOrganization(req.body);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  app.patch("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.updateOrganization(req.params.id, req.body);
      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.delete("/api/organizations/:id", async (req, res) => {
    try {
      await storage.deleteOrganization(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  // Projects API Routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = await storage.createProject(req.body);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Personas API Routes
  app.get("/api/personas", async (req, res) => {
    try {
      console.log("[API] Fetching personas...");
      const personas = await storage.getPersonas();
      console.log("[API] Successfully fetched", personas.length, "personas");
      res.json(personas);
    } catch (error) {
      console.error("[API] Error fetching personas:", error);
      res.status(500).json({ error: "Failed to fetch personas", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const persona = await storage.getPersona(req.params.id);
      if (!persona) {
        return res.status(404).json({ error: "Persona not found" });
      }
      res.json(persona);
    } catch (error) {
      console.error("Error fetching persona:", error);
      res.status(500).json({ error: "Failed to fetch persona" });
    }
  });

  app.post("/api/personas", async (req, res) => {
    try {
      const persona = await storage.createPersona(req.body);
      res.json(persona);
    } catch (error) {
      console.error("Error creating persona:", error);
      res.status(500).json({ error: "Failed to create persona" });
    }
  });

  app.patch("/api/personas/:id", async (req, res) => {
    try {
      const persona = await storage.updatePersona(req.params.id, req.body);
      res.json(persona);
    } catch (error) {
      console.error("Error updating persona:", error);
      res.status(500).json({ error: "Failed to update persona" });
    }
  });

  app.delete("/api/personas/:id", async (req, res) => {
    try {
      await storage.deletePersona(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting persona:", error);
      res.status(500).json({ error: "Failed to delete persona" });
    }
  });

  // Initialize default personas on first startup
  app.post("/api/personas/initialize", async (req, res) => {
    try {
      console.log("[API] Initializing default personas...");
      await storage.initializeDefaultPersonas();
      console.log("[API] Successfully initialized default personas");
      res.json({ success: true, message: "Default personas initialized" });
    } catch (error) {
      console.error("[API] Error initializing personas:", error);
      res.status(500).json({ error: "Failed to initialize personas", details: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
