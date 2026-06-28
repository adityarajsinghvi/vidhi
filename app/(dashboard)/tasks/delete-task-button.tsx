"use client";

import { deleteTask } from "./actions";

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  return (
    <form
      action={deleteTask}
      onSubmit={(e) => {
        if (!confirm("Delete this task?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <button type="submit" className="px-1 text-base text-faint">
        ×
      </button>
    </form>
  );
}
