export function isGitHubLocation(location: Location = window.location): boolean {
  return location.hostname === 'github.com';
}
