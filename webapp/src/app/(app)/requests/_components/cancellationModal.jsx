import {
  Dialog,
  DialogBackdrop,
  DialogTitle,
  DialogPanel,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { Select } from "@/components/FormElements/select";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";

async function cancelRequest(requestData) {
  const res = await fetch(`/api/requests/state-transition`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to cancel request");
  }
  return await res.json();
}

export function CancellationModal({ request, onClose, showModal }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationNote, setCancellationNote] = useState("");

  const canSubmit = useMemo(() => {
    return (
      cancellationReason &&
      (cancellationReason !== "other" || cancellationNote) &&
      !cancelling
    );
  }, [cancellationReason, cancellationNote, cancelling]);

  function resetForm() {
    setCancellationReason("");
    setCancellationNote("");
  }

  async function handleCancellation(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setCancelling(true);
    try {
      const data = {
        requestId: request.requestId,
        toStatus: "cancelled",
        note: cancellationNote,
        cancellationReason,
      };

      await cancelRequest(data);

      toast.success(`Request cancelled`);
      resetForm();
      onClose(true);
    } catch (err) {
      toast.error(err?.message || "Failed to cancel request");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <Dialog
        open={showModal}
        onClose={() => onClose()}
        className="relative z-40"
      >
        <DialogBackdrop
          transition
          className="data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in fixed inset-0 bg-gray-900/80 transition-opacity"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95 relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all sm:my-8 sm:max-w-3xl"
            >
              <form onSubmit={handleCancellation} className="grid grid-cols-1">
                <div className="overflow-auto bg-white dark:bg-gray-800">
                  <div className="bg-gray-200 text-dark dark:bg-gray-900 sm:p-5">
                    <div className="flex flex-row p-3 sm:p-0">
                      <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10">
                        <ExclamationTriangleIcon
                          aria-hidden="true"
                          className="size-6 text-orange-500"
                        />
                      </div>
                      <div className="mx-3 flex w-full items-center align-middle">
                        <div className="grid w-full grid-cols-2 justify-between gap-4">
                          <DialogTitle
                            as="h3"
                            className="text-base font-semibold text-dark dark:text-white"
                          >
                            Request cancellation
                          </DialogTitle>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 px-5 py-3">
                    <Select
                      label="Cancellation Reason"
                      items={[
                        {
                          label: "Created by mistake",
                          value: "created_by_mistake",
                        },
                        {
                          label: "Guest changed mind",
                          value: "guest_changed_mind",
                        },
                        {
                          label: "Issue resolved manually",
                          value: "issue_resolved_manually",
                        },
                        {
                          label: "Request took too long",
                          value: "request_took_too_long",
                        },
                        {
                          label: "Duplicate request",
                          value: "duplicate_request",
                        },
                        {
                          label: "Service no longer needed",
                          value: "service_no_longer_needed",
                        },
                        { label: "Other reason", value: "other" },
                      ]}
                      placeholder="Created by mistake"
                      handleChange={(e) =>
                        setCancellationReason(e.target.value)
                      }
                      value={cancellationReason}
                      required
                    />

                    <TextAreaGroup
                      label="Note"
                      placeholder="Note about cancellation"
                      handleChange={(e) => setCancellationNote(e.target.value)}
                      required={cancellationReason === "other"}
                    />
                  </div>
                  <div className="mt-3 gap-2 bg-gray-300 px-4 py-3 dark:bg-gray-700/25 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={cn(
                        "rounded-md px-4 py-2 text-sm font-medium",
                        canSubmit
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "cursor-not-allowed bg-gray-700 text-gray-400",
                      )}
                    >
                      {cancelling ? "Cancelling..." : "Cancel Request"}
                    </button>

                    <button
                      type="button"
                      data-autofocus
                      onClick={(e) => {
                        resetForm();
                        onClose();
                      }}
                      className="inset-ring inset-ring-white/5 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold hover:bg-white/20 dark:bg-white/10 dark:text-white sm:mt-0 sm:w-auto"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
