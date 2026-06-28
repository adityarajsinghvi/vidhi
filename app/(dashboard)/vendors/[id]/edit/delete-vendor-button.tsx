"use client";

import { deleteVendor } from "../actions";

export function DeleteVendorButton({
  vendorId,
  vendorName,
}: {
  vendorId: string;
  vendorName: string;
}) {
  return (
    <form
      action={deleteVendor}
      className="mt-5"
      onSubmit={(e) => {
        if (!confirm(`Delete ${vendorName}? This also removes their payment history.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="vendorId" value={vendorId} />
      <button
        type="submit"
        className="w-full rounded-btn border border-red-500/40 bg-card px-4 py-3.5 text-sm font-semibold text-red-500"
      >
        Delete vendor
      </button>
    </form>
  );
}
