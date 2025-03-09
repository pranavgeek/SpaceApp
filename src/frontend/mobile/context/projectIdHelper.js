// projectIdHelper.js
// This helper uses a WeakMap to cache generated ids for project objects.
const projectIdMap = new WeakMap();

export function getProjectId(project) {
  // If the project has its own id property, use it.
  if (project && project.id) {
    return project.id;
  }
  // Otherwise, if we haven't seen this project, generate a new id.
  if (!projectIdMap.has(project)) {
    projectIdMap.set(project, Math.random().toString());
  }
  return projectIdMap.get(project);
}
