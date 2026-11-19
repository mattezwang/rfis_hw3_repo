// App shell: role switcher, simulated clock, reset.
// Implements: PR-001 (switch between rider, dispatcher and driver views), PR-002 (reset demo),
// A-8 (no sign-in; roles switched in the interface), A-17 (simulated clock shown).
import { useState } from 'react';
import { useAppState } from './state/AppState';
import { fmt } from './domain/time';
import { RiderView } from './views/rider/RiderView';
import { DispatcherView } from './views/dispatcher/DispatcherView';
import { DriverView } from './views/driver/DriverView';
import { pendingQueue } from './domain/store';

type Role = 'rider' | 'dispatcher' | 'driver';

const ROLES: Array<{ id: Role; label: string }> = [
  { id: 'rider', label: 'Rider (Janelle)' },
  { id: 'dispatcher', label: 'Dispatcher (Frank)' },
  { id: 'driver', label: 'Driver' },
];

export function App() {
  const { now, reset, data } = useAppState();
  const [role, setRole] = useState<Role>('rider');
  const pendingCount = pendingQueue(data).length;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Same-Day Trip Changes</h1>
          <p className="subtitle">
            Prototype V1 · mock data for one service day · simulated time{' '}
            <strong>
              <time>{fmt(now)}</time>
            </strong>
          </p>
        </div>
        <nav aria-label="Choose a role" className="roles">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className="role-button"
              aria-pressed={role === r.id}
              onClick={() => setRole(r.id)}
            >
              {r.label}
              {r.id === 'dispatcher' && pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
            </button>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (window.confirm('Reset the demo to the seeded service day? All changes will be lost.')) reset();
            }}
          >
            Reset demo
          </button>
        </nav>
      </header>
      <main>
        {role === 'rider' && <RiderView />}
        {role === 'dispatcher' && <DispatcherView />}
        {role === 'driver' && <DriverView />}
      </main>
    </div>
  );
}
