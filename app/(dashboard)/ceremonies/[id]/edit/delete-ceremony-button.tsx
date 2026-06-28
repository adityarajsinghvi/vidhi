"use client";

import { deleteCeremony } from "../actions";

export function DeleteCeremonyButton({
  ceremonyId,
  ceremonyName,
}: {
  ceremonyId: string;
  ceremonyName: string;
}) {
  return (
    <form
      action={deleteCeremony}
      className="mt-5"
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete ${ceremonyName}? This also removes its tasks and vendor links.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="ceremonyId" value={ceremonyId} />
      <button
        type="submit"
        className="w-full rounded-btn border border-red-500/40 bg-card px-4 py-3.5 text-sm font-semibold text-red-500"
      >
        Delete ceremony
      </button>
    </form>
  );
}
