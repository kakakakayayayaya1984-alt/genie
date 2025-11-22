'use client';

import { Dialog, DialogBackdrop, DialogTitle, DialogPanel } from '@headlessui/react';
import { useState } from 'react';
import { LeadForm } from './leadForm';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { OTPForm } from './otpForm';
import { Agent } from './agent';

export function TryVoiceAgent() {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');

  const onClick = () => {
    setShowModal(true);
  };

  const onClose = () => {
    setShowModal(false);
    setTimeout(() => {
      setStep(1);
      setEmail('');
      setName('');
      setToken('');
    }, 300);
  };

  const onSuccess = ({ name: n, email: e, token: t }) => {
    if (step === 1) {
      setEmail(e);
      setName(n);
      setStep(2);
    }

    if (step === 2) {
      setToken(t);
      setStep(3);
    }
  };

  return (
    <>
      <div className="flex justify-center font-medium text-sm py-10">
        <button
          className="flex items-center text-white cta-btn py-2.5 px-4 rounded-full duration-150"
          onClick={onClick}
        >
          Try the Voice Agent
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <Dialog open={showModal} onClose={() => {}} className="relative z-40">
        <DialogBackdrop
          transition
          className="data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in fixed inset-0 bg-gray-900/50 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95 relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              <div className="bg-gray-900 sm:p-5">
                <div className="flex flex-row p-3 sm:p-0">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10">
                    <MicrophoneIcon aria-hidden="true" className="size-6 text-orange-500" />
                  </div>
                  <div className="mx-3 flex w-full items-center align-middle">
                    <div className="grid w-full grid-cols-2 justify-between gap-4">
                      <DialogTitle as="h3" className="text-base font-semibold text-white">
                        Try the voice agent
                      </DialogTitle>
                    </div>
                  </div>
                </div>
              </div>
              {step === 1 && <LeadForm onSuccess={onSuccess} onClose={onClose} />}
              {step === 2 && (
                <OTPForm name={name} email={email} onClose={onClose} onSuccess={onSuccess} />
              )}
              {step === 3 && <Agent onClose={onClose} token={token} />}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
