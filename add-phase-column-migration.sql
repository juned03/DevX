-- Migration: Add phase column to wiki_pages table
-- Date: 2025-11-12
-- Description: Adds SDLC phase tracking to wiki documentation pages

-- Add the phase column with default value
ALTER TABLE wiki_pages 
ADD COLUMN phase TEXT NOT NULL DEFAULT 'reference' 
COMMENT 'SDLC phase: planning, requirements, design, implementation, testing, deployment, reference'
AFTER page_type;

-- Verify the column was added
DESCRIBE wiki_pages;

-- Optional: Update existing records based on pageType if any exist
-- This maps old page types to appropriate phases
UPDATE wiki_pages SET phase = 'planning' WHERE page_type IN ('overview', 'feasibility-study', 'risk-assessment');
UPDATE wiki_pages SET phase = 'requirements' WHERE page_type IN ('business-requirements', 'srs', 'use-cases', 'rtm', 'use-case-diagram', 'dfd');
UPDATE wiki_pages SET phase = 'design' WHERE page_type IN ('technical-architecture', 'system-design', 'ui-ux-design', 'database-design', 'class-diagram', 'sequence-diagram', 'component-diagram', 'data-models');
UPDATE wiki_pages SET phase = 'implementation' WHERE page_type IN ('features', 'api', 'coding-standards', 'version-control', 'infrastructure-diagram');
UPDATE wiki_pages SET phase = 'testing' WHERE page_type IN ('testing', 'test-plan', 'test-cases', 'test-coverage-matrix');
UPDATE wiki_pages SET phase = 'deployment' WHERE page_type IN ('deployment', 'release-notes', 'user-manual', 'maintenance-plan');
UPDATE wiki_pages SET phase = 'reference' WHERE page_type IN ('glossary', 'security', 'workflows', 'personas');

SELECT COUNT(*) as total_records, phase, GROUP_CONCAT(DISTINCT page_type) as page_types 
FROM wiki_pages 
GROUP BY phase;
