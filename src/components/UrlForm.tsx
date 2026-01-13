'use client';

import { useState, useEffect } from 'react';

interface UrlFormProps {
  onSubmit: (url: string, scanType: 'public' | 'authenticated' | 'both', credentials?: { username: string; password: string; loginUrl?: string }) => void;
  disabled?: boolean;
}

export default function UrlForm({ onSubmit, disabled = false }: UrlFormProps) {
  const [url, setUrl] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [scanType, setScanType] = useState<'public' | 'authenticated' | 'both'>('both');

  // Listen for reset event from parent
  useEffect(() => {
    const handleReset = () => {
      setUrl('');
      setShowAuth(false);
      setUsername('');
      setPassword('');
      setLoginUrl('');
      setScanType('both');
    };

    window.addEventListener('resetScanForm', handleReset);
    return () => window.removeEventListener('resetScanForm', handleReset);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    const credentials =
      showAuth && username && password 
        ? { username, password, loginUrl: loginUrl.trim() || undefined } 
        : undefined;

    onSubmit(url.trim(), scanType, credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <label htmlFor="scanType" className="block text-sm font-medium text-gray-700 mb-2">
          Scan Type
        </label>
        <select
          id="scanType"
          value={scanType}
          onChange={e => setScanType(e.target.value as 'public' | 'authenticated' | 'both')}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="both">All Pages (Public + Authenticated)</option>
          <option value="public">Public Pages Only</option>
          <option value="authenticated">Authenticated Pages Only</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {scanType === 'authenticated' && 'Only scans pages behind login. Credentials required.'}
          {scanType === 'public' && 'Scans only publicly accessible pages without authentication.'}
          {scanType === 'both' && 'Scans all discoverable pages, authenticated and public.'}
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          URL to Scan
        </label>
        <input
          type="url"
          id="url"
          name="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label="Enter URL to scan for accessibility violations"
        />
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAuth(!showAuth)}
          disabled={disabled}
          className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:underline disabled:text-gray-400"
          aria-expanded={showAuth}
          aria-controls="auth-fields"
        >
          {showAuth ? '− Hide' : '+ Add'} Authentication
        </button>
      </div>

      {showAuth && (
        <div id="auth-fields" className="mb-4 space-y-4 p-4 bg-gray-50 rounded-md">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Username for authentication"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Password for authentication"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="loginUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Login Page URL (Optional)
            </label>
            <input
              type="url"
              id="loginUrl"
              name="loginUrl"
              value={loginUrl}
              onChange={e => setLoginUrl(e.target.value)}
              placeholder="https://example.com/login"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label="Login page URL for form-based authentication"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for HTTP Basic Auth. Provide login page URL for form-based login.
            </p>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Credentials are only used for this scan and are not stored.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || !url.trim()}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        aria-label="Start accessibility scan"
      >
        {disabled ? 'Scanning...' : 'Scan for Accessibility Issues'}
      </button>
    </form>
  );
}
