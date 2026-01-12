export default function ScanningStatus() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center mt-8" role="status" aria-live="polite">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
      <h2 className="text-xl font-semibold mb-2">Scanning in Progress</h2>
      <p className="text-gray-600">
        Analyzing the page for WCAG 2.1 AA accessibility violations...
      </p>
    </div>
  );
}
