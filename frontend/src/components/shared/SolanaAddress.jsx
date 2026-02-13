export default function SolanaAddress({ address }) {
  const short = address.slice(0, 4) + '...' + address.slice(-4);

  return (
    <a
      href={`https://solscan.io/account/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-muted text-accent text-sm font-mono hover:underline"
      title={address}
    >
      {short}
    </a>
  );
}
