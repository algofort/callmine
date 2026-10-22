'use client';

/**
 * Renders builder JSON (theme + sections) dynamically.
 * Supports drag-and-drop reorder via @dnd-kit/sortable.
 */
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sectionComponents } from './sections';

function SectionRender({ section, isSelected, onSelect, onRemove }) {
  const Component = sectionComponents[section.type];
  if (!Component) {
    return (
      <div className="px-8 py-4 text-sm text-neutral-500 dark:text-neutral-400 border-b border-gray-100 dark:border-neutral-800">
        Unknown section: [{section.type}]
      </div>
    );
  }
  return (
    <Component
      props={section.props || {}}
      style={section.style || {}}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  );
}

function SortableSection({
  section,
  index,
  isSelected,
  onSelect,
  renderSection,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
    >
      <div className="flex group/section">
        <div
          className="shrink-0 w-8 flex items-center justify-center border-r border-gray-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <span className="text-neutral-400 dark:text-neutral-500 text-lg">⋮⋮</span>
        </div>
        <div className="flex-1 min-w-0">
          {renderSection(section, isSelected, onSelect)}
        </div>
      </div>
    </div>
  );
}

export default function Renderer({
  data,
  selectedId,
  onSelectSection,
  onReorder,
}) {
  const sections = data?.sections ?? [];
  const sensor = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sections, oldIndex, newIndex);
    onReorder(reordered);
  };

  const renderSection = (section, isSelected, onSelect) => (
    <SectionRender
      section={section}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  );

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 dark:text-neutral-500 text-sm">
        Add a section from the left panel
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensor}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {sections.map((section, index) => (
          <SortableSection
            key={section.id}
            section={section}
            index={index}
            isSelected={selectedId === section.id}
            onSelect={() => onSelectSection(section.id)}
            renderSection={renderSection}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
