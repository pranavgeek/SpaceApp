// projectIdHelper.js
export function getProjectId(project) {
  if (project && project.id) {
    return project.id;
  }
  // Compute a stable id from some properties.
  // Make sure these properties are unique and do not change.
  return `${project.name}-${project.price}-${project.image}`;
}
