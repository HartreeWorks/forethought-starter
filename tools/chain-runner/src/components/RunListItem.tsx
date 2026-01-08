"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { DeleteRunButton } from "./DeleteRunButton";

interface Props {
  runId: string;
  chainId: string;
  title: string;
  dateTime: string;
  status: "pending" | "running" | "completed" | "failed";
  showDelete?: boolean;
}

export function RunListItem({ runId, chainId, title, dateTime, status, showDelete = true }: Props) {
  return (
    <div className="flex items-center justify-between p-3 border rounded hover:border-blue-500 transition-colors">
      <Link
        href={`/runs/${runId}`}
        className="flex-1 min-w-0 flex items-center gap-2 text-sm"
      >
        <span className="text-gray-900 truncate">{title}</span>
        <span className="text-gray-300 flex-shrink-0">·</span>
        <span className="text-gray-500 flex-shrink-0">{dateTime}</span>
      </Link>
      <div className="flex items-center gap-2 ml-2">
        <StatusBadge status={status} />
        {showDelete && (
          <DeleteRunButton runId={runId} chainId={chainId} variant="icon" />
        )}
      </div>
    </div>
  );
}
