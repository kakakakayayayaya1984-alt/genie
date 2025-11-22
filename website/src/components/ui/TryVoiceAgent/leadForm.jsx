import { cn } from '@/src/lib/utils';
import { useMemo, useState } from 'react';

export function LeadForm({ onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const canSubmit = useMemo(() => {
    return !submitting && name.trim() !== '' && email.trim() !== '';
  }, [submitting, name, email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!String(data.name).trim() || !String(data.email).trim()) {
      setSubmitting(false);
      setErrorMessage('Please fill in your name and email.');
      return;
    }

    try {
      const res = await fetch('/api/voice-agent-trial-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => '');
        throw new Error(j?.error || `Request failed with ${res.status}`);
      }

      form.reset();
      onSuccess({ email, name });
      setName('');
      setEmail('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="max-h-180 overflow-auto bg-gray-800">
        <div className="px-5 py-10 text-center max-w-sm mx-auto">
          <div className="grid gap-4">
            <div className="flex flex-col text-left">
              <label htmlFor="name" className="block text-gray-200 font-semibold mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border text-gray-200 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col text-left">
              <label htmlFor="name" className="block text-gray-200 font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border text-gray-200 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>{errorMessage && <p className="mt-4 text-sm text-red-500">{errorMessage}</p>}</div>
        </div>
      </div>
      <div className="flex gap-3  px-4 py-3 bg-gray-700/25 sm:flex-row-reverse sm:px-6">
        <button
          type="submit"
          className={cn(
            'inset-ring inset-ring-white/5 mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold sm:mt-0 sm:w-auto',
            !canSubmit
              ? 'bg-gray-700 text-gray-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          )}
          disabled={!canSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={() => {
            setEmail('');
            setName('');
            setErrorMessage('');
            setSubmitting(false);
            onClose();
          }}
          className="inset-ring inset-ring-white/5 mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-white/50 bg-white/20 text-white hover:bg-white/50 sm:mt-0 sm:w-auto"
        >
          Close
        </button>
      </div>
    </form>
  );
}
