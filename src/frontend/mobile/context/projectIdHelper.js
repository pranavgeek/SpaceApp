// projectIdHelper.js
export function getProjectId(project) {
  if (!project) return null;
  const id = project.product_id || project.id;
  if (id) return id.toString();

  if (project.name && project.price && project.image) {
    return `${project.name}-${project.price}-${project.image}`;
  }

  return null;
}


