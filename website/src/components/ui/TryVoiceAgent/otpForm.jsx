import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

const OTP_LENGTH = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export function OTPForm({ email, name, onClose, onSuccess }) {
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputsRef = useRef([]);

  const storageKey = useMemo(() => {
    if (!email) return null;
    return `otp_last_sent_${email}`;
  }, [email]);

  // Load cooldown from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return;

    const lastSentRaw = window.localStorage.getItem(storageKey);
    if (!lastSentRaw) return;

    const lastSent = parseInt(lastSentRaw, 10);
    if (!Number.isFinite(lastSent)) return;

    const now = Date.now();
    const elapsed = (now - lastSent) / 1000;
    const remaining = RESEND_COOLDOWN_SECONDS - elapsed;

    if (remaining > 0) {
      setCooldown(Math.ceil(remaining));
    }
  }, [storageKey]);

  // Tick down cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [cooldown]);

  const code = useMemo(() => otpDigits.join(''), [otpDigits]);

  const canSubmit = useMemo(() => {
    return (
      !submitting && code.length === OTP_LENGTH && otpDigits.every((d) => d.trim().length === 1)
    );
  }, [submitting, code, otpDigits]);

  const handleDigitChange = (index, value) => {
    setErrorMessage('');

    // If user pasted multiple digits into one input
    if (value.length > 1) {
      const digitsOnly = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (!digitsOnly) return;

      const next = [...otpDigits];
      for (let i = 0; i < digitsOnly.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = digitsOnly[i];
      }
      setOtpDigits(next);

      const nextIndex = Math.min(index + digitsOnly.length, OTP_LENGTH - 1);
      if (inputsRef.current[nextIndex]) {
        inputsRef.current[nextIndex].focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, '').slice(-1); // last digit if any
    const next = [...otpDigits];
    next[index] = digit || '';
    setOtpDigits(next);

    if (digit && index < OTP_LENGTH - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        // Clear current digit
        const next = [...otpDigits];
        next[index] = '';
        setOtpDigits(next);
      } else if (index > 0 && inputsRef.current[index - 1]) {
        inputsRef.current[index - 1].focus();
      }
    }

    if (e.key === 'ArrowLeft' && index > 0 && inputsRef.current[index - 1]) {
      e.preventDefault();
      inputsRef.current[index - 1].focus();
    }

    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1 && inputsRef.current[index + 1]) {
      e.preventDefault();
      inputsRef.current[index + 1].focus();
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setOtpDigits(Array(OTP_LENGTH).fill(''));

    if (!storageKey || typeof window === 'undefined') {
      setErrorMessage('Something went wrong. Please try again in a moment.');
      return;
    }

    const now = Date.now();
    const lastSentRaw = window.localStorage.getItem(storageKey);
    const lastSent = lastSentRaw ? parseInt(lastSentRaw, 10) : 0;
    const elapsed = lastSent ? (now - lastSent) / 1000 : Infinity;

    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      setCooldown(remaining);
      setErrorMessage(`Please wait ${remaining}s before requesting a new code.`);
      return;
    }

    try {
      setResending(true);

      const res = await fetch('/api/voice-agent-trial-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => '');
        throw new Error(e?.error || `Request failed with ${res.status}`);
      }

      window.localStorage.setItem(storageKey, String(now));
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const res = await fetch('/api/voice-agent-trial-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => '');
        throw new Error(e?.error || `Request failed with ${res.status}`);
      }

      if (onSuccess) {
        onSuccess({ token: (await res.json()).token });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-h-180 overflow-auto bg-gray-800">
        <div className="px-5 py-10 text-center max-w-sm mx-auto">
          <h2 className="text-lg font-semibold text-white mb-2">Verify your email</h2>
          <p className="text-sm text-gray-300 mb-4">
            We&apos;ve sent a 5 digit code to{' '}
            <span className="font-semibold text-white">{email}</span>.
            <br />
            Enter it below to continue.
          </p>

          <div className="flex justify-center gap-2 mb-4">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(index, e)}
                className="w-10 h-12 text-center text-lg font-semibold px-2 border border-gray-300 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className={cn(
              'text-xs font-medium',
              resending || cooldown > 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-indigo-300 hover:text-indigo-200'
            )}
          >
            {resending
              ? 'Sending code...'
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : 'Didn’t get the code? Resend'}
          </button>

          {errorMessage && <p className="mt-4 text-sm text-red-500">{errorMessage}</p>}
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3 bg-gray-700/25 sm:flex-row-reverse sm:px-6">
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
          {submitting ? 'Verifying...' : 'Submit'}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className="inset-ring inset-ring-white/5 mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-white/50 bg-white/20 text-white hover:bg-white/50 sm:mt-0 sm:w-auto"
        >
          Close
        </button>
      </div>
    </form>
  );
}
