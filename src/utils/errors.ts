export class ScanError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_URL' | 'UNREACHABLE' | 'AUTH_FAILED' | 'TIMEOUT' | 'SCAN_FAILED',
    public details?: string
  ) {
    super(message);
    this.name = 'ScanError';
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeCredentials(credentials?: { username: string; password: string }): void {
  // Ensure credentials are not logged or stored
  // Note: We don't freeze the object as it may need to be passed through serialization
  if (credentials) {
    // Validation only - ensure credentials have required fields
    if (!credentials.username || !credentials.password) {
      throw new Error('Invalid credentials: username and password are required');
    }
  }
}
