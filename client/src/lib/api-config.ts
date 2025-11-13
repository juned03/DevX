// API Configuration
// In development, this will be empty (relative URLs work with proxy)
// In production, this should be the full backend URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://qadevxapi2o-epb8aubyd0btefeg.eastus2-01.azurewebsites.net' : '');

// Helper function to build full API URL
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (API_BASE_URL) {
    // Remove trailing slash from base URL if present, then add path with leading slash
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}/${cleanPath}`;
  }
  
  // In development, use relative path
  return `/${cleanPath}`;
}

