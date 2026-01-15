'use client';

import { useState } from 'react';
import UrlForm from '@/components/UrlForm';
import ScanningStatus from '@/components/ScanningStatus';
import ErrorBanner from '@/components/ErrorBanner';
import type { ScanResult } from '@/utils/types';

interface ScannedUrl {
  url: string;
  timestamp: string;
  violationCount: number;
}

export default function HomePage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannedUrls, setScannedUrls] = useState<ScannedUrl[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setScanning(false);
      setError('Scan cancelled by user');
    }
  };

  const handleNewScan = () => {
    setScanResult(null);
    setError(null);
    setScanning(false);
    setAbortController(null);
    // Trigger reset in UrlForm component
    window.dispatchEvent(new CustomEvent('resetScanForm'));
  };

  const handleScan = async (url: string, scanType: 'public' | 'authenticated' | 'both', credentials?: { username: string; password: string; loginUrl?: string }) => {
    setScanning(true);
    setError(null);
    setScanResult(null);

    // Create new abort controller
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Validate URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('URL must start with http:// or https://');
      }

      // Validate scanType and credentials
      if (scanType === 'authenticated' && !credentials) {
        throw new Error('Credentials are required for authenticated page scanning');
      }

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          credentials,
          scanType,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Scan failed');
      }

      setScanResult(data);
      
      // Add to scanned URLs list
      setScannedUrls(prev => [
        { url, timestamp: new Date().toISOString(), violationCount: data.summary.total },
        ...prev.slice(0, 9) // Keep last 10 scans
      ]);
    } catch (err) {
      // Don't show error if it was cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Scan cancelled');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Scan error:', err);
        setError(errorMessage);
      }
    } finally {
      setScanning(false);
      setAbortController(null);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">WCAG Simple</h1>
          <p className="text-gray-600">
            Scan web pages for WCAG 2.1 Level AA accessibility violations
          </p>
        </header>

        {scannedUrls.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Recently Scanned URLs</h2>
            <div className="space-y-2">
              {scannedUrls.map((scan, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {scan.url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scan.violationCount === 0 
                        ? 'bg-green-100 text-green-800' 
                        : scan.violationCount < 10 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {scan.violationCount} {scan.violationCount === 1 ? 'violation' : 'violations'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <UrlForm onSubmit={handleScan} disabled={scanning} />

        {scanning && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Cancel Scan
            </button>
          </div>
        )}

        {scanning && <ScanningStatus />}

        {scanResult && !scanning && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleNewScan}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              New Scan
            </button>
          </div>
        )}

        {scanResult && !scanning && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
              <h2 className="text-2xl font-bold mb-4">Scan Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-3xl font-bold">{scanResult.summary.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
                  <div className="text-3xl font-bold">{scanResult.summary.critical}</div>
                  <div className="text-sm text-gray-600">Critical</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border-l-4 border-orange-600">
                  <div className="text-3xl font-bold">{scanResult.summary.serious}</div>
                  <div className="text-sm text-gray-600">Serious</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-600">
                  <div className="text-3xl font-bold">{scanResult.summary.moderate}</div>
                  <div className="text-sm text-gray-600">Moderate</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
                  <div className="text-3xl font-bold">{scanResult.summary.minor}</div>
                  <div className="text-sm text-gray-600">Minor</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detailed Report</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([scanResult.reportHtml], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `accessibility-report-${Date.now()}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Download detailed HTML report"
                  >
                    Download HTML
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([scanResult.reportJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `accessibility-report-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    aria-label="Download axe-core JSON report"
                  >
                    Download JSON
                  </button>
                </div>
              </div>
              <iframe
                srcDoc={scanResult.reportHtml}
                className="w-full border rounded-md"
                style={{ minHeight: '600px' }}
                title="Accessibility Report"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
