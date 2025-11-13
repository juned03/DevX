import { type User, type InsertUser, type AdoSettings, type InsertAdoSettings, type ArtifactOrganization, type InsertArtifactOrganization, type WikiPage, type InsertWikiPage, type GoldenRepoOrganization, type InsertGoldenRepoOrganization, type Organization, type InsertOrganization, type Project, type InsertProject,  type Persona, type InsertPersona } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { adoSettings, artifactOrganizations, wikiPages, goldenRepoOrganizations, organizations, projects, goldenRepositories, sdlcProjects, sdlcPhases, sdlcIssues, sdlcEpics, sdlcRequirements, sdlcBacklogItems, sdlcDocuments, developmentRepositories, developmentBranches, sdlcCode, sdlcCommits, sdlcPreviews, insertDevelopmentRepositorySchema, insertDevelopmentBranchSchema, insertSDLCCodeSchema, insertSDLCCommitSchema, insertSDLCPreviewSchema, personas, insertPersonaSchema } from "@shared/schema";
import { eq, count, sql } from "drizzle-orm";
import type { z } from "zod";
import { encryptPAT, decryptPAT } from "./crypto-utils";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdoSettings(): Promise<AdoSettings | undefined>;
  createAdoSettings(data: InsertAdoSettings): Promise<AdoSettings>;
  updateAdoSettings(id: string, data: Partial<InsertAdoSettings>): Promise<AdoSettings>;
  getArtifactOrganizations(): Promise<ArtifactOrganization[]>;
  getArtifactOrganization(id: string): Promise<ArtifactOrganization | undefined>;
  createArtifactOrganization(data: InsertArtifactOrganization): Promise<ArtifactOrganization>;
  updateArtifactOrganization(id: string, data: Partial<InsertArtifactOrganization>): Promise<ArtifactOrganization>;
  deleteArtifactOrganization(id: string): Promise<void>;
  getGoldenRepoOrganizations(): Promise<GoldenRepoOrganization[]>;
  getGoldenRepoOrganization(id: string): Promise<GoldenRepoOrganization | undefined>;
  createGoldenRepoOrganization(data: InsertGoldenRepoOrganization): Promise<GoldenRepoOrganization>;
  updateGoldenRepoOrganization(id: string, data: Partial<InsertGoldenRepoOrganization>): Promise<GoldenRepoOrganization>;
  deleteGoldenRepoOrganization(id: string): Promise<void>;
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(data: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getDashboardMetrics(): Promise<any>;
  // Development Repositories
  getDevelopmentRepositories(projectId: string): Promise<any[]>;
  getDevelopmentRepository(id: string): Promise<any | undefined>;
  createDevelopmentRepository(data: z.infer<typeof insertDevelopmentRepositorySchema>): Promise<any>;
  // Development Branches
  getDevelopmentBranches(repositoryId: string): Promise<any[]>;
  getDevelopmentBranch(id: string): Promise<any | undefined>;
  createDevelopmentBranch(data: z.infer<typeof insertDevelopmentBranchSchema>): Promise<any>;
  updateBranchActive(branchId: string, isActive: boolean): Promise<any>;
  updateBranchCommitCount(branchId: string, count: number): Promise<any>;
  // Development Code
  getCode(repositoryId: string, branchId: string): Promise<any[]>;
  createCode(data: z.infer<typeof insertSDLCCodeSchema>): Promise<any>;
  // Development Commits
  getCommits(repositoryId: string, branchId?: string): Promise<any[]>;
  createCommit(data: z.infer<typeof insertSDLCCommitSchema>): Promise<any>;
  // Development Preview
  getPreview(repositoryId: string): Promise<any | undefined>;
  createPreview(data: z.infer<typeof insertSDLCPreviewSchema>): Promise<any>;
  updatePreview(id: string, data: Partial<z.infer<typeof insertSDLCPreviewSchema>>): Promise<any>;
  // Personas
  getPersonas(): Promise<Persona[]>;
  getPersona(id: string): Promise<Persona | undefined>;
  createPersona(data: InsertPersona): Promise<Persona>;
  updatePersona(id: string, data: Partial<InsertPersona>): Promise<Persona>;
  deletePersona(id: string): Promise<void>;
  initializeDefaultPersonas(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAdoSettings(): Promise<AdoSettings | undefined> {
    const settings = await db.select().from(adoSettings).limit(1);
    return settings[0];
  }

  async createAdoSettings(data: InsertAdoSettings): Promise<AdoSettings> {
    const id = randomUUID();
    // Encrypt PAT token before storing
    const encryptedData = {
      ...data,
      id,
      patToken: data.patToken ? encryptPAT(data.patToken) : null,
    };
    
    await db.insert(adoSettings).values(encryptedData);
    const inserted = await db.select().from(adoSettings).where(eq(adoSettings.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create ADO settings");
    }
    return inserted[0];
  }

  async updateAdoSettings(id: string, data: Partial<InsertAdoSettings>): Promise<AdoSettings> {
    // Encrypt PAT token if provided
    const encryptedData: any = { ...data };
    if (data.patToken !== undefined) {
      encryptedData.patToken = data.patToken ? encryptPAT(data.patToken) : null;
    }
    
    await db
      .update(adoSettings)
      .set({
        ...encryptedData,
        updatedAt: new Date(),
      })
      .where(eq(adoSettings.id, id));
    
    const updated = await db.select().from(adoSettings).where(eq(adoSettings.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("ADO settings not found");
    }
    
    return updated[0];
  }

  async getArtifactOrganizations(): Promise<ArtifactOrganization[]> {
    return await db.select().from(artifactOrganizations);
  }

  async getArtifactOrganization(id: string): Promise<ArtifactOrganization | undefined> {
    const result = await db.select().from(artifactOrganizations).where(eq(artifactOrganizations.id, id)).limit(1);
    return result[0];
  }

  async createArtifactOrganization(data: InsertArtifactOrganization): Promise<ArtifactOrganization> {
    const id = randomUUID();
    // Encrypt PAT token before storing
    const encryptedData = {
      ...data,
      id,
      patToken: data.patToken ? encryptPAT(data.patToken) : null,
    };
    
    await db.insert(artifactOrganizations).values(encryptedData);
    const inserted = await db.select().from(artifactOrganizations).where(eq(artifactOrganizations.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create artifact organization");
    }
    return inserted[0];
  }

  async updateArtifactOrganization(id: string, data: Partial<InsertArtifactOrganization>): Promise<ArtifactOrganization> {
    // Encrypt PAT token if provided
    const encryptedData: any = { ...data };
    if (data.patToken !== undefined) {
      encryptedData.patToken = data.patToken ? encryptPAT(data.patToken) : null;
    }
    
    await db
      .update(artifactOrganizations)
      .set({
        ...encryptedData,
        updatedAt: new Date(),
      })
      .where(eq(artifactOrganizations.id, id));
    
    const updated = await db.select().from(artifactOrganizations).where(eq(artifactOrganizations.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Artifact organization not found");
    }
    
    return updated[0];
  }

  async deleteArtifactOrganization(id: string): Promise<void> {
    await db.delete(artifactOrganizations).where(eq(artifactOrganizations.id, id));
  }

  // Golden Repo Organizations CRUD operations
  async getGoldenRepoOrganizations(): Promise<GoldenRepoOrganization[]> {
    return await db.select().from(goldenRepoOrganizations);
  }

  async getGoldenRepoOrganization(id: string): Promise<GoldenRepoOrganization | undefined> {
    const result = await db.select().from(goldenRepoOrganizations).where(eq(goldenRepoOrganizations.id, id)).limit(1);
    return result[0];
  }

  async createGoldenRepoOrganization(data: InsertGoldenRepoOrganization): Promise<GoldenRepoOrganization> {
    const id = randomUUID();
    // Encrypt PAT token before storing
    const encryptedData = {
      ...data,
      id,
      patToken: data.patToken ? encryptPAT(data.patToken) : null,
    };
    
    await db.insert(goldenRepoOrganizations).values(encryptedData);
    const inserted = await db.select().from(goldenRepoOrganizations).where(eq(goldenRepoOrganizations.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create golden repo organization");
    }
    return inserted[0];
  }

  async updateGoldenRepoOrganization(id: string, data: Partial<InsertGoldenRepoOrganization>): Promise<GoldenRepoOrganization> {
    // Encrypt PAT token if provided
    const encryptedData: any = { ...data };
    if (data.patToken !== undefined) {
      encryptedData.patToken = data.patToken ? encryptPAT(data.patToken) : null;
    }
    
    await db
      .update(goldenRepoOrganizations)
      .set({
        ...encryptedData,
        updatedAt: new Date(),
      })
      .where(eq(goldenRepoOrganizations.id, id));
    
    const updated = await db.select().from(goldenRepoOrganizations).where(eq(goldenRepoOrganizations.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Golden repo organization not found");
    }
    
    return updated[0];
  }

  async deleteGoldenRepoOrganization(id: string): Promise<void> {
    await db.delete(goldenRepoOrganizations).where(eq(goldenRepoOrganizations.id, id));
  }

  // Wiki Pages CRUD operations
  async createWikiPage(data: InsertWikiPage): Promise<WikiPage> {
    const id = randomUUID();
    await db.insert(wikiPages).values({ ...data, id });
    const inserted = await db.select().from(wikiPages).where(eq(wikiPages.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create wiki page");
    }
    return inserted[0];
  }

  async getWikiPagesBySession(sessionId: string): Promise<WikiPage[]> {
    const result = await db
      .select()
      .from(wikiPages)
      .where(eq(wikiPages.sessionId, sessionId))
      .orderBy(wikiPages.order);
    return result;
  }

  async getWikiPagesByProject(projectId: string): Promise<WikiPage[]> {
    const result = await db
      .select()
      .from(wikiPages)
      .where(eq(wikiPages.projectId, projectId))
      .orderBy(wikiPages.order);
    return result;
  }

  async getWikiPage(id: string): Promise<WikiPage | undefined> {
    const result = await db
      .select()
      .from(wikiPages)
      .where(eq(wikiPages.id, id))
      .limit(1);
    return result[0];
  }

  async deleteWikiPage(id: string): Promise<void> {
    await db.delete(wikiPages).where(eq(wikiPages.id, id));
  }

  async deleteWikiPagesBySession(sessionId: string): Promise<void> {
    await db.delete(wikiPages).where(eq(wikiPages.sessionId, sessionId));
  }

  // Organizations CRUD operations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async createOrganization(data: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    await db.insert(organizations).values({ ...data, id });
    const inserted = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create organization");
    }
    return inserted[0];
  }

  async updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization> {
    await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id));
    
    const updated = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Organization not found");
    }
    
    return updated[0];
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  // Projects CRUD operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async createProject(data: InsertProject): Promise<Project> {
    const id = randomUUID();
    await db.insert(projects).values({ ...data, id });
    const inserted = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create project");
    }
    return inserted[0];
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));
    
    const updated = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Project not found");
    }
    
    return updated[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Personas CRUD operations
  async getPersonas(): Promise<Persona[]> {
    try {
      console.log("[Storage] Fetching personas from database...");
      const result = await db.select().from(personas);
      console.log("[Storage] Raw database result:", JSON.stringify(result, null, 2));
      // Convert database format to Persona format
      const mappedPersonas = result.map(p => {
        // Handle both camelCase and snake_case from database
        const dbRow = p as any;
        return {
          id: p.id,
          name: p.name,
          role: p.role,
          color: p.color,
          focus: p.focus,
          painPoints: (dbRow.pain_points || dbRow.painPoints || []) as string[],
          goals: (dbRow.goals || []) as string[],
        };
      });
      console.log("[Storage] Mapped personas:", JSON.stringify(mappedPersonas, null, 2));
      return mappedPersonas;
    } catch (error) {
      console.error("[Storage] Error fetching personas:", error);
      throw error;
    }
  }

  async getPersona(id: string): Promise<Persona | undefined> {
    const result = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    const p = result[0];
    const dbRow = p as any;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      color: p.color,
      focus: p.focus,
      painPoints: (dbRow.pain_points || dbRow.painPoints || []) as string[],
      goals: (dbRow.goals || []) as string[],
    };
  }

  async createPersona(data: InsertPersona): Promise<Persona> {
    const id = randomUUID();
    await db.insert(personas).values({ 
      ...data, 
      id,
      painPoints: data.painPoints as any,
      goals: data.goals as any
    });
    const inserted = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create persona");
    }
    const p = inserted[0];
    const dbRow = p as any;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      color: p.color,
      focus: p.focus,
      painPoints: (dbRow.pain_points || dbRow.painPoints || []) as string[],
      goals: (dbRow.goals || []) as string[],
    };
  }

  async updatePersona(id: string, data: Partial<InsertPersona>): Promise<Persona> {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.painPoints) {
      updateData.painPoints = data.painPoints as any;
    }
    if (data.goals) {
      updateData.goals = data.goals as any;
    }
    
    await db
      .update(personas)
      .set(updateData)
      .where(eq(personas.id, id));
    
    const updated = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Persona not found");
    }
    
    const p = updated[0];
    const dbRow = p as any;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      color: p.color,
      focus: p.focus,
      painPoints: (dbRow.pain_points || dbRow.painPoints || []) as string[],
      goals: (dbRow.goals || []) as string[],
    };
  }

  async deletePersona(id: string): Promise<void> {
    await db.delete(personas).where(eq(personas.id, id));
  }

  async initializeDefaultPersonas(): Promise<void> {
    try {
      console.log("[Storage] Checking if personas table exists and has data...");
      // Check if personas already exist
      const existing = await db.select().from(personas).limit(1);
      if (existing.length > 0) {
        console.log("[Storage] Personas already initialized");
        return;
      }

      console.log("[Storage] Initializing default personas...");
    
      const defaultPersonas: InsertPersona[] = [
      {
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
        ],
        isDefault: 1
      },
      {
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
        ],
        isDefault: 1
      },
      {
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
        ],
        isDefault: 1
      },
      {
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
        ],
        isDefault: 1
      }
    ];

    for (const persona of defaultPersonas) {
      await this.createPersona(persona);
    }
    
    console.log("[Storage] Default personas initialized successfully");
    } catch (error) {
      console.error("[Storage] Error initializing personas:", error);
      throw error;
    }
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<any> {
    try {
      const [
        orgCount,
        projectCount,
        sdlcProjectCount,
        goldenRepoCount,
        wikiPageCount,
        phaseCount,
        issueCount,
        epicCount,
        requirementCount,
        backlogCount,
        documentCount,
        activePhases,
        completedPhases,
        recentProjects,
        recentOrganizations
      ] = await Promise.all([
        db.select({ count: count() }).from(organizations),
        db.select({ count: count() }).from(projects),
        db.select({ count: count() }).from(sdlcProjects),
        db.select({ count: count() }).from(goldenRepositories),
        db.select({ count: count() }).from(wikiPages),
        db.select({ count: count() }).from(sdlcPhases),
        db.select({ count: count() }).from(sdlcIssues),
        db.select({ count: count() }).from(sdlcEpics),
        db.select({ count: count() }).from(sdlcRequirements),
        db.select({ count: count() }).from(sdlcBacklogItems),
        db.select({ count: count() }).from(sdlcDocuments),
        db.select({ count: count() }).from(sdlcPhases).where(sql`status = 'in_progress'`),
        db.select({ count: count() }).from(sdlcPhases).where(sql`status = 'completed'`),
        db.select().from(sdlcProjects).orderBy(sql`created_at DESC`).limit(5),
        db.select().from(organizations).orderBy(sql`created_at DESC`).limit(5),
      ]);

      const totalWorkItems = 
        (issueCount[0]?.count || 0) + 
        (epicCount[0]?.count || 0) + 
        (requirementCount[0]?.count || 0) + 
        (backlogCount[0]?.count || 0) + 
        (documentCount[0]?.count || 0);

      return {
        organizations: orgCount[0]?.count || 0,
        projects: projectCount[0]?.count || 0,
        sdlcProjects: sdlcProjectCount[0]?.count || 0,
        goldenRepositories: goldenRepoCount[0]?.count || 0,
        totalWorkItems,
        workItems: {
          issues: issueCount[0]?.count || 0,
          epics: epicCount[0]?.count || 0,
          requirements: requirementCount[0]?.count || 0,
          backlog: backlogCount[0]?.count || 0,
          documents: documentCount[0]?.count || 0,
        },
        wikiPages: wikiPageCount[0]?.count || 0,
        phases: {
          total: phaseCount[0]?.count || 0,
          active: activePhases[0]?.count || 0,
          completed: completedPhases[0]?.count || 0,
        },
        recentProjects: recentProjects || [],
        recentOrganizations: recentOrganizations || [],
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      return {
        organizations: 0,
        projects: 0,
        sdlcProjects: 0,
        goldenRepositories: 0,
        totalWorkItems: 0,
        workItems: {
          issues: 0,
          epics: 0,
          requirements: 0,
          backlog: 0,
          documents: 0,
        },
        wikiPages: 0,
        phases: {
          total: 0,
          active: 0,
          completed: 0,
        },
        recentProjects: [],
        recentOrganizations: [],
      };
    }
  }

  // Development Repositories
  async getDevelopmentRepositories(projectId: string): Promise<any[]> {
    return await db.select().from(developmentRepositories).where(eq(developmentRepositories.projectId, projectId));
  }

  async getDevelopmentRepository(id: string): Promise<any | undefined> {
    const result = await db.select().from(developmentRepositories).where(eq(developmentRepositories.id, id)).limit(1);
    return result[0];
  }

  async createDevelopmentRepository(data: z.infer<typeof insertDevelopmentRepositorySchema>): Promise<any> {
    const id = randomUUID();
    await db.insert(developmentRepositories).values({ ...data, id });
    const inserted = await db.select().from(developmentRepositories).where(eq(developmentRepositories.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create development repository");
    }
    return inserted[0];
  }

  // Development Branches
  async getDevelopmentBranches(repositoryId: string): Promise<any[]> {
    return await db.select().from(developmentBranches).where(eq(developmentBranches.repositoryId, repositoryId));
  }

  async createDevelopmentBranch(data: z.infer<typeof insertDevelopmentBranchSchema>): Promise<any> {
    const id = randomUUID();
    await db.insert(developmentBranches).values({ ...data, id });
    const inserted = await db.select().from(developmentBranches).where(eq(developmentBranches.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create development branch");
    }
    return inserted[0];
  }

  async getDevelopmentBranch(id: string): Promise<any | undefined> {
    const result = await db.select().from(developmentBranches).where(eq(developmentBranches.id, id)).limit(1);
    return result[0];
  }

  async updateBranchActive(branchId: string, isActive: boolean): Promise<any> {
    await db
      .update(developmentBranches)
      .set({ isDefault: isActive ? 1 : 0, updatedAt: new Date() })
      .where(eq(developmentBranches.id, branchId));
    
    const updated = await db.select().from(developmentBranches).where(eq(developmentBranches.id, branchId)).limit(1);
    if (!updated[0]) {
      throw new Error("Branch not found");
    }
    return updated[0];
  }

  async updateBranchCommitCount(branchId: string, count: number): Promise<any> {
    await db
      .update(developmentBranches)
      .set({ commits: count, lastCommitAt: new Date(), updatedAt: new Date() })
      .where(eq(developmentBranches.id, branchId));
    
    const updated = await db.select().from(developmentBranches).where(eq(developmentBranches.id, branchId)).limit(1);
    if (!updated[0]) {
      throw new Error("Branch not found");
    }
    return updated[0];
  }

  // Development Code
  async getCode(repositoryId: string, branchId: string): Promise<any[]> {
    return await db.select()
      .from(sdlcCode)
      .where(
        sql`${sdlcCode.repositoryId} = ${repositoryId} AND ${sdlcCode.branchId} = ${branchId}`
      );
  }

  async createCode(data: z.infer<typeof insertSDLCCodeSchema>): Promise<any> {
    const id = randomUUID();
    await db.insert(sdlcCode).values({ ...data, id });
    const inserted = await db.select().from(sdlcCode).where(eq(sdlcCode.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create code");
    }
    return inserted[0];
  }

  // Development Commits
  async getCommits(repositoryId: string, branchId?: string): Promise<any[]> {
    if (branchId) {
      return await db.select()
        .from(sdlcCommits)
        .where(
          sql`${sdlcCommits.repositoryId} = ${repositoryId} AND ${sdlcCommits.branchId} = ${branchId}`
        )
        .orderBy(sql`${sdlcCommits.createdAt} DESC`);
    }
    return await db.select()
      .from(sdlcCommits)
      .where(eq(sdlcCommits.repositoryId, repositoryId))
      .orderBy(sql`${sdlcCommits.createdAt} DESC`);
  }

  async createCommit(data: z.infer<typeof insertSDLCCommitSchema>): Promise<any> {
    const id = randomUUID();
    await db.insert(sdlcCommits).values({ ...data, id });
    const inserted = await db.select().from(sdlcCommits).where(eq(sdlcCommits.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create commit");
    }
    return inserted[0];
  }

  // Development Preview
  async getPreview(repositoryId: string): Promise<any | undefined> {
    const result = await db.select()
      .from(sdlcPreviews)
      .where(eq(sdlcPreviews.repositoryId, repositoryId))
      .limit(1);
    return result[0];
  }

  async createPreview(data: z.infer<typeof insertSDLCPreviewSchema>): Promise<any> {
    const id = randomUUID();
    await db.insert(sdlcPreviews).values({ ...data, id });
    const inserted = await db.select().from(sdlcPreviews).where(eq(sdlcPreviews.id, id)).limit(1);
    if (!inserted[0]) {
      throw new Error("Failed to create preview");
    }
    return inserted[0];
  }

  async updatePreview(id: string, data: Partial<z.infer<typeof insertSDLCPreviewSchema>>): Promise<any> {
    await db
      .update(sdlcPreviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdlcPreviews.id, id));
    
    const updated = await db.select().from(sdlcPreviews).where(eq(sdlcPreviews.id, id)).limit(1);
    if (!updated[0]) {
      throw new Error("Preview not found");
    }
    return updated[0];
  }
}

export const storage = new MemStorage();
