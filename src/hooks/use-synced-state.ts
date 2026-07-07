"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

/**
 * Local state that mirrors an external value, using React's endorsed
 * adjust-state-during-render pattern: the state is editable locally, but
 * whenever `external` changes it is re-synced to the new external value.
 *
 * @see https://react.dev/reference/react/useState#storing-information-from-previous-renders
 */
export function useSyncedState<T>(
  external: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(external);
  const [prevExternal, setPrevExternal] = useState<T>(external);

  if (external !== prevExternal) {
    setPrevExternal(external);
    setValue(external);
  }

  return [value, setValue];
}
