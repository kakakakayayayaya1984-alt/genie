"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Department } from "@/components/ui/department";
import SortTable from "@/components/ui/sort-table";
import User from "@/components/ui/user";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { DeleteButton } from "@/components/ui/delete-button";
import { ResetPasswordButton } from "../_components/resetPasswordButton";
import { DeleteModal } from "@/components/ui/delete-modal";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";
import { ResetPasswordModal } from "../_components/resetPasswordModal";
import { EmailIcon } from "@/assets/icons";
import { PhoneIcon, UsersIcon } from "@heroicons/react/24/outline";
import { ShiftSummary } from "../_components/shiftSummary";
import { EditStaffButton } from "../_components/editStaffButton";
import InputGroup from "@/components/FormElements/InputGroup";
import { EditPanelPortal } from "../_components/editPanelPortal";

async function fetchStaff() {
  const res = await fetch("/api/staff", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch staff");
  return await res.json();
}

export default function Page() {
  const [data, setData] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [user, setUser] = useState(null);

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const { user: loggedInUser } = useUser();
  const loggedInUserId = loggedInUser?.userId;

  const [query, setQuery] = useState("");

  const columns = useMemo(
    () => [
      { key: "name", label: "NAME" },
      { key: "department", label: "DEPARTMENT" },
      { key: "contact", label: "CONTACT" },
      { key: "shift", label: "SHIFT", sortable: false },
      { key: "reportingTo", label: "REPORTS TO" },
      { key: "icons", label: "", sortable: false },
    ],
    [],
  );

  const refreshStaff = useCallback(async () => {
    try {
      const res = await fetchStaff();
      setData(
        res.items.map((i) => ({
          ...i,
          reportingTo: i.reportingToUserId
            ? res?.items?.find((s) => s.userId === i.reportingToUserId)
            : null,
        })),
      );
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStaff();
  }, [refreshStaff]);

  async function deleteUser(userId) {
    const res = await fetch(`/api/staff/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });

    setShowDeleteModal(false);
    setUser(null);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Failed to delete user: ${err.error}`);
      return;
    }

    toast.success("User deleted");
    refreshStaff();
  }

  async function resetUserPassword({ userId, password }) {
    const res = await fetch(`/api/staff/password`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        password,
      }),
    });

    setShowResetPasswordModal(false);
    setUser(null);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Failed to reset user password: ${err.error}`);
      return;
    }

    toast.success("Password changed");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((s) => {
      const matches =
        !q ||
        String(s.firstName).toLowerCase().includes(q) ||
        String(s.lastName).toLowerCase().includes(q) ||
        String(s.department).toLowerCase().includes(q) ||
        s?.roles?.filter((r) => String(r).toLowerCase().includes(q))?.length ||
        String(s.email).toLowerCase().includes(q) ||
        String(s.mobileNumber).toLowerCase().includes(q);

      return matches;
    });
  }, [data, query]);

  const staff = useMemo(
    () =>
      Array.isArray(filtered)
        ? filtered.map((r) => ({
            name: <User user={r} onlyName={true} />,
            contact: (
              <div className="flex flex-col gap-2 items-start w-55">
                <div className="flex items-center justify-start gap-1">
                  <EmailIcon className="h-5 w-5 text-gray-500" />
                  <span>{r.email}</span>
                </div>
                <div className="flex items-center justify-start gap-1">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                  <span>{r.mobileNumber || "-"}</span>
                </div>
              </div>
            ),
            shift: (
              <ShiftSummary
                timezone="Asia/Kolkata"
                weeklyShifts={r.weeklyShifts}
              />
            ),
            department: (
              <Department department={r.department} roles={r.roles} />
            ),
            reportingTo: r.reportingTo ? (
              <User
                user={r.reportingTo}
                showDepartment={true}
                showRoles={true}
              />
            ) : (
              "-"
            ),
            icons: (
              <div className="flex flex-col gap-2">
                <EditStaffButton onClick={() => setEditingStaff(r)} />

                <ResetPasswordButton
                  onClick={() => {
                    setUser(r);
                    setShowResetPasswordModal(true);
                  }}
                />

                {loggedInUserId !== r.userId && (
                  <DeleteButton
                    onClick={() => {
                      setUser(r);
                      setShowDeleteModal(true);
                    }}
                  />
                )}
              </div>
            ),
          }))
        : [],
    [filtered, loggedInUserId],
  );

  return (
    <div>
      <Breadcrumb pageName="All Staff" parent="Staff" />
      <div className="w-fit rounded-[10px] bg-white p-6 dark:bg-gray-dark lg:w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-10">
          <div className="flex items-center gap-2 py-6 text-sm text-zinc-600 dark:text-zinc-300">
            <UsersIcon className="size-5" />
            <span className="font-medium">Staff</span>
            <span className="text-sm">
              ({filtered.length} / {data.length})
            </span>
            <Link
              className="mx-4 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              href="/staff/new"
            >
              + New Staff
            </Link>
          </div>
          <InputGroup
            type="text"
            className="w-60 sm:w-80"
            name="query"
            placeholder="search name, email, phone, department, role"
            value={query}
            handleChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <SortTable
          columns={columns}
          data={staff}
          tableRowClassNames={[
            "text-base font-medium text-dark dark:text-white",
          ]}
          noDataMessage="No staff"
          loading={loading}
        />

        <DeleteModal
          showModal={showDeleteModal}
          onClose={() => {
            setUser(null);
            setShowDeleteModal(false);
          }}
          message={
            <div className="px-6">
              <div className="pb-2 pt-6 font-bold">
                Are you sure you want to delete user?
              </div>
              <div className="mx-auto w-fit">
                <div className="rounded-lg bg-gray-200/75 pb-4 text-left dark:bg-gray-700">
                  <User
                    user={user}
                    showMobileNumber={true}
                    showEmail={true}
                    showDepartment={true}
                    showRoles={true}
                    width="w-60"
                  />
                </div>
              </div>
            </div>
          }
          header={"Delete user"}
          onConfirmDelete={async () => await deleteUser(user.userId)}
        />

        <ResetPasswordModal
          showModal={showResetPasswordModal}
          onConfirm={async (password) =>
            await resetUserPassword({ userId: user.userId, password })
          }
          onClose={() => {
            setShowResetPasswordModal(false);
            setUser(null);
          }}
          user={user}
        />

        <EditPanelPortal
          open={!!editingStaff}
          staffUser={editingStaff}
          allStaff={data}
          onClose={() => {
            setEditingStaff(null);
          }}
          onSave={() => {
            refreshStaff();
          }}
        />
      </div>
    </div>
  );
}
