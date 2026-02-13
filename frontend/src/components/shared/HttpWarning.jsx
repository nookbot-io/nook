export default function HttpWarning() {
  const { protocol, hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (protocol === 'https:' || isLocal) return null;

  return (
    <div className="bg-warning/15 border-b border-warning/30 px-4 py-2 text-center text-sm text-warning">
      You're accessing Nook Agent over HTTP. Your session cookie and API keys are not encrypted in transit.
      Use HTTPS or access via localhost for security.
    </div>
  );
}
