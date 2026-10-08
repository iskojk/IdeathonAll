'use client';

import { Box, IconButton, Stack } from '@mui/material';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';

function Row({ question, disabled, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: question.id, disabled });
  return <Box ref={setNodeRef} data-question-id={question.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0, position: 'relative', zIndex: isDragging ? 2 : 'auto', transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.85 : 1 }}>
    <IconButton ref={setActivatorNodeRef} {...attributes} {...listeners} disabled={disabled}
      aria-label={`${question.label || 'Başlıksız soru'} sorusunu sırala`} aria-roledescription="Sıralanabilir soru"
      title="Basılı tutup sürükleyin. Klavyeyle: boşluk, ok tuşları, boşluk."
      sx={{ mt: 1.75, color: '#8795a6', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }} size="small"><IconGripVertical size={18} /></IconButton>
    <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
  </Box>;
}

export default function EntrepreneurQuestionList({ questions, disabled, onReorder, children }) {
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const position = id => questions.findIndex(q => q.id === id) + 1;
  const name = id => questions.find(q => q.id === id)?.label || 'Soru';
  return <DndContext sensors={sensors} collisionDetection={closestCenter}
    modifiers={[({ transform }) => ({ ...transform, x: 0 })]}
    onDragEnd={({ active, over }) => { if (!disabled && over && active.id !== over.id) onReorder(active.id, over.id); }}
    accessibility={{ screenReaderInstructions: { draggable: 'Soruyu taşımak için boşluk, sıralamak için ok tuşları, bırakmak için tekrar boşluk kullanın. Escape ile iptal edin.' }, announcements: {
      onDragStart: ({ active }) => `${name(active.id)} seçildi. ${position(active.id)}. sırada.`,
      onDragOver: ({ active, over }) => over ? `${name(active.id)}, ${position(over.id)}. sıraya taşınıyor.` : undefined,
      onDragEnd: ({ active, over }) => over ? `${name(active.id)}, ${position(over.id)}. sıraya yerleştirildi.` : 'Taşıma iptal edildi.',
      onDragCancel: () => 'Taşıma iptal edildi. Soru sırası değişmedi.',
    } }}>
    <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
      <Stack gap={1.5}>{questions.map((question, index) => <Row key={question.id} question={question} disabled={disabled}>{children(question, index)}</Row>)}</Stack>
    </SortableContext>
  </DndContext>;
}
