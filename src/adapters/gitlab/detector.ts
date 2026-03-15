export function isGitLabLocation(location: Location = window.location): boolean {
  return location.hostname === 'gitlab.com' || location.hostname.endsWith('.gitlab.com');
}
