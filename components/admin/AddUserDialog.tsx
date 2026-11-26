"use client";

import { UserPlus } from "lucide-react";
import { Modal } from "./Modal";
import { UserForm } from "./UserForm";

/**
 * "Add user" button + dialog. On success saveUser redirects to /admin/users?created=…;
 * the page remounts this component (key), which closes it.
 */
export function AddUserDialog() {
  return (
    <Modal
      title="Add user"
      subtitle="Create the login and choose its role. To assign jobs, add the person under Staff (crew) afterwards."
      triggerClassName="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-4 py-2.5 text-[0.9rem] font-medium text-canvas hover:bg-night-600"
      trigger={
        <>
          <UserPlus size={16} /> Add user
        </>
      }
    >
      <UserForm user={{ id: "", name: "", email: "", role: "staff", isActive: true }} />
    </Modal>
  );
}
