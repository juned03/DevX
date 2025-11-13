import { Epic, Feature, UserStory, Persona } from "@shared/schema";

export interface AzureConfig {
  organization: string;
  project: string;
  pat: string;
}

interface WorkItemCreateRequest {
  op: string;
  path: string;
  value: any;
}

export class AzureDevOpsService {
  private baseUrl: string;
  private headers: Record<string, string>;
  private organization: string;
  private project: string;

  constructor(config: AzureConfig) {
    this.organization = config.organization;
    this.project = config.project;
    this.baseUrl = `https://dev.azure.com/${config.organization}/${config.project}/_apis`;
    
    // Azure DevOps uses Basic authentication with PAT
    // The username part should be empty, followed by colon and PAT
    const authToken = Buffer.from(`:${config.pat}`).toString('base64');
    this.headers = {
      'Content-Type': 'application/json-patch+json',
      'Authorization': `Basic ${authToken}`,
      'Accept': 'application/json'
    };
    
    console.log('[Azure DevOps] Initializing service for org:', config.organization, 'project:', config.project);
    console.log('[Azure DevOps] PAT token configured:', !!config.pat);
    console.log('[Azure DevOps] Base URL:', this.baseUrl);
  }

  private async createWorkItem(type: string, fields: Record<string, any>): Promise<number> {
    const url = `${this.baseUrl}/wit/workitems/$${type}?api-version=7.0`;
    
    const operations: WorkItemCreateRequest[] = Object.entries(fields).map(([key, value]) => ({
      op: 'add',
      path: `/fields/${key}`,
      value
    }));

    console.log(`[Azure DevOps] Creating ${type} with URL:`, url);
    console.log(`[Azure DevOps] Operations:`, JSON.stringify(operations, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(operations)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to create ${type}:`, response.status, errorText);
      
      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error(`Authentication failed (401). Please verify:
1. Your PAT token is valid and not expired
2. The token has "Work Items (Read, Write & Manage)" permissions
3. The organization name "${this.organization}" is correct
4. You have access to the project "${this.project}"`);
      } else if (response.status === 404) {
        throw new Error(`Project not found (404). Please verify:
1. Organization "${this.organization}" exists
2. Project "${this.project}" exists
3. You have access to this project`);
      } else if (response.status === 203) {
        throw new Error(`Non-authoritative information (203). The organization or project may not exist or PAT doesn't have access.`);
      }
      
      throw new Error(`Failed to create ${type}: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Azure DevOps] Successfully created ${type} with ID:`, result.id);
    return result.id;
  }

  async createEpic(epic: Epic): Promise<number> {
    return this.createWorkItem('Epic', {
      'System.Title': epic.title,
      'System.Description': epic.description,
    });
  }

  async createFeature(feature: Feature, epicId: number): Promise<number> {
    const featureId = await this.createWorkItem('Feature', {
      'System.Title': feature.title,
      'System.Description': feature.description,
    });

    // Link feature to epic
    await this.linkWorkItems(featureId, epicId, 'System.LinkTypes.Hierarchy-Reverse');
    
    return featureId;
  }

  async createUserStory(
    story: UserStory, 
    featureId: number,
    persona: Persona
  ): Promise<number> {
    // Build acceptance criteria text for the AC field (HTML format for Azure DevOps)
    // Enhanced to include title and "and" field if present
    const acceptanceCriteriaHtml = story.acceptanceCriteria
      .map((ac, i) => {
        let html = `<div><strong>Criteria ${i + 1}: ${ac.title || 'Acceptance Criterion'}</strong></div>`;
        html += `<div><strong>Given:</strong> ${ac.given}</div>`;
        html += `<div><strong>When:</strong> ${ac.when}</div>`;
        html += `<div><strong>Then:</strong> ${ac.then}</div>`;
        if (ac.and) {
          html += `<div><strong>And:</strong> ${ac.and}</div>`;
        }
        html += '<br/>';
        return html;
      })
      .join('');

    // Build description - only include story description and basic persona info (no focus, pain points, or goals)
    const description = `<div>${story.description}</div><br/><div><strong>Persona:</strong> ${persona.name} (${persona.role})</div>`;

    const storyId = await this.createWorkItem('User Story', {
      'System.Title': story.title,
      'System.Description': description,
      'Microsoft.VSTS.Common.AcceptanceCriteria': acceptanceCriteriaHtml,
      'Microsoft.VSTS.Scheduling.StoryPoints': story.storyPoints,
      'Microsoft.VSTS.Common.Priority': story.priority === 'High' ? 1 : story.priority === 'Medium' ? 2 : 3,
    });

    // Link story to feature
    await this.linkWorkItems(storyId, featureId, 'System.LinkTypes.Hierarchy-Reverse');
    
    // Create subtasks as Task work items and link them as children
    if (story.subtasks && story.subtasks.length > 0) {
      console.log(`[Azure DevOps] Creating ${story.subtasks.length} subtasks for User Story ${storyId}`);
      
      for (const subtaskTitle of story.subtasks) {
        try {
          // Create Task work item for each subtask
          const taskId = await this.createWorkItem('Task', {
            'System.Title': subtaskTitle,
            'System.Description': `Subtask for: ${story.title}`,
            'Microsoft.VSTS.Common.Priority': story.priority === 'High' ? 1 : story.priority === 'Medium' ? 2 : 3,
          });
          
          // Link task as child to user story
          // Using System.LinkTypes.Hierarchy-Forward to make the task a child of the user story
          await this.linkWorkItems(taskId, storyId, 'System.LinkTypes.Hierarchy-Reverse');
          
          console.log(`[Azure DevOps] Created and linked subtask ${taskId} to story ${storyId}: ${subtaskTitle.substring(0, 50)}...`);
        } catch (error) {
          console.error(`[Azure DevOps] Failed to create subtask: ${subtaskTitle}`, error);
          // Continue with other subtasks even if one fails
        }
      }
    }
    
    return storyId;
  }

  private async linkWorkItems(sourceId: number, targetId: number, linkType: string): Promise<void> {
    const url = `${this.baseUrl}/wit/workitems/${sourceId}?api-version=7.0`;
    
    const operation = [{
      op: 'add',
      path: '/relations/-',
      value: {
        rel: linkType,
        url: `${this.baseUrl.replace('/_apis', '')}/_apis/wit/workitems/${targetId}`,
      }
    }];

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(operation)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to link work items ${sourceId} -> ${targetId}: ${errorText}`);
    }
  }

  async pushWorkItems(
    selectedItems: Array<{ type: string; id: string }>,
    epics: Epic[],
    features: Feature[],
    userStories: UserStory[],
    personas: Persona[]
  ): Promise<{ workItemIds: number[]; url: string }> {
    const workItemIds: number[] = [];
    const epicIdMap = new Map<string, number>();
    const featureIdMap = new Map<string, number>();

    // Create epics first
    const selectedEpicIds = selectedItems
      .filter(item => item.type === 'epic')
      .map(item => item.id);
    
    for (const epicId of selectedEpicIds) {
      const epic = epics.find(e => e.id === epicId);
      if (epic) {
        const azureEpicId = await this.createEpic(epic);
        epicIdMap.set(epicId, azureEpicId);
        workItemIds.push(azureEpicId);
      }
    }

    // Create features
    const selectedFeatureIds = selectedItems
      .filter(item => item.type === 'feature')
      .map(item => item.id);
    
    for (const featureId of selectedFeatureIds) {
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        const epicAzureId = epicIdMap.get(feature.epicId);
        if (epicAzureId) {
          const azureFeatureId = await this.createFeature(feature, epicAzureId);
          featureIdMap.set(featureId, azureFeatureId);
          workItemIds.push(azureFeatureId);
        }
      }
    }

    // Create user stories
    const selectedStoryIds = selectedItems
      .filter(item => item.type === 'story')
      .map(item => item.id);
    
    for (const storyId of selectedStoryIds) {
      const story = userStories.find(s => s.id === storyId);
      if (story) {
        const featureAzureId = featureIdMap.get(story.featureId);
        const persona = personas.find(p => p.id === story.personaId);
        
        if (featureAzureId && persona) {
          const azureStoryId = await this.createUserStory(story, featureAzureId, persona);
          workItemIds.push(azureStoryId);
        }
      }
    }

    const config = this.getConfig();
    return {
      workItemIds,
      url: `https://dev.azure.com/${config.organization}/${config.project}/_workitems`
    };
  }

  async pushWikiPages(
    wikiPages: Array<{ id: string; title: string; content: string; pageType: string; order: number }>
  ): Promise<{ pagesCreated: number; wikiUrl?: string; errors: string[]; pageUrls: string[] }> {
    const config = this.getConfig();
    let pagesCreated = 0;
    const errors: string[] = [];
    const pageUrls: string[] = [];

    try {
      // First, try to get the project wiki
      const wikiListUrl = `https://dev.azure.com/${config.organization}/${config.project}/_apis/wiki/wikis?api-version=7.0`;
      
      console.log(`[Azure DevOps] Fetching wikis for project: ${config.project}`);
      
      const wikiListResponse = await fetch(wikiListUrl, {
        method: 'GET',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        }
      });

      if (!wikiListResponse.ok) {
        const errorText = await wikiListResponse.text();
        throw new Error(`Failed to retrieve wikis: ${wikiListResponse.status} - ${errorText}`);
      }

      const wikiListData = await wikiListResponse.json();
      const wikis = wikiListData.value || [];
      
      // Find the project wiki (usually named after the project)
      let projectWiki = wikis.find((w: any) => w.type === 'projectWiki');
      
      if (!projectWiki) {
        throw new Error(`No project wiki found for ${config.project}. Please create a wiki in Azure DevOps first.`);
      }

      const wikiId = projectWiki.id;
      const wikiName = projectWiki.name;
      console.log(`[Azure DevOps] Using wiki: ${wikiName} (ID: ${wikiId})`);
      console.log(`[Azure DevOps] Wiki home URL: https://dev.azure.com/${config.organization}/${config.project}/_wiki/wikis/${wikiName}`);

      // Create or update each wiki page
      for (const page of wikiPages) {
        try {
          // Sanitize page path (remove special characters, replace spaces with hyphens)
          const pagePath = `/${page.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}`;
          
          const pageUrl = `https://dev.azure.com/${config.organization}/${config.project}/_apis/wiki/wikis/${wikiId}/pages?path=${encodeURIComponent(pagePath)}&api-version=7.0`;
          
          const pageContent = {
            content: page.content
          };

          console.log(`[Azure DevOps] Attempting to create/update wiki page: ${page.title} at path: ${pagePath}`);

          // First, try to create the page
          let response = await fetch(pageUrl, {
            method: 'PUT',
            headers: {
              ...this.headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pageContent)
          });

          // If page already exists (status 500 with WikiPageAlreadyExistsException), update it instead
          if (!response.ok && response.status === 500) {
            const errorText = await response.text();
            
            // Check if it's a "page already exists" error
            if (errorText.includes('WikiPageAlreadyExistsException') || errorText.includes('already exists')) {
              console.log(`[Azure DevOps] Page "${page.title}" already exists, fetching eTag for update...`);
              
              // Fetch the existing page to get its eTag
              const getResponse = await fetch(pageUrl, {
                method: 'GET',
                headers: {
                  ...this.headers,
                  'Content-Type': 'application/json'
                }
              });

              if (getResponse.ok) {
                const existingPage = await getResponse.json();
                const eTag = existingPage.eTag;
                
                console.log(`[Azure DevOps] Updating existing page "${page.title}" with eTag: ${eTag}`);
                
                // Update the page with the eTag
                response = await fetch(pageUrl, {
                  method: 'PUT',
                  headers: {
                    ...this.headers,
                    'Content-Type': 'application/json',
                    'If-Match': eTag
                  },
                  body: JSON.stringify(pageContent)
                });
              } else {
                const getErrorText = await getResponse.text();
                const errorMsg = `Failed to fetch existing page "${page.title}" for update: ${getResponse.status} - ${getErrorText}`;
                errors.push(errorMsg);
                console.error(`[Azure DevOps] ${errorMsg}`);
                continue;
              }
            }
          }

          if (response.ok) {
            const pageData = await response.json();
            pagesCreated++;
            
            // Construct the browser-accessible URL for the wiki page
            const pageId = pageData.id;
            const browserUrl = `https://dev.azure.com/${config.organization}/${config.project}/_wiki/wikis/${wikiName}/${pageId}`;
            pageUrls.push(browserUrl);
            
            console.log(`[Azure DevOps] ✅ Successfully created/updated wiki page: ${page.title}`);
            console.log(`[Azure DevOps] Page URL: ${browserUrl}`);
            console.log(`[Azure DevOps] Page Path: ${pagePath}`);
          } else {
            const errorText = await response.text();
            const errorMsg = `Failed to create/update wiki page "${page.title}": ${response.status} - ${errorText}`;
            errors.push(errorMsg);
            console.error(`[Azure DevOps] ❌ ${errorMsg}`);
          }
        } catch (error) {
          const errorMsg = `Error creating/updating wiki page "${page.title}": ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`[Azure DevOps] ❌ ${errorMsg}`);
        }
      }

      const wikiHomeUrl = `https://dev.azure.com/${config.organization}/${config.project}/_wiki/wikis/${wikiName}`;
      console.log(`[Azure DevOps] ✅ Wiki push complete. ${pagesCreated} pages created/updated successfully.`);
      console.log(`[Azure DevOps] 📚 Access all pages at: ${wikiHomeUrl}`);
      
      if (errors.length > 0) {
        console.log(`[Azure DevOps] ⚠️  ${errors.length} errors occurred during wiki push`);
      }

      return {
        pagesCreated,
        wikiUrl: wikiHomeUrl,
        errors,
        pageUrls
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Azure DevOps] Error pushing wiki pages:', errorMsg);
      throw new Error(`Wiki push failed: ${errorMsg}`);
    }
  }

  private getConfig(): { organization: string; project: string } {
    const match = this.baseUrl.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
    return {
      organization: match?.[1] || '',
      project: match?.[2] || ''
    };
  }

  async getProjects(): Promise<any[]> {
    const url = `https://dev.azure.com/${this.organization}/_apis/projects?api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching projects from URL:`, url);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch projects:`, response.status, errorText);
      throw new Error(`Failed to fetch projects: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const projects = result.value || [];
    console.log(`[Azure DevOps] Successfully fetched ${projects.length} projects`);
    return projects;
  }

  async getWorkItems(projectName?: string): Promise<any[]> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/wiql?api-version=7.0`;
    
    // Query to get all work items from the project
    const wiqlQuery = {
      query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${targetProject}' ORDER BY [System.ChangedDate] DESC`
    };
    
    console.log(`[Azure DevOps] Fetching work items for project: ${targetProject}`);

    // WIQL queries require Content-Type: application/json (not json-patch+json)
    const wiqlHeaders = {
      ...this.headers,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: wiqlHeaders,
      body: JSON.stringify(wiqlQuery)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch work items:`, response.status, errorText);
      throw new Error(`Failed to fetch work items: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const workItemIds = result.workItems?.map((item: any) => item.id) || [];
    
    if (workItemIds.length === 0) {
      console.log('[Azure DevOps] No work items found');
      return [];
    }

    // Get work item details in batches (Azure DevOps supports up to 200 items per batch)
    const batchSize = 200;
    const allWorkItems = [];
    
    for (let i = 0; i < workItemIds.length; i += batchSize) {
      const batch = workItemIds.slice(i, i + batchSize);
      const detailsUrl = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems?ids=${batch.join(',')}&api-version=7.0&$expand=all`;
      
      const detailsResponse = await fetch(detailsUrl, {
        method: 'GET',
        headers: this.headers
      });

      if (detailsResponse.ok) {
        const detailsResult = await detailsResponse.json();
        const workItems = detailsResult.value || [];
        allWorkItems.push(...workItems);
      }
    }
    
    console.log(`[Azure DevOps] Successfully fetched ${allWorkItems.length} work items`);
    return allWorkItems;
  }

  async getWorkItemById(workItemId: number, projectName?: string): Promise<any> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems/${workItemId}?api-version=7.0&$expand=all`;
    
    console.log(`[Azure DevOps] Fetching work item ${workItemId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch work item ${workItemId}:`, response.status, errorText);
      throw new Error(`Failed to fetch work item: ${response.status} - ${errorText}`);
    }

    const workItem = await response.json();
    console.log(`[Azure DevOps] Successfully fetched work item: ${workItem.fields['System.Title']}`);
    return workItem;
  }

  async updateWorkItem(workItemId: number, fields: Record<string, any>, projectName?: string): Promise<any> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems/${workItemId}?api-version=7.0`;
    
    // Convert fields to JSON Patch format
    // Filter out null and undefined values
    const operations: WorkItemCreateRequest[] = Object.entries(fields)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => ({
        op: 'replace',
        path: `/fields/${key}`,
        value
      }));

    if (operations.length === 0) {
      throw new Error('No fields to update');
    }

    console.log(`[Azure DevOps] Updating work item ${workItemId} with ${operations.length} field(s)`);
    console.log(`[Azure DevOps] Operations:`, JSON.stringify(operations, null, 2));

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(operations)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to update work item ${workItemId}:`, response.status, errorText);
      
      if (response.status === 401) {
        throw new Error(`Authentication failed (401). Please verify your PAT token has "Work Items (Read, Write & Manage)" permissions`);
      } else if (response.status === 404) {
        throw new Error(`Work item ${workItemId} not found or you don't have access to it`);
      }
      
      throw new Error(`Failed to update work item: ${response.status} - ${errorText}`);
    }

    const workItem = await response.json();
    console.log(`[Azure DevOps] Successfully updated work item ${workItemId}: ${workItem.fields['System.Title']}`);
    return workItem;
  }

  async linkWorkItemsPublic(sourceWorkItemId: number, targetWorkItemId: number, linkType: string = 'System.LinkTypes.Hierarchy-Reverse', projectName?: string): Promise<void> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems/${sourceWorkItemId}?api-version=7.0`;
    
    const operation = [{
      op: 'add',
      path: '/relations/-',
      value: {
        rel: linkType,
        url: `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems/${targetWorkItemId}`,
        attributes: {
          comment: 'Linked via DevPlatform'
        }
      }
    }];

    console.log(`[Azure DevOps] Linking work items: ${sourceWorkItemId} -> ${targetWorkItemId} with type: ${linkType}`);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(operation)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to link work items:`, response.status, errorText);
      throw new Error(`Failed to link work items: ${response.status} - ${errorText}`);
    }

    console.log(`[Azure DevOps] Successfully linked work items`);
  }

  /**
   * Fetch all repositories in the organization
   */
  async getRepositories(projectName?: string): Promise<any[]> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/git/repositories?api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching repositories for project: ${targetProject}`);
    console.log(`[Azure DevOps] Request URL: ${url}`);
    console.log(`[Azure DevOps] Request headers:`, { ...this.headers, Authorization: 'Basic [REDACTED]' });

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch repositories:`, response.status, errorText);
      console.error(`[Azure DevOps] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        throw new Error(`Authentication failed (401). Please verify:
1. Your PAT token is valid and not expired
2. The token has "Code (Read)" permissions
3. The organization "${this.organization}" is correct
4. The project "${targetProject}" exists and you have access to it
5. You're using the RAW PAT token, not base64 encoded

URL attempted: ${url}`);
      }
      
      throw new Error(`Failed to fetch repositories: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const repositories = result.value || [];
    console.log(`[Azure DevOps] Successfully fetched ${repositories.length} repositories`);
    return repositories;
  }

  /**
   * Fetch all pipelines (build definitions) in the project
   */
  async getPipelines(projectName?: string): Promise<any[]> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/build/definitions?api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching pipelines for project: ${targetProject}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch pipelines:`, response.status, errorText);
      throw new Error(`Failed to fetch pipelines: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const pipelines = result.value || [];
    console.log(`[Azure DevOps] Successfully fetched ${pipelines.length} pipelines`);
    return pipelines;
  }

  /**
   * Fetch pull requests for a repository
   */
  async getPullRequests(repositoryId: string, status: string = 'all'): Promise<any[]> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories/${repositoryId}/pullrequests?searchCriteria.status=${status}&api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching pull requests for repository: ${repositoryId}, status: ${status}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch pull requests:`, response.status, errorText);
      throw new Error(`Failed to fetch pull requests: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const pullRequests = result.value || [];
    console.log(`[Azure DevOps] Successfully fetched ${pullRequests.length} pull requests`);
    return pullRequests;
  }

  /**
   * Fetch commits for a repository
   */
  async getCommits(repositoryId: string, limit: number = 50): Promise<any[]> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories/${repositoryId}/commits?$top=${limit}&api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching commits for repository: ${repositoryId}, limit: ${limit}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch commits:`, response.status, errorText);
      throw new Error(`Failed to fetch commits: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const commits = result.value || [];
    console.log(`[Azure DevOps] Successfully fetched ${commits.length} commits`);
    return commits;
  }

  /**
   * Fetch work items with specific types (e.g., User Story, Task, Bug)
   */
  async getWorkItemsByType(workItemType: string, projectName?: string, limit: number = 100): Promise<any[]> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/wiql?api-version=7.0`;
    
    const wiqlQuery = {
      query: `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] FROM WorkItems WHERE [System.TeamProject] = '${targetProject}' AND [System.WorkItemType] = '${workItemType}' ORDER BY [System.ChangedDate] DESC`
    };
    
    console.log(`[Azure DevOps] Fetching work items of type: ${workItemType}`);

    const wiqlHeaders = {
      ...this.headers,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: wiqlHeaders,
      body: JSON.stringify(wiqlQuery)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch work items by type:`, response.status, errorText);
      throw new Error(`Failed to fetch work items by type: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const workItemIds = result.workItems?.map((item: any) => item.id).slice(0, limit) || [];
    
    if (workItemIds.length === 0) {
      return [];
    }

    // Get work item details
    const detailsUrl = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems?ids=${workItemIds.join(',')}&api-version=7.0&$expand=all`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: this.headers
    });

    if (detailsResponse.ok) {
      const detailsResult = await detailsResponse.json();
      const workItems = detailsResult.value || [];
      console.log(`[Azure DevOps] Successfully fetched ${workItems.length} work items of type ${workItemType}`);
      return workItems;
    }

    return [];
  }

  /**
   * Fetch user stories specifically for code generation
   */
  async getUserStories(organization: string, projectName: string): Promise<any[]> {
    return this.getWorkItemsByType('User Story', projectName);
  }

  /**
   * Fetch a work item with all its children (subtasks, etc.)
   */
  async getWorkItemWithChildren(workItemId: number, projectName?: string): Promise<any> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems/${workItemId}?$expand=all&api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching work item with children: ${workItemId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch work item:`, response.status, errorText);
      throw new Error(`Failed to fetch work item: ${response.status} - ${errorText}`);
    }

    const workItem = await response.json();

    // Get child work items if they exist
    const childLinks = workItem.relations?.filter((rel: any) => 
      rel.rel === 'System.LinkTypes.Hierarchy-Forward'
    ) || [];

    if (childLinks.length > 0) {
      const childIds = childLinks.map((link: any) => {
        const match = link.url.match(/workitems\/(\d+)/);
        return match ? match[1] : null;
      }).filter(Boolean);

      if (childIds.length > 0) {
        const childrenUrl = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems?ids=${childIds.join(',')}&api-version=7.0&$expand=all`;
        
        const childrenResponse = await fetch(childrenUrl, {
          method: 'GET',
          headers: this.headers
        });

        if (childrenResponse.ok) {
          const childrenResult = await childrenResponse.json();
          workItem.children = childrenResult.value || [];
        }
      }
    }

    console.log(`[Azure DevOps] Successfully fetched work item ${workItemId} with ${workItem.children?.length || 0} children`);
    return workItem;
  }

  /**
   * Search work items by title or description
   */
  async getBacklogContext(projectName?: string): Promise<{
    epics: any[];
    features: any[];
    userStories: any[];
    tasks: any[];
    bugs: any[];
  }> {
    const targetProject = projectName || this.project;
    
    console.log(`[Azure DevOps] Fetching backlog context for project: ${targetProject}`);

    try {
      // Fetch Epics, Features, User Stories, Tasks, and Bugs in parallel
      const [epics, features, userStories, tasks, bugs] = await Promise.all([
        this.getWorkItemsByType('Epic', targetProject, 50),
        this.getWorkItemsByType('Feature', targetProject, 50),
        this.getWorkItemsByType('User Story', targetProject, 100),
        this.getWorkItemsByType('Task', targetProject, 100),
        this.getWorkItemsByType('Bug', targetProject, 100),
      ]);

      console.log(`[Azure DevOps] Fetched backlog context - Epics: ${epics.length}, Features: ${features.length}, User Stories: ${userStories.length}, Tasks: ${tasks.length}, Bugs: ${bugs.length}`);

      return {
        epics,
        features,
        userStories,
        tasks,
        bugs,
      };
    } catch (error) {
      console.error('[Azure DevOps] Error fetching backlog context:', error);
      throw error;
    }
  }

  async searchWorkItems(searchTerm: string, projectName?: string, limit: number = 50): Promise<any[]> {
    const targetProject = projectName || this.project;
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/wiql?api-version=7.0`;
    
    // Check if search term is a number (ID search)
    const isIdSearch = /^\d+$/.test(searchTerm.trim());
    
    if (isIdSearch) {
      // Search by ID directly
      const workItemId = parseInt(searchTerm.trim());
      console.log(`[Azure DevOps] Searching work item by ID: ${workItemId}`);
      try {
        // Try to get the work item by ID
        const workItem = await this.getWorkItemById(workItemId, projectName);
        console.log(`[Azure DevOps] Found work item #${workItemId}: ${workItem.fields['System.Title']}`);
        return [workItem];
      } catch (error) {
        // If not found, return empty array
        console.log(`[Azure DevOps] Work item ${workItemId} not found`);
        return [];
      }
    }
    
    // Search by title or description
    console.log(`[Azure DevOps] Searching work items with term: ${searchTerm}`);
    const wiqlQuery = {
      query: `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State] FROM WorkItems WHERE [System.TeamProject] = '${targetProject}' AND ([System.Title] CONTAINS '${searchTerm}' OR [System.Description] CONTAINS '${searchTerm}') ORDER BY [System.ChangedDate] DESC`
    };

    const wiqlHeaders = {
      ...this.headers,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: wiqlHeaders,
      body: JSON.stringify(wiqlQuery)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to search work items:`, response.status, errorText);
      throw new Error(`Failed to search work items: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const workItemIds = result.workItems?.map((item: any) => item.id).slice(0, limit) || [];
    
    if (workItemIds.length === 0) {
      return [];
    }

    // Get work item details
    const detailsUrl = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems?ids=${workItemIds.join(',')}&api-version=7.0`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: this.headers
    });

    if (detailsResponse.ok) {
      const detailsResult = await detailsResponse.json();
      const workItems = detailsResult.value || [];
      console.log(`[Azure DevOps] Found ${workItems.length} work items matching '${searchTerm}'`);
      return workItems;
    }

    return [];
  }

  /**
   * Get recent builds/pipeline runs
   */
  async getRecentBuilds(pipelineId?: number, limit: number = 10): Promise<any[]> {
    let url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/build/builds?api-version=7.0&$top=${limit}`;
    
    if (pipelineId) {
      url += `&definitions=${pipelineId}`;
    }
    
    console.log(`[Azure DevOps] Fetching recent builds${pipelineId ? ` for pipeline ${pipelineId}` : ''}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch builds:`, response.status, errorText);
      throw new Error(`Failed to fetch builds: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const builds = result.value || [];
    console.log(`[Azure DevOps] Successfully fetched ${builds.length} builds`);
    return builds;
  }

  /**
   * Create a work item with custom fields - public method for general use
   */
  async createWorkItemPublic(
    workItemType: string,
    fields: Record<string, any>,
    projectName?: string
  ): Promise<any> {
    const targetProject = projectName || this.project;
    const workItemId = await this.createWorkItem(workItemType, fields);
    
    // Fetch and return the created work item details
    const url = `https://dev.azure.com/${this.organization}/${targetProject}/_apis/wit/workitems/${workItemId}?api-version=7.0&$expand=all`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch created work item: ${response.status}`);
    }

    const workItem = await response.json();
    console.log(`[Azure DevOps] Successfully created and fetched work item #${workItemId}`);
    
    return workItem;
  }

  /**
   * Create a work item from chatbot - public method for ADO integration
   */
  async createWorkItemFromChat(
    workItemType: string,
    title: string,
    description: string,
    acceptanceCriteria?: string,
    assignedTo?: string,
    storyPoints?: number,
    priority?: number,
    tags?: string,
    projectName?: string
  ): Promise<any> {
    console.log(`[Azure DevOps] Creating ${workItemType} from chatbot:`, title);

    // Build fields object
    const fields: Record<string, any> = {
      'System.Title': title,
      'System.Description': description,
    };

    // Add optional fields
    if (acceptanceCriteria) {
      fields['Microsoft.VSTS.Common.AcceptanceCriteria'] = acceptanceCriteria;
    }

    if (assignedTo) {
      // Azure DevOps expects the full user identity
      // For now, we'll set it as a string - the API will resolve it
      fields['System.AssignedTo'] = assignedTo;
    }

    if (storyPoints !== undefined && workItemType === 'User Story') {
      fields['Microsoft.VSTS.Scheduling.StoryPoints'] = storyPoints;
    }

    if (priority !== undefined) {
      fields['Microsoft.VSTS.Common.Priority'] = priority;
    }

    if (tags) {
      fields['System.Tags'] = tags;
    }

    // Create the work item
    const workItemId = await this.createWorkItem(workItemType, fields);

    // Fetch and return the created work item details
    const url = `${this.baseUrl}/wit/workitems/${workItemId}?api-version=7.0`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch created work item: ${response.status}`);
    }

    const workItem = await response.json();
    console.log(`[Azure DevOps] Successfully created and fetched work item #${workItemId}`);
    
    return workItem;
  }

  /**
   * Fetch repository tree structure
   * @param repositoryId - The ADO repository ID
   * @param scopePath - The path to start from (default: /)
   * @param recursionLevel - How deep to recurse (default: Full)
   */
  async getRepositoryTree(
    repositoryId: string,
    scopePath: string = '/',
    recursionLevel: string = 'Full'
  ): Promise<any> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories/${repositoryId}/items?scopePath=${encodeURIComponent(scopePath)}&recursionLevel=${recursionLevel}&api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching repository tree:`, url);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch repository tree:`, response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid PAT token or insufficient permissions');
      } else if (response.status === 404) {
        throw new Error('Repository not found');
      } else if (response.status === 403) {
        throw new Error('PAT token needs Code (Read) permission');
      }
      
      throw new Error(`Failed to fetch repository tree: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Azure DevOps] Successfully fetched repository tree, item count:`, result.count);
    
    return result;
  }

  /**
   * Fetch file content from repository
   * @param repositoryId - The ADO repository ID
   * @param filePath - The path to the file
   */
  async getFileContent(
    repositoryId: string,
    filePath: string
  ): Promise<string> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories/${repositoryId}/items?path=${encodeURIComponent(filePath)}&api-version=7.0`;
    
    console.log(`[Azure DevOps] Fetching file content:`, url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.headers,
        'Accept': 'text/plain'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Azure DevOps] Failed to fetch file content:`, response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid PAT token or insufficient permissions');
      } else if (response.status === 404) {
        throw new Error('File not found');
      }
      
      throw new Error(`Failed to fetch file content: ${response.status}`);
    }

    const content = await response.text();
    console.log(`[Azure DevOps] Successfully fetched file content, size:`, content.length);
    
    return content;
  }

  /**
   * Categorize work item based on title, description, and tags
   * Returns one of the 7 design categories
   */
  private categorizeWorkItem(workItem: any): string | null {
    const title = (workItem.fields?.['System.Title'] || '').toLowerCase();
    const description = (workItem.fields?.['System.Description'] || '').toLowerCase();
    const tags = (workItem.fields?.['System.Tags'] || '').toLowerCase();
    const combined = `${title} ${description} ${tags}`;

    // Category keywords mapping
    const categoryKeywords = {
      'system-architecture': ['system architecture', 'architecture', 'infrastructure', 'system design', 'technical architecture', 'solution architecture'],
      'database-design': ['database', 'schema', 'data model', 'erd', 'entity relationship', 'db design', 'database structure', 'table design'],
      'ui-ux-design': ['ui', 'ux', 'user interface', 'user experience', 'figma', 'wireframe', 'mockup', 'prototype', 'design'],
      'component-design': ['component', 'module design', 'component architecture', 'ui component', 'reusable component'],
      'data-flow-design': ['data flow', 'workflow', 'process flow', 'data pipeline', 'data movement', 'flow diagram'],
      'interface-design': ['api', 'interface', 'api design', 'endpoint', 'rest api', 'graphql', 'integration'],
      'security-design': ['security', 'authentication', 'authorization', 'encryption', 'security design', 'access control', 'security architecture']
    };

    // Check each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (combined.includes(keyword)) {
          return category;
        }
      }
    }

    return null;
  }

  /**
   * Fetch design-related work items from Requirement & Analysis phase
   * Categorizes them into the 7 design element types
   */
  async getDesignWorkItems(projectName?: string): Promise<{
    systemArchitecture: any[];
    databaseDesign: any[];
    uiUxDesign: any[];
    componentDesign: any[];
    dataFlowDesign: any[];
    interfaceDesign: any[];
    securityDesign: any[];
  }> {
    const targetProject = projectName || this.project;
    
    console.log(`[Azure DevOps] Fetching design-related work items for project: ${targetProject}`);

    try {
      // Fetch all work items that could be design-related
      // We'll search for Requirements, User Stories, and Tasks that mention design
      const workItems = await Promise.all([
        this.getWorkItemsByType('Requirement', targetProject, 100),
        this.getWorkItemsByType('User Story', targetProject, 100),
        this.getWorkItemsByType('Epic', targetProject, 50),
      ]);

      const allWorkItems = workItems.flat();
      
      console.log(`[Azure DevOps] Fetched ${allWorkItems.length} total work items for categorization`);

      // Categorize work items
      const categorized = {
        systemArchitecture: [] as any[],
        databaseDesign: [] as any[],
        uiUxDesign: [] as any[],
        componentDesign: [] as any[],
        dataFlowDesign: [] as any[],
        interfaceDesign: [] as any[],
        securityDesign: [] as any[],
      };

      for (const workItem of allWorkItems) {
        const category = this.categorizeWorkItem(workItem);
        
        if (category) {
          const categoryKey = category.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          if (categorized[categoryKey as keyof typeof categorized]) {
            categorized[categoryKey as keyof typeof categorized].push(workItem);
          }
        }
      }

      console.log(`[Azure DevOps] Categorized work items:`, {
        systemArchitecture: categorized.systemArchitecture.length,
        databaseDesign: categorized.databaseDesign.length,
        uiUxDesign: categorized.uiUxDesign.length,
        componentDesign: categorized.componentDesign.length,
        dataFlowDesign: categorized.dataFlowDesign.length,
        interfaceDesign: categorized.interfaceDesign.length,
        securityDesign: categorized.securityDesign.length,
      });

      return categorized;
    } catch (error) {
      console.error('[Azure DevOps] Error fetching design work items:', error);
      throw error;
    }
  }

  /**
   * Push a commit to an Azure DevOps Git repository
   * Creates a new file with the generated code in the specified branch
   */
  async pushCommit(params: {
    repositoryName: string;
    branchName: string;
    fileName: string;
    fileContent: string;
    commitMessage: string;
    authorName: string;
  }): Promise<{
    commitId: string;
    url: string;
  }> {
    const { repositoryName, branchName, fileName, fileContent, commitMessage, authorName } = params;
    
    console.log(`[Azure DevOps] Pushing commit to repository: ${repositoryName}, branch: ${branchName}`);

    try {
      // First, get the repository ID
      const reposUrl = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories?api-version=7.0`;
      const reposResponse = await fetch(reposUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.headers['Authorization'],
          'Accept': 'application/json'
        }
      });

      if (!reposResponse.ok) {
        throw new Error(`Failed to fetch repositories: ${reposResponse.statusText}`);
      }

      const reposData = await reposResponse.json();
      const repository = reposData.value.find((repo: any) => repo.name === repositoryName);
      
      if (!repository) {
        throw new Error(`Repository "${repositoryName}" not found`);
      }

      // Get the latest commit on the branch to get the old object ID
      const branchUrl = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories/${repository.id}/refs?filter=heads/${branchName}&api-version=7.0`;
      const branchResponse = await fetch(branchUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.headers['Authorization'],
          'Accept': 'application/json'
        }
      });

      if (!branchResponse.ok) {
        throw new Error(`Failed to fetch branch: ${branchResponse.statusText}`);
      }

      const branchData = await branchResponse.json();
      const oldObjectId = branchData.value[0]?.objectId;

      if (!oldObjectId) {
        throw new Error(`Branch "${branchName}" not found`);
      }

      // Create the push request
      const pushUrl = `https://dev.azure.com/${this.organization}/${this.project}/_apis/git/repositories/${repository.id}/pushes?api-version=7.0`;
      
      const pushData = {
        refUpdates: [
          {
            name: `refs/heads/${branchName}`,
            oldObjectId: oldObjectId
          }
        ],
        commits: [
          {
            comment: commitMessage,
            author: {
              name: authorName,
              email: `${authorName.toLowerCase().replace(/\s+/g, '.')}@devplatform.local`,
              date: new Date().toISOString()
            },
            changes: [
              {
                changeType: "add",
                item: {
                  path: `/${fileName}`
                },
                newContent: {
                  content: fileContent,
                  contentType: "rawtext"
                }
              }
            ]
          }
        ]
      };

      const pushResponse = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.headers['Authorization'],
          'Accept': 'application/json'
        },
        body: JSON.stringify(pushData)
      });

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        console.error(`[Azure DevOps] Failed to push commit:`, pushResponse.status, errorText);
        throw new Error(`Failed to push commit: ${pushResponse.statusText}`);
      }

      const pushResult = await pushResponse.json();
      const commitId = pushResult.commits[0].commitId;
      const url = `https://dev.azure.com/${this.organization}/${this.project}/_git/${repositoryName}/commit/${commitId}`;

      console.log(`[Azure DevOps] Successfully pushed commit: ${commitId}`);
      console.log(`[Azure DevOps] Commit URL: ${url}`);

      return {
        commitId,
        url
      };
    } catch (error) {
      console.error('[Azure DevOps] Error pushing commit:', error);
      throw error;
    }
  }
}
