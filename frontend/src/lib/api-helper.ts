export function getWorkspaceId(request: Request): string {
  const headerVal = request.headers.get('x-workspace-id');
  if (headerVal) return headerVal;

  const { searchParams } = new URL(request.url);
  const paramVal = searchParams.get('workspaceId');
  if (paramVal) return paramVal;

  return 'healthcare';
}
