import { db } from "../db";
import { 
  sdlcProjects, 
  sdlcPhases, 
  phaseConfirmations,
  sdlcIssues, 
  sdlcEpics, 
  sdlcRequirements, 
  sdlcBacklogItems, 
  sdlcDocuments,
  sdlcDesignAssets,
  sdlcFigmaLinks,
  sdlcDesignReviews,
  adoDesignSync
} from "@shared/schema";
import type { 
  InsertSDLCProject, 
  InsertSDLCPhase, 
  SDLCProject, 
  SDLCPhase,
  InsertPhaseConfirmation,
  PhaseConfirmation,
  InsertSDLCIssue,
  SDLCIssue,
  InsertSDLCEpic,
  SDLCEpic,
  InsertSDLCRequirement,
  SDLCRequirement,
  InsertSDLCBacklogItem,
  SDLCBacklogItem,
  InsertSDLCDocument,
  SDLCDocument,
  InsertSDLCDesignAsset,
  SDLCDesignAsset,
  InsertSDLCFigmaLink,
  SDLCFigmaLink,
  InsertSDLCDesignReview,
  SDLCDesignReview,
  InsertAdoDesignSync,
  AdoDesignSync,
} from "@shared/schema";
import { eq, and, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export class SDLCService {
  // Project operations
  async createProject(data: InsertSDLCProject): Promise<SDLCProject> {
    const id = randomUUID();
    await db.insert(sdlcProjects).values({ ...data, id } as any);
    const inserted = await db.select().from(sdlcProjects).where(eq(sdlcProjects.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create project");
    }
    const project = inserted[0];
    
    // Automatically create 6 phases for the new project
    const phaseNames = [
      "Requirement and Analysis",
      "Design",
      "Development",
      "Build and Testing",
      "Deployment",
      "Maintenance",
    ];

    for (let i = 0; i < phaseNames.length; i++) {
      await db.insert(sdlcPhases).values({
        projectId: project.id,
        phaseNumber: i + 1,
        phaseName: phaseNames[i],
        status: "not_started",
        progress: 0,
      });
    }

    return project;
  }

  async getProject(id: string): Promise<SDLCProject | undefined> {
    const [project] = await db.select().from(sdlcProjects).where(eq(sdlcProjects.id, id));
    return project;
  }

  async getAllProjects(): Promise<SDLCProject[]> {
    return db.select().from(sdlcProjects);
  }

  async updateProject(id: string, data: Partial<InsertSDLCProject>): Promise<SDLCProject> {
    await db
      .update(sdlcProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcProjects.id, id));
    const updated = await db.select().from(sdlcProjects).where(eq(sdlcProjects.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Project not found");
    }
    return updated[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(sdlcProjects).where(eq(sdlcProjects.id, id));
  }

  // Phase operations
  async getPhasesByProject(projectId: string): Promise<SDLCPhase[]> {
    return db.select().from(sdlcPhases).where(eq(sdlcPhases.projectId, projectId));
  }

  async getPhase(projectId: string, phaseNumber: number): Promise<SDLCPhase | undefined> {
    const [phase] = await db
      .select()
      .from(sdlcPhases)
      .where(and(eq(sdlcPhases.projectId, projectId), eq(sdlcPhases.phaseNumber, phaseNumber)));
    return phase;
  }

  async updatePhase(
    projectId: string,
    phaseNumber: number,
    data: Partial<Omit<InsertSDLCPhase, "projectId" | "phaseNumber">>
  ): Promise<SDLCPhase> {
    await db
      .update(sdlcPhases)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(sdlcPhases.projectId, projectId), eq(sdlcPhases.phaseNumber, phaseNumber)));
    const updated = await db
      .select()
      .from(sdlcPhases)
      .where(and(eq(sdlcPhases.projectId, projectId), eq(sdlcPhases.phaseNumber, phaseNumber)))
      .limit(1);
    if (!updated[0]) {
      throw new Error("Phase not found");
    }
    return updated[0];
  }

  // Get or create default project for demo purposes
  async getOrCreateDefaultProject(): Promise<{ project: SDLCProject; phases: SDLCPhase[] }> {
    let projects = await this.getAllProjects();
    
    if (projects.length === 0) {
      // Create default project
      const project = await this.createProject({
        name: "My SDLC Project",
        description: "Default project for tracking SDLC phases",
        status: "active",
      });
      const phases = await this.getPhasesByProject(project.id);
      return { project, phases };
    }

    const project = projects[0];
    const phases = await this.getPhasesByProject(project.id);
    return { project, phases };
  }

  // Seed mock projects for demo purposes
  async seedMockProjects(): Promise<SDLCProject[]> {
    const existingProjects = await this.getAllProjects();
    if (existingProjects.length > 0) {
      return existingProjects;
    }

    const mockProjects = [
      {
        id: "e-commerce-platform",
        name: "E-Commerce Platform",
        description: "Full-featured e-commerce platform with payment processing and inventory management",
        status: "active" as const,
        organization: "Acme Corporation",
        repositoryCount: 5,
        cloudProvider: "GitHub",
      },
      {
        id: "mobile-app",
        name: "Mobile App",
        description: "Cross-platform mobile application for iOS and Android",
        status: "active" as const,
        organization: "Tech Innovators",
        repositoryCount: 3,
        cloudProvider: "GitLab",
      },
      {
        id: "analytics-dashboard",
        name: "Analytics Dashboard",
        description: "Real-time analytics and reporting dashboard for business intelligence",
        status: "active" as const,
        organization: "Digital Solutions",
        repositoryCount: 4,
        cloudProvider: "Azure",
      },
      {
        id: "api-gateway",
        name: "API Gateway",
        description: "Centralized API gateway for microservices architecture",
        status: "active" as const,
        organization: "Cloud Systems",
        repositoryCount: 2,
        cloudProvider: "AWS",
      },
      {
        id: "admin-portal",
        name: "Admin Portal",
        description: "Administrative portal for system configuration and user management",
        status: "active" as const,
        organization: "DevOps Masters",
        repositoryCount: 6,
      },
      {
        id: "customer-portal",
        name: "Customer Portal",
        description: "Self-service customer portal for account management and support",
        status: "active" as const,
        organization: "Code Factory",
        repositoryCount: 4,
        cloudProvider: "GitHub",
      },
    ];

    const createdProjects: SDLCProject[] = [];
    for (const projectData of mockProjects) {
      const project = await this.createProject(projectData);
      
      // Set random progress for each phase
      const phases = await this.getPhasesByProject(project.id);
      for (const phase of phases) {
        const progress = Math.floor(Math.random() * 100);
        const status = progress === 0 ? "not_started" : progress === 100 ? "completed" : "in_progress";
        await this.updatePhase(project.id, phase.phaseNumber, {
          progress,
          status: status as any,
        });
      }
      
      createdProjects.push(project);
    }

    return createdProjects;
  }

  // Issues operations
  async createIssue(data: InsertSDLCIssue): Promise<SDLCIssue> {
    const id = randomUUID();
    await db.insert(sdlcIssues).values({ ...data, id });
    const inserted = await db.select().from(sdlcIssues).where(eq(sdlcIssues.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create issue");
    }
    return inserted[0];
  }

  async getIssues(projectId: string, phaseNumber?: number): Promise<SDLCIssue[]> {
    if (phaseNumber !== undefined) {
      return db.select().from(sdlcIssues).where(
        and(
          eq(sdlcIssues.projectId, projectId),
          eq(sdlcIssues.phaseNumber, phaseNumber)
        )
      );
    }
    return db.select().from(sdlcIssues).where(eq(sdlcIssues.projectId, projectId));
  }

  async updateIssue(id: string, data: Partial<InsertSDLCIssue>): Promise<SDLCIssue> {
    await db
      .update(sdlcIssues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcIssues.id, id));
    const updated = await db.select().from(sdlcIssues).where(eq(sdlcIssues.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Issue not found");
    }
    return updated[0];
  }

  async deleteIssue(id: string): Promise<void> {
    await db.delete(sdlcIssues).where(eq(sdlcIssues.id, id));
  }

  // Epics operations
  async createEpic(data: InsertSDLCEpic): Promise<{ epic: SDLCEpic; unlockInfo: { unlocked: boolean; phaseName?: string } }> {
    const id = randomUUID();
    await db.insert(sdlcEpics).values({ ...data, id });
    const inserted = await db.select().from(sdlcEpics).where(eq(sdlcEpics.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create epic");
    }
    const epic = inserted[0];
    // Automatically update phase progress and check for unlock
    const unlockInfo = await this.updatePhaseProgressAutomatically(data.projectId, data.phaseNumber);
    return { epic, unlockInfo };
  }

  async getEpics(projectId: string, phaseNumber?: number): Promise<SDLCEpic[]> {
    if (phaseNumber !== undefined) {
      return db.select().from(sdlcEpics).where(
        and(
          eq(sdlcEpics.projectId, projectId),
          eq(sdlcEpics.phaseNumber, phaseNumber)
        )
      );
    }
    return db.select().from(sdlcEpics).where(eq(sdlcEpics.projectId, projectId));
  }

  async updateEpic(id: string, data: Partial<InsertSDLCEpic>): Promise<SDLCEpic> {
    // Get the original epic to check if phase changed
    const [originalEpic] = await db.select().from(sdlcEpics).where(eq(sdlcEpics.id, id));
    
    await db
      .update(sdlcEpics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcEpics.id, id));
    const updated = await db.select().from(sdlcEpics).where(eq(sdlcEpics.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Epic not found");
    }
    const epic = updated[0];
    
    // If phase changed, update progress for both old and new phases
    if (originalEpic && data.phaseNumber && originalEpic.phaseNumber !== data.phaseNumber) {
      await this.updatePhaseProgressAutomatically(originalEpic.projectId, originalEpic.phaseNumber);
      await this.updatePhaseProgressAutomatically(epic.projectId, epic.phaseNumber);
    } else {
      // Otherwise just update current phase
      await this.updatePhaseProgressAutomatically(epic.projectId, epic.phaseNumber);
    }
    
    return epic;
  }

  async deleteEpic(id: string): Promise<void> {
    // Get the epic first to know which phase to update
    const [epic] = await db.select().from(sdlcEpics).where(eq(sdlcEpics.id, id));
    await db.delete(sdlcEpics).where(eq(sdlcEpics.id, id));
    // Automatically update phase progress after deletion
    if (epic) {
      await this.updatePhaseProgressAutomatically(epic.projectId, epic.phaseNumber);
    }
  }

  // Requirements operations
  async createRequirement(data: InsertSDLCRequirement): Promise<{ requirement: SDLCRequirement; unlockInfo: { unlocked: boolean; phaseName?: string } }> {
    const id = randomUUID();
    await db.insert(sdlcRequirements).values({ ...data, id });
    const inserted = await db.select().from(sdlcRequirements).where(eq(sdlcRequirements.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create requirement");
    }
    const requirement = inserted[0];
    // Automatically update phase progress and check for unlock
    const unlockInfo = await this.updatePhaseProgressAutomatically(data.projectId, data.phaseNumber);
    return { requirement, unlockInfo };
  }

  async getRequirements(projectId: string, phaseNumber?: number): Promise<SDLCRequirement[]> {
    if (phaseNumber !== undefined) {
      return db.select().from(sdlcRequirements).where(
        and(
          eq(sdlcRequirements.projectId, projectId),
          eq(sdlcRequirements.phaseNumber, phaseNumber)
        )
      );
    }
    return db.select().from(sdlcRequirements).where(eq(sdlcRequirements.projectId, projectId));
  }

  async updateRequirement(id: string, data: Partial<InsertSDLCRequirement>): Promise<SDLCRequirement> {
    // Get the original requirement to check if phase changed
    const [originalReq] = await db.select().from(sdlcRequirements).where(eq(sdlcRequirements.id, id));
    
    await db
      .update(sdlcRequirements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcRequirements.id, id));
    const updated = await db.select().from(sdlcRequirements).where(eq(sdlcRequirements.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Requirement not found");
    }
    const requirement = updated[0];
    
    // If phase changed, update progress for both old and new phases
    if (originalReq && data.phaseNumber && originalReq.phaseNumber !== data.phaseNumber) {
      await this.updatePhaseProgressAutomatically(originalReq.projectId, originalReq.phaseNumber);
      await this.updatePhaseProgressAutomatically(requirement.projectId, requirement.phaseNumber);
    } else {
      // Otherwise just update current phase
      await this.updatePhaseProgressAutomatically(requirement.projectId, requirement.phaseNumber);
    }
    
    return requirement;
  }

  async deleteRequirement(id: string): Promise<void> {
    // Get the requirement first to know which phase to update
    const [requirement] = await db.select().from(sdlcRequirements).where(eq(sdlcRequirements.id, id));
    await db.delete(sdlcRequirements).where(eq(sdlcRequirements.id, id));
    // Automatically update phase progress after deletion
    if (requirement) {
      await this.updatePhaseProgressAutomatically(requirement.projectId, requirement.phaseNumber);
    }
  }

  // Backlog items operations
  async createBacklogItem(data: InsertSDLCBacklogItem): Promise<{ backlogItem: SDLCBacklogItem; unlockInfo: { unlocked: boolean; phaseName?: string } }> {
    const id = randomUUID();
    await db.insert(sdlcBacklogItems).values({ ...data, id });
    const inserted = await db.select().from(sdlcBacklogItems).where(eq(sdlcBacklogItems.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create backlog item");
    }
    const item = inserted[0];
    // Automatically update phase progress and check for unlock
    const unlockInfo = await this.updatePhaseProgressAutomatically(data.projectId, data.phaseNumber);
    return { backlogItem: item, unlockInfo };
  }

  async getBacklogItems(projectId: string, phaseNumber?: number): Promise<SDLCBacklogItem[]> {
    if (phaseNumber !== undefined) {
      return db.select().from(sdlcBacklogItems).where(
        and(
          eq(sdlcBacklogItems.projectId, projectId),
          eq(sdlcBacklogItems.phaseNumber, phaseNumber)
        )
      );
    }
    return db.select().from(sdlcBacklogItems).where(eq(sdlcBacklogItems.projectId, projectId));
  }

  async updateBacklogItem(id: string, data: Partial<InsertSDLCBacklogItem>): Promise<SDLCBacklogItem> {
    // Get the original item to check if phase changed
    const [originalItem] = await db.select().from(sdlcBacklogItems).where(eq(sdlcBacklogItems.id, id));
    
    await db
      .update(sdlcBacklogItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcBacklogItems.id, id));
    const updated = await db.select().from(sdlcBacklogItems).where(eq(sdlcBacklogItems.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Backlog item not found");
    }
    const item = updated[0];
    
    // If phase changed, update progress for both old and new phases
    if (originalItem && data.phaseNumber && originalItem.phaseNumber !== data.phaseNumber) {
      await this.updatePhaseProgressAutomatically(originalItem.projectId, originalItem.phaseNumber);
      await this.updatePhaseProgressAutomatically(item.projectId, item.phaseNumber);
    } else {
      // Otherwise just update current phase
      await this.updatePhaseProgressAutomatically(item.projectId, item.phaseNumber);
    }
    
    return item;
  }

  async deleteBacklogItem(id: string): Promise<void> {
    // Get the item first to know which phase to update
    const [item] = await db.select().from(sdlcBacklogItems).where(eq(sdlcBacklogItems.id, id));
    await db.delete(sdlcBacklogItems).where(eq(sdlcBacklogItems.id, id));
    // Automatically update phase progress after deletion
    if (item) {
      await this.updatePhaseProgressAutomatically(item.projectId, item.phaseNumber);
    }
  }

  // Documents operations
  async createDocument(data: InsertSDLCDocument): Promise<{ document: SDLCDocument; unlockInfo: { unlocked: boolean; phaseName?: string } }> {
    const id = randomUUID();
    await db.insert(sdlcDocuments).values({ ...data, id });
    const inserted = await db.select().from(sdlcDocuments).where(eq(sdlcDocuments.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create document");
    }
    const doc = inserted[0];
    // Automatically update phase progress and check for unlock
    const unlockInfo = await this.updatePhaseProgressAutomatically(data.projectId, data.phaseNumber);
    return { document: doc, unlockInfo };
  }

  async getDocuments(projectId: string, phaseNumber?: number): Promise<SDLCDocument[]> {
    if (phaseNumber !== undefined) {
      return db.select().from(sdlcDocuments).where(
        and(
          eq(sdlcDocuments.projectId, projectId),
          eq(sdlcDocuments.phaseNumber, phaseNumber)
        )
      );
    }
    return db.select().from(sdlcDocuments).where(eq(sdlcDocuments.projectId, projectId));
  }

  async updateDocument(id: string, data: Partial<InsertSDLCDocument>): Promise<SDLCDocument> {
    // Get the original document to check if phase changed
    const [originalDoc] = await db.select().from(sdlcDocuments).where(eq(sdlcDocuments.id, id));
    
    await db
      .update(sdlcDocuments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcDocuments.id, id));
    const updated = await db.select().from(sdlcDocuments).where(eq(sdlcDocuments.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Document not found");
    }
    const doc = updated[0];
    
    // If phase changed, update progress for both old and new phases
    if (originalDoc && data.phaseNumber && originalDoc.phaseNumber !== data.phaseNumber) {
      await this.updatePhaseProgressAutomatically(originalDoc.projectId, originalDoc.phaseNumber);
      await this.updatePhaseProgressAutomatically(doc.projectId, doc.phaseNumber);
    } else {
      // Otherwise just update current phase
      await this.updatePhaseProgressAutomatically(doc.projectId, doc.phaseNumber);
    }
    
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    // Get the document first to know which phase to update
    const [doc] = await db.select().from(sdlcDocuments).where(eq(sdlcDocuments.id, id));
    await db.delete(sdlcDocuments).where(eq(sdlcDocuments.id, id));
    // Automatically update phase progress after deletion
    if (doc) {
      await this.updatePhaseProgressAutomatically(doc.projectId, doc.phaseNumber);
    }
  }

  // Phase Confirmation operations
  async getConfirmationsByPhaseId(phaseId: string): Promise<PhaseConfirmation[]> {
    return db.select().from(phaseConfirmations).where(eq(phaseConfirmations.phaseId, phaseId));
  }

  async createConfirmation(data: InsertPhaseConfirmation): Promise<PhaseConfirmation> {
    const id = randomUUID();
    await db.insert(phaseConfirmations).values({ ...data, id });
    const inserted = await db.select().from(phaseConfirmations).where(eq(phaseConfirmations.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create confirmation");
    }
    return inserted[0];
  }

  async updateConfirmation(
    id: string,
    data: Partial<InsertPhaseConfirmation>
  ): Promise<PhaseConfirmation> {
    await db
      .update(phaseConfirmations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(phaseConfirmations.id, id));
    const updated = await db.select().from(phaseConfirmations).where(eq(phaseConfirmations.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Confirmation not found");
    }
    const confirmation = updated[0];
    
    // Check if phase is ready for automatic progression after confirmation update
    await this.checkAndUnlockNextPhase(confirmation.phaseId);
    
    return confirmation;
  }

  // Automatically unlock next phase if current phase meets progression criteria
  async checkAndUnlockNextPhase(phaseId: string): Promise<{ unlocked: boolean; phaseName?: string }> {
    // Get the current phase to check progress
    const [phase] = await db
      .select()
      .from(sdlcPhases)
      .where(eq(sdlcPhases.id, phaseId));
    
    if (!phase) {
      return { unlocked: false };
    }
    
    // Check if progress is at least 80% (confirmation requirements removed for simpler unlocking)
    if ((phase.progress || 0) < 80) {
      return { unlocked: false }; // Not ready, do nothing
    }
    
    // Get the next phase
    const nextPhaseNumber = phase.phaseNumber + 1;
    
    // Only unlock if next phase exists (phaseNumber 2-6)
    if (nextPhaseNumber > 6) {
      return { unlocked: false }; // No next phase to unlock
    }
    
    const [nextPhase] = await db
      .select()
      .from(sdlcPhases)
      .where(
        and(
          eq(sdlcPhases.projectId, phase.projectId),
          eq(sdlcPhases.phaseNumber, nextPhaseNumber)
        )
      );
    
    if (nextPhase) {
      // Check if phase was previously locked (to avoid showing toast multiple times)
      const wasLocked = nextPhase.status === "not_started" && nextPhase.progress === 0 && nextPhase.phaseNumber > 1;
      
      // Unlock the next phase by setting its status
      await this.updatePhase(phase.projectId, nextPhaseNumber, {
        status: "not_started", // Unlock it (it was locked before)
      });
      
      // Return unlock info only if it was actually locked before
      return { 
        unlocked: wasLocked, 
        phaseName: nextPhase.phaseName 
      };
    }
    
    return { unlocked: false };
  }

  async initializePhaseConfirmations(phaseId: string): Promise<PhaseConfirmation[]> {
    const roles = ["business", "technical", "qa"];
    const confirmations: PhaseConfirmation[] = [];
    
    for (const role of roles) {
      const id = randomUUID();
      await db.insert(phaseConfirmations).values({
        id,
        phaseId,
        confirmerRole: role,
        status: "pending",
      });
      const inserted = await db.select().from(phaseConfirmations).where(eq(phaseConfirmations.id, id)).limit(1);
      if (!inserted[0]) {
        throw new Error("Failed to create phase confirmation");
      }
      confirmations.push(inserted[0]);
    }
    
    return confirmations;
  }

  // Get category completion status for a phase
  async getCategoryCompletionStatus(projectId: string, phaseNumber: number): Promise<{
    hasIssues: boolean;
    hasEpics: boolean;
    hasRequirements: boolean;
    hasBacklog: boolean;
    hasDocuments: boolean;
  }> {
    console.log(`[DEBUG] getCategoryCompletionStatus called for projectId: ${projectId}, phaseNumber: ${phaseNumber}`);
    
    // Count work items in each category
    const [issuesCount] = await db
      .select({ count: count() })
      .from(sdlcIssues)
      .where(and(eq(sdlcIssues.projectId, projectId), eq(sdlcIssues.phaseNumber, phaseNumber)));
    
    const [epicsCount] = await db
      .select({ count: count() })
      .from(sdlcEpics)
      .where(and(eq(sdlcEpics.projectId, projectId), eq(sdlcEpics.phaseNumber, phaseNumber)));
    
    const [requirementsCount] = await db
      .select({ count: count() })
      .from(sdlcRequirements)
      .where(and(eq(sdlcRequirements.projectId, projectId), eq(sdlcRequirements.phaseNumber, phaseNumber)));
    
    const [backlogCount] = await db
      .select({ count: count() })
      .from(sdlcBacklogItems)
      .where(and(eq(sdlcBacklogItems.projectId, projectId), eq(sdlcBacklogItems.phaseNumber, phaseNumber)));
    
    const [documentsCount] = await db
      .select({ count: count() })
      .from(sdlcDocuments)
      .where(and(eq(sdlcDocuments.projectId, projectId), eq(sdlcDocuments.phaseNumber, phaseNumber)));
    
    console.log(`[DEBUG] Category counts - Issues: ${issuesCount?.count}, Epics: ${epicsCount?.count}, Requirements: ${requirementsCount?.count}, Backlog: ${backlogCount?.count}, Documents: ${documentsCount?.count}`);
    
    const result = {
      hasIssues: (Number(issuesCount?.count) || 0) > 0,
      hasEpics: (Number(epicsCount?.count) || 0) > 0,
      hasRequirements: (Number(requirementsCount?.count) || 0) > 0,
      hasBacklog: (Number(backlogCount?.count) || 0) > 0,
      hasDocuments: (Number(documentsCount?.count) || 0) > 0,
    };
    
    console.log(`[DEBUG] Category completion result:`, result);
    
    return result;
  }

  // Calculate phase progress based on category completion (5 categories, each = 20%)
  async calculatePhaseProgress(projectId: string, phaseNumber: number): Promise<number> {
    // Design phase (phase 2) has special progress calculation based on synced design elements
    // Progress is based on 4 design categories: System Architecture, Database Design, UI/UX Design,
    // Component Design (each = 25%)
    if (phaseNumber === 2) {
      const [designAssets] = await db
        .select()
        .from(adoDesignSync)
        .where(eq(adoDesignSync.projectId, projectId));
      
      if (!designAssets) {
        console.log(`[DEBUG] Design phase progress: No synced design assets found = 0%`);
        return 0;
      }
      
      // Count how many design categories have synced data
      const categories = ['System Architecture', 'Database Design', 'UI/UX Design', 'Component Design'];
      let syncedCategories = 0;
      
      for (const category of categories) {
        const metadata = designAssets.syncedMetadata as any;
        if (metadata && metadata[category] && metadata[category].length > 0) {
          syncedCategories++;
        }
      }
      
      // Each category contributes 25% to progress (4 categories total)
      const progress = Math.round((syncedCategories / 4) * 100);
      console.log(`[DEBUG] Design phase progress: ${syncedCategories}/4 categories synced = ${progress}%`);
      return progress;
    }
    
    // Development phase (phase 3) has special progress calculation
    // The phase is interactive and simulated in the frontend (repository creation, code generation, etc.)
    // Since this is a simulated workflow that's always available, Development phase is always 100% complete
    if (phaseNumber === 3) {
      console.log(`[DEBUG] Development phase progress: Simulated interactive workflow = 100%`);
      return 100;
    }
    
    // For other phases, use the standard 5-category system
    const categoryStatus = await this.getCategoryCompletionStatus(projectId, phaseNumber);
    
    // Count how many categories have at least 1 item
    let completedCategories = 0;
    if (categoryStatus.hasIssues) completedCategories++;
    if (categoryStatus.hasEpics) completedCategories++;
    if (categoryStatus.hasRequirements) completedCategories++;
    if (categoryStatus.hasBacklog) completedCategories++;
    if (categoryStatus.hasDocuments) completedCategories++;
    
    // Each category contributes 20% to progress (5 categories total)
    const progress = (completedCategories / 5) * 100;
    
    return progress;
  }

  // Update phase progress automatically after work item changes
  async updatePhaseProgressAutomatically(projectId: string, phaseNumber: number): Promise<{ unlocked: boolean; phaseName?: string }> {
    const progress = await this.calculatePhaseProgress(projectId, phaseNumber);
    
    // Determine status based on progress
    let status: "not_started" | "in_progress" | "completed" = "not_started";
    if (progress > 0 && progress < 100) {
      status = "in_progress";
    } else if (progress === 100) {
      status = "completed";
    }
    
    // Update the phase
    const phase = await this.updatePhase(projectId, phaseNumber, { progress, status });
    
    // Check if this phase is now ready to unlock the next phase
    if (phase?.id) {
      return await this.checkAndUnlockNextPhase(phase.id);
    }
    
    return { unlocked: false };
  }

  async checkPhaseReadyForProgression(phaseId: string): Promise<{ ready: boolean; progress?: number; confirmationsApproved?: number }> {
    // Get the phase to check progress
    const [phase] = await db
      .select()
      .from(sdlcPhases)
      .where(eq(sdlcPhases.id, phaseId));
    
    if (!phase) {
      return { ready: false };
    }
    
    // Check if progress is at least 80%
    const progressCheck = (phase.progress || 0) >= 80;
    
    // Get confirmations
    const confirmations = await this.getConfirmationsByPhaseId(phaseId);
    
    if (confirmations.length !== 3) {
      return { 
        ready: false, 
        progress: phase.progress || 0,
        confirmationsApproved: confirmations.filter(c => c.status === "approved").length
      };
    }
    
    // Check if all confirmations are approved
    const confirmationsCheck = confirmations.every(c => c.status === "approved");
    
    return { 
      ready: progressCheck && confirmationsCheck,
      progress: phase.progress || 0,
      confirmationsApproved: confirmations.filter(c => c.status === "approved").length
    };
  }

  // Design Assets operations
  async createDesignAsset(data: InsertSDLCDesignAsset): Promise<SDLCDesignAsset> {
    const id = randomUUID();
    await db.insert(sdlcDesignAssets).values({ ...data, id });
    const inserted = await db.select().from(sdlcDesignAssets).where(eq(sdlcDesignAssets.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create design asset");
    }
    return inserted[0];
  }

  async getDesignAssets(projectId: string, phaseNumber?: number): Promise<SDLCDesignAsset[]> {
    if (phaseNumber !== undefined) {
      return db
        .select()
        .from(sdlcDesignAssets)
        .where(and(eq(sdlcDesignAssets.projectId, projectId), eq(sdlcDesignAssets.phaseNumber, phaseNumber)))
        .orderBy(sdlcDesignAssets.createdAt);
    }
    return db
      .select()
      .from(sdlcDesignAssets)
      .where(eq(sdlcDesignAssets.projectId, projectId))
      .orderBy(sdlcDesignAssets.createdAt);
  }

  async getDesignAsset(id: string): Promise<SDLCDesignAsset | undefined> {
    const [asset] = await db.select().from(sdlcDesignAssets).where(eq(sdlcDesignAssets.id, id));
    return asset;
  }

  async updateDesignAsset(id: string, data: Partial<InsertSDLCDesignAsset>): Promise<SDLCDesignAsset> {
    await db
      .update(sdlcDesignAssets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcDesignAssets.id, id));
    const updated = await db.select().from(sdlcDesignAssets).where(eq(sdlcDesignAssets.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Design asset not found");
    }
    return updated[0];
  }

  async deleteDesignAsset(id: string): Promise<void> {
    await db.delete(sdlcDesignAssets).where(eq(sdlcDesignAssets.id, id));
  }

  // Sync documents from Requirement & Analysis phase to Design Assets
  async syncDocumentsToDesignAssets(projectId: string): Promise<{ syncedCount: number; assets: SDLCDesignAsset[] }> {
    // Get all documents from phase 1 (Requirement & Analysis)
    const requirementDocs = await this.getDocuments(projectId, 1);
    
    // Get existing synced design assets to avoid duplicates
    const existingAssets = await this.getDesignAssets(projectId, 2);
    const existingSyncedDocIds = new Set(
      existingAssets
        .filter(asset => asset.sourceDocumentId)
        .map(asset => asset.sourceDocumentId)
    );
    
    const newAssets: SDLCDesignAsset[] = [];
    
    // Create design assets for documents that haven't been synced yet
    for (const doc of requirementDocs) {
      if (!existingSyncedDocIds.has(doc.id)) {
        // Convert document content to a data URL for storage
        const contentDataUrl = `data:text/plain;charset=utf-8;base64,${Buffer.from(doc.content || '').toString('base64')}`;
        
        // Determine file type based on document type
        const fileTypeMap: Record<string, string> = {
          'general': 'application/pdf',
          'technical': 'application/pdf',
          'user_guide': 'application/pdf',
          'api_doc': 'application/pdf',
        };
        
        const asset = await this.createDesignAsset({
          projectId,
          phaseNumber: 2, // Design phase
          name: doc.title,
          description: `Synced from Requirement & Analysis phase`,
          fileUrl: contentDataUrl,
          fileType: fileTypeMap[doc.type] || 'application/pdf',
          fileSize: (doc.content || '').length,
          thumbnailUrl: null,
          uploadedBy: 'System',
          source: 'synced_from_requirement',
          sourceDocumentId: doc.id,
        });
        
        newAssets.push(asset);
      }
    }
    
    // Update Design phase progress after syncing
    await this.updatePhaseProgressAutomatically(projectId, 2);
    
    return { syncedCount: newAssets.length, assets: newAssets };
  }

  // Figma Links operations
  async createFigmaLink(data: InsertSDLCFigmaLink): Promise<SDLCFigmaLink> {
    const id = randomUUID();
    await db.insert(sdlcFigmaLinks).values({ ...data, id });
    const inserted = await db.select().from(sdlcFigmaLinks).where(eq(sdlcFigmaLinks.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create Figma link");
    }
    return inserted[0];
  }

  async getFigmaLinks(projectId: string, phaseNumber?: number): Promise<SDLCFigmaLink[]> {
    if (phaseNumber !== undefined) {
      return db
        .select()
        .from(sdlcFigmaLinks)
        .where(and(eq(sdlcFigmaLinks.projectId, projectId), eq(sdlcFigmaLinks.phaseNumber, phaseNumber)))
        .orderBy(sdlcFigmaLinks.createdAt);
    }
    return db
      .select()
      .from(sdlcFigmaLinks)
      .where(eq(sdlcFigmaLinks.projectId, projectId))
      .orderBy(sdlcFigmaLinks.createdAt);
  }

  async getFigmaLink(id: string): Promise<SDLCFigmaLink | undefined> {
    const [link] = await db.select().from(sdlcFigmaLinks).where(eq(sdlcFigmaLinks.id, id));
    return link;
  }

  async updateFigmaLink(id: string, data: Partial<InsertSDLCFigmaLink>): Promise<SDLCFigmaLink> {
    await db
      .update(sdlcFigmaLinks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcFigmaLinks.id, id));
    const updated = await db.select().from(sdlcFigmaLinks).where(eq(sdlcFigmaLinks.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Figma link not found");
    }
    return updated[0];
  }

  async deleteFigmaLink(id: string): Promise<void> {
    await db.delete(sdlcFigmaLinks).where(eq(sdlcFigmaLinks.id, id));
  }

  // Design Reviews operations
  async createDesignReview(data: InsertSDLCDesignReview): Promise<SDLCDesignReview> {
    const id = randomUUID();
    await db.insert(sdlcDesignReviews).values({ ...data, id });
    const inserted = await db.select().from(sdlcDesignReviews).where(eq(sdlcDesignReviews.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create design review");
    }
    return inserted[0];
  }

  async getDesignReviews(projectId: string, phaseNumber?: number): Promise<SDLCDesignReview[]> {
    if (phaseNumber !== undefined) {
      return db
        .select()
        .from(sdlcDesignReviews)
        .where(and(eq(sdlcDesignReviews.projectId, projectId), eq(sdlcDesignReviews.phaseNumber, phaseNumber)))
        .orderBy(sdlcDesignReviews.createdAt);
    }
    return db
      .select()
      .from(sdlcDesignReviews)
      .where(eq(sdlcDesignReviews.projectId, projectId))
      .orderBy(sdlcDesignReviews.createdAt);
  }

  async getDesignReview(id: string): Promise<SDLCDesignReview | undefined> {
    const [review] = await db.select().from(sdlcDesignReviews).where(eq(sdlcDesignReviews.id, id));
    return review;
  }

  async updateDesignReview(id: string, data: Partial<InsertSDLCDesignReview>): Promise<SDLCDesignReview> {
    await db
      .update(sdlcDesignReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcDesignReviews.id, id));
    const updated = await db.select().from(sdlcDesignReviews).where(eq(sdlcDesignReviews.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Design review not found");
    }
    return updated[0];
  }

  async deleteDesignReview(id: string): Promise<void> {
    await db.delete(sdlcDesignReviews).where(eq(sdlcDesignReviews.id, id));
  }

  // ADO Design Sync operations
  async getAdoDesignSync(projectId: string): Promise<AdoDesignSync | undefined> {
    const [sync] = await db
      .select()
      .from(adoDesignSync)
      .where(and(eq(adoDesignSync.projectId, projectId), eq(adoDesignSync.phaseNumber, 2)))
      .limit(1);
    return sync;
  }

  async createAdoDesignSync(data: InsertAdoDesignSync): Promise<AdoDesignSync> {
    const id = randomUUID();
    await db.insert(adoDesignSync).values({ ...data, id });
    const inserted = await db.select().from(adoDesignSync).where(eq(adoDesignSync.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create ADO design sync record");
    }
    return inserted[0];
  }

  async updateAdoDesignSync(id: string, data: Partial<InsertAdoDesignSync>): Promise<AdoDesignSync> {
    await db
      .update(adoDesignSync)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adoDesignSync.id, id));
    const updated = await db.select().from(adoDesignSync).where(eq(adoDesignSync.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("ADO design sync record not found");
    }
    return updated[0];
  }

  async createDesignAssetFromAdo(
    projectId: string,
    phaseNumber: number,
    name: string,
    description: string | null,
    category: string,
    adoWorkItemId: number
  ): Promise<SDLCDesignAsset> {
    const id = randomUUID();
    
    // Create a placeholder file URL (in a real implementation, this would be a document or diagram)
    const fileUrl = `data:text/plain;base64,${Buffer.from(description || name).toString('base64')}`;
    
    await db.insert(sdlcDesignAssets).values({
      id,
      projectId,
      phaseNumber,
      name,
      description,
      fileUrl,
      fileType: 'text/plain',
      fileSize: (description || name).length,
      uploadedBy: 'ADO Sync',
      source: 'ado-sync',
      designCategory: category,
      adoWorkItemId,
      adoSyncedAt: new Date(),
    });

    const inserted = await db.select().from(sdlcDesignAssets).where(eq(sdlcDesignAssets.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create design asset from ADO");
    }
    return inserted[0];
  }

  async syncDesignFromAdo(
    projectId: string,
    categorizedWorkItems: {
      systemArchitecture: any[];
      databaseDesign: any[];
      uiUxDesign: any[];
      componentDesign: any[];
      dataFlowDesign: any[];
      interfaceDesign: any[];
      securityDesign: any[];
    }
  ): Promise<{ syncedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    const categoryMapping: Record<string, string> = {
      systemArchitecture: 'system-architecture',
      databaseDesign: 'database-design',
      uiUxDesign: 'ui-ux-design',
      componentDesign: 'component-design',
      dataFlowDesign: 'data-flow-design',
      interfaceDesign: 'interface-design',
      securityDesign: 'security-design',
    };

    try {
      for (const [category, workItems] of Object.entries(categorizedWorkItems)) {
        const designCategory = categoryMapping[category];
        
        for (const workItem of workItems) {
          try {
            const workItemId = workItem.id;
            const title = workItem.fields?.['System.Title'] || 'Untitled';
            const description = workItem.fields?.['System.Description'] || null;

            // Check if this work item is already synced
            const existing = await db
              .select()
              .from(sdlcDesignAssets)
              .where(and(
                eq(sdlcDesignAssets.projectId, projectId),
                eq(sdlcDesignAssets.adoWorkItemId, workItemId)
              ))
              .limit(1);

            if (existing.length === 0) {
              // Create new design asset
              await this.createDesignAssetFromAdo(
                projectId,
                2, // Design Phase
                title,
                description,
                designCategory,
                workItemId
              );
              syncedCount++;
            } else {
              // Update existing design asset
              await db
                .update(sdlcDesignAssets)
                .set({
                  name: title,
                  description,
                  adoSyncedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(sdlcDesignAssets.id, existing[0].id));
              syncedCount++;
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Failed to sync work item ${workItem.id}: ${errorMsg}`);
            console.error(`[ADO Sync] Error syncing work item ${workItem.id}:`, error);
          }
        }
      }

      return { syncedCount, errors };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Sync failed: ${errorMsg}`);
      return { syncedCount, errors };
    }
  }
}

export const sdlcService = new SDLCService();
