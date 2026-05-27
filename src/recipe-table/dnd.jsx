// ============================================================
// Shared drag-and-drop helpers (dnd-kit)
// Touch-friendly reordering:
//   • Mouse  → starts after 5px of movement (no accidental drag on click)
//   • Touch  → requires a ~200ms long-press before dragging, so normal
//              scrolling/tapping is never mistaken for a drag
// The whole row is the drag source (no separate handle needed).
// ============================================================
import React from 'react';
import {
  DndContext, closestCenter,
  useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

export function useReorderSensors() {
  // Kein KeyboardSensor: sonst startet Enter (z. B. beim Bestätigen eines Werts in
  // einer ziehbaren Zeile) versehentlich einen Tastatur-Drag.
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
}

// Wrap a list of SortableItem children. `ids` must be the current order,
// `onReorder(newIds)` receives the new order after a drop.
export function SortableList({ ids, onReorder, children }) {
  const sensors = useReorderSensors();
  const handleEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const from = ids.indexOf(active.id);
      const to = ids.indexOf(over.id);
      if (from !== -1 && to !== -1) onReorder(arrayMove(ids, from, to));
    }
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// A sortable row. Renders as `as` (default 'div'); the whole element is draggable.
// `children` may be a render prop receiving { isDragging }.
// `onClick` is forwarded so rows can respond to taps/clicks without conflicts —
// dnd-kit listeners use pointer events, not click events, so there's no interference.
export function SortableItem({ id, as = 'div', className, style, children, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const Comp = as;
  const mergedStyle = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'manipulation',
  };
  return (
    <Comp ref={setNodeRef} className={className} style={mergedStyle} onClick={onClick} {...attributes} {...listeners}>
      {typeof children === 'function' ? children({ isDragging }) : children}
    </Comp>
  );
}

// Stop a pointer-down from bubbling to a SortableItem so that interacting with
// an input/button inside a draggable row doesn't start a drag.
export const stopDrag = { onPointerDown: (e) => e.stopPropagation() };
