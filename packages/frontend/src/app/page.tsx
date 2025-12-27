/**
 * Home Page
 * @spec FEAT-001
 */

import { EXECUTION_STATUSES } from '@claude-agent/shared';

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Claude Agent Service</h1>
      <p>Kubernetes-based Claude Agent execution platform</p>
      <section style={{ marginTop: '2rem' }}>
        <h2>Execution Status Types</h2>
        <ul>
          {EXECUTION_STATUSES.map((status) => (
            <li key={status}>{status}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
