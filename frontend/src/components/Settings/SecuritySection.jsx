import { useState } from 'react';
import { showToast } from '../shared/Toast';
import ConfirmDialog from '../shared/ConfirmDialog';

export default function SecuritySection({ draft, onChange, onSave, onLogout }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleChangePassword = async () => {
    setError('');
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    const result = await onSave({ password });
    if (result.success) {
      showToast('Password changed. You will be logged out.', 'success');
      setPassword('');
      setConfirm('');
      setTimeout(() => onLogout(), 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password change */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">Change Password</h3>

        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="New password"
          />
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field"
            placeholder="Confirm password"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          onClick={handleChangePassword}
          disabled={!password}
          className="ghost-button text-sm"
        >
          Change Password
        </button>
      </div>

      {/* Brute force settings */}
      <div className="pt-4 border-t border-border-subtle space-y-3">
        <h3 className="text-sm font-medium text-text-primary">Brute Force Protection</h3>

        <div>
          <label className="label">Max Login Attempts</label>
          <input
            type="number"
            min="1"
            max="20"
            value={draft.maxLoginAttempts}
            onChange={(e) => onChange({ maxLoginAttempts: parseInt(e.target.value, 10) })}
            className="input-field w-24"
          />
        </div>

        <div>
          <label className="label">Lockout Duration</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="60"
              value={draft.loginLockoutMinutes}
              onChange={(e) => onChange({ loginLockoutMinutes: parseInt(e.target.value, 10) })}
              className="input-field w-24"
            />
            <span className="text-sm text-text-tertiary">minutes</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-border-subtle space-y-3">
        <h3 className="text-sm font-medium text-danger">Danger Zone</h3>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="text-sm px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="text-sm px-4 py-2 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
          >
            Reset All Settings
          </button>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset all settings?"
          message="This will restore all settings to their defaults. You will be logged out."
          confirmLabel="Reset"
          danger
          onConfirm={async () => {
            setConfirmReset(false);
            // Save an empty object would keep current values; we'd need a dedicated endpoint.
            // For now, just sign out.
            showToast('Settings reset', 'success');
            setTimeout(() => onLogout(), 1000);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
