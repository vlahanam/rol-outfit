"use client";

import React from "react";
import { GripVertical, ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WIDGET_STATUS_LABEL, WIDGET_TYPE_LABEL } from "@/lib/api";
import type { Widget } from "@/types/api";

interface WidgetSortableRowProps {
  widget: Widget;
  isChild: boolean;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (widget: Widget) => void;
}

export function WidgetSortableRow({
  widget,
  isChild,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: WidgetSortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusLabel = WIDGET_STATUS_LABEL[widget.status] ?? "—";
  const isActive = widget.status === 2;
  const hasChildren = widget.type === "container";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isChild ? "bg-gray-50/50" : ""}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            tabIndex={-1}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {!isChild && hasChildren ? (
            <button
              onClick={() => onToggleExpand(widget.id)}
              className="p-0.5 text-gray-500 hover:text-gray-800"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5 h-5 shrink-0" />
          )}
          <span className={`text-sm font-medium text-gray-900 ${isChild ? "ml-4" : ""}`}>
            {widget.name}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {WIDGET_TYPE_LABEL[widget.type] ?? widget.type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
        {widget.display_order}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {statusLabel}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {new Date(widget.created_at).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(widget.id)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(widget)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
