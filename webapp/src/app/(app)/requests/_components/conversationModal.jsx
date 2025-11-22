import {
  Dialog,
  DialogBackdrop,
  DialogTitle,
  DialogPanel,
} from "@headlessui/react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ConversationThread from "./conversationThread";
import { DateOnly } from "@/components/ui/datetime";

export function ConversationModal({ conversation, onClose, showModal }) {
  return (
    <div>
      <Dialog open={showModal} onClose={onClose} className="relative z-40">
        <DialogBackdrop
          transition
          className="data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in fixed inset-0 bg-gray-900/80 transition-opacity"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95 relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all sm:my-8 sm:max-w-2xl sm:w-full"
            >
              <div>
                <div className="max-h-180 overflow-auto bg-white dark:bg-gray-800">
                  <div className="sm:flex sm:items-start">
                    <div className="text-center sm:text-left">
                      <div className="bg-gray-200 text-dark dark:bg-gray-900 sm:p-5">
                        <div className="flex flex-row p-3 sm:p-0">
                          <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white/70 sm:mx-0 sm:size-10">
                            <ChatBubbleLeftRightIcon
                              aria-hidden="true"
                              className="size-6 text-yellow-300"
                            />
                          </div>
                          <div className="mx-3 flex w-full items-center align-middle">
                            <div className="grid w-full grid-cols-2 justify-between gap-4">
                              <DialogTitle
                                as="h3"
                                className="text-base font-semibold text-dark dark:text-white"
                              >
                                Conversation Log
                              </DialogTitle>
                              <div className="text-right">
                                <DateOnly
                                  dateTimeIso={
                                    conversation?.messages?.[0]?.createdAt
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-3">
                        <ConversationThread
                          messages={conversation?.messages}
                          guest={conversation?.guest}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 px-4 py-3 dark:bg-gray-700/25 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    data-autofocus
                    onClick={onClose}
                    className="inset-ring inset-ring-white/5 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold hover:bg-white/20 dark:bg-white/10 dark:text-white sm:mt-0 sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
