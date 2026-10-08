'use client';

import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';

// Keep the dragged row inside the section list, including on touch screens.
const withinList = ({ transform, activeNodeRect, containerNodeRect }) => ({
  ...transform,
  x: 0,
  y: activeNodeRect && containerNodeRect
    ? Math.min(containerNodeRect.bottom - activeNodeRect.bottom, Math.max(containerNodeRect.top - activeNodeRect.top, transform.y))
    : transform.y,
});

function SectionRow({ section, selected, fixed, disabled, count, onSelect }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: disabled || fixed });
  return <Box ref={setNodeRef} data-section-id={section.id} sx={{
    display: 'flex', alignItems: 'center', borderRadius: 1.5, minWidth: 0,
    bgcolor: selected ? '#edf5fd' : 'white', color: selected ? '#0065ae' : '#526174',
    position: 'relative', zIndex: isDragging ? 1 : 'auto',
    boxShadow: isDragging ? '0 4px 14px rgba(30,50,70,.15)' : 'none',
    outline: isDragging ? '1px solid #b9d9f2' : 'none',
    transform: CSS.Transform.toString(transform), transition,
  }}>
    {!fixed && <IconButton ref={setActivatorNodeRef} {...attributes} {...listeners}
      aria-label={`${section.title} bölümünü sırala`} aria-roledescription="Sıralanabilir bölüm"
      title="Basılı tutup sürükleyin. Klavyeyle: boşluk, ok tuşları, boşluk."
      disabled={disabled} size="small" sx={{ ml: 0.25, flexShrink: 0, color: '#8795a6', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', '&:hover': { color: '#0065ae', bgcolor: '#dfeefa' } }}>
      <IconGripVertical size={18} />
    </IconButton>}
    <Button aria-pressed={selected} disabled={disabled} onClick={() => onSelect(section.id)} sx={{
      flex: 1, minWidth: 0, justifyContent: 'space-between', gap: 0.75, px: 1, py: 1.25,
      textAlign: 'left', color: 'inherit', bgcolor: 'transparent', '&:hover': { bgcolor: '#edf5fd' },
    }}>
      <Typography component="span" sx={{ fontSize: 13, fontWeight: selected ? 600 : 400, overflowWrap: 'anywhere' }}>{section.title}</Typography>
      <Chip size="small" label={count} sx={{ height: 22, fontSize: 11, flexShrink: 0, bgcolor: 'white' }} />
    </Button>
  </Box>;
}

export default function EntrepreneurSectionList({ sections, selectedId, fixedId, questions, disabled, onSelect, onReorder }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sortableIds = sections.filter(s => s.id !== fixedId).map(s => s.id);
  const name = id => sections.find(s => s.id === id)?.title || 'Bölüm';
  const position = id => sortableIds.indexOf(id) + 1;
  return <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[withinList]}
    onDragEnd={({ active, over }) => { if (!disabled && over && active.id !== over.id) onReorder(active.id, over.id); }}
    accessibility={{
      screenReaderInstructions: { draggable: 'Bölümü taşımak için boşluk tuşuna basın. Yukarı ve aşağı ok tuşlarıyla sıralayın. Bırakmak için boşluk, iptal etmek için Escape tuşuna basın.' },
      announcements: {
        onDragStart: ({ active }) => `${name(active.id)} seçildi. ${position(active.id)}. sırada.`,
        onDragOver: ({ active, over }) => over ? `${name(active.id)}, ${position(over.id)}. sıraya taşınıyor.` : undefined,
        onDragEnd: ({ active, over }) => over ? `${name(active.id)}, ${position(over.id)}. sıraya yerleştirildi.` : 'Taşıma iptal edildi.',
        onDragCancel: () => 'Taşıma iptal edildi. Bölüm sırası değişmedi.',
      },
    }}>
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <Stack gap={0.5}>{sections.map(section => <SectionRow key={section.id} section={section}
        selected={selectedId === section.id} fixed={section.id === fixedId} disabled={disabled}
        count={questions.filter(q => q.section === section.id).length} onSelect={onSelect} />)}</Stack>
    </SortableContext>
  </DndContext>;
}
