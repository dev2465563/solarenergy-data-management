import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRecord } from "../../api/records.js";
import { useUpdateRecord } from "../../hooks/useRecordMutations.js";
import { formatEnergy } from "../../lib/formatters.js";
import { cn } from "../../lib/utils.js";

/** Prevents column jump when switching to input. */
const CELL_WIDTH_CLASS = "min-w-[5.5rem] w-[5.5rem]";

/** Prevents row jump when switching to input. */
const CELL_HEIGHT_CLASS = "min-h-[2rem]";

/** Allow only numeric input: digits, optional minus, optional decimal. */
const NUMERIC_PATTERN = /^-?\d*\.?\d*$/;

function parseValue(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

interface EditableCellProps {
  rowId: string;
  device: string;
  initialValue: number | null;
}

export function EditableCell({
  rowId,
  device,
  initialValue,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(
    initialValue == null ? "" : String(initialValue)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: record, isLoading: loadingRecord } = useQuery({
    queryKey: ["record", rowId],
    queryFn: () => getRecord(rowId),
    staleTime: 0,
    enabled: isEditing,
  });

  const updateMutation = useUpdateRecord();
  const etag = record?.version;

  useEffect(() => {
    if (isEditing) {
      setTempValue(initialValue == null ? "" : String(initialValue));
    }
  }, [isEditing, initialValue]);

  useEffect(() => {
    if (isEditing && etag && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, etag]);

  const handleSave = () => {
    const parsed = parseValue(tempValue);
    const isValid = tempValue === "" || tempValue === "-" || parsed !== null;
    if (!isValid) {
      handleCancel();
      return;
    }
    if (parsed === null && initialValue === null) {
      setIsEditing(false);
      return;
    }
    if (parsed !== null && parsed === initialValue) {
      setIsEditing(false);
      return;
    }
    if (etag == null) return;

    updateMutation.mutate(
      {
        id: rowId,
        etag,
        body: { outputs: { [device]: parsed } },
      },
      {
        onSuccess: () => setIsEditing(false),
        onError: () => {},
      }
    );
  };

  const handleCancel = () => {
    setTempValue(initialValue == null ? "" : String(initialValue));
    setIsEditing(false);
    updateMutation.reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || v === "-" || NUMERIC_PATTERN.test(v)) {
      setTempValue(v);
    }
  };

  if (!isEditing) {
    return (
      <div
        className={cn(CELL_WIDTH_CLASS, CELL_HEIGHT_CLASS, "box-border flex items-center")}
        title="Click to edit, Enter or blur to save, Esc to cancel"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsEditing(true);
            }
          }}
          className={cn(
            "w-full h-[1.75rem] flex items-center rounded px-2 border border-transparent cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
            initialValue == null && "text-gray-400"
          )}
        >
          {formatEnergy(initialValue)}
        </div>
      </div>
    );
  }

  if (loadingRecord || !etag) {
    return (
      <div className={cn(CELL_WIDTH_CLASS, CELL_HEIGHT_CLASS, "flex items-center")}>
        <span className="text-sm text-gray-400" aria-busy="true">
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        CELL_WIDTH_CLASS,
        CELL_HEIGHT_CLASS,
        "flex flex-col justify-center gap-0.5 box-border"
      )}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={tempValue}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={updateMutation.isPending}
        aria-label={`Edit value for ${device}`}
        className={cn(
          "w-full min-w-0 h-[1.75rem] rounded border px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 box-border",
          updateMutation.isError && "border-red-500"
        )}
      />
      {updateMutation.isError && (
        <span className="text-xs text-red-500 truncate leading-tight" role="alert">
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : "Update failed"}
        </span>
      )}
    </div>
  );
}
