import { useEffect, useRef, useState } from 'react';
import { filterOptions } from '@/lib/searchOptions';
import styles from '@/styles/entrepreneur.module.css';

export default function SearchableSelect({ options, value, onChange, label, placeholder = 'Seçim yapın', searchPlaceholder = 'Seçeneklerde ara...', ...inputProps }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const filtered = filterOptions(options, query);
  const listId = `${inputProps.id}-options`;
  const expanded = open && !inputProps.disabled;

  useEffect(() => {
    if (!expanded) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [expanded]);

  useEffect(() => {
    if (expanded) list.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [expanded, activeIndex, query]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function choose(option) {
    onChange(option);
    close();
  }

  function show() {
    setQuery('');
    setActiveIndex(Math.max(0, options.indexOf(value)));
    setOpen(true);
  }

  function navigate(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(0, Math.min(filtered.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[activeIndex]) choose(filtered[activeIndex]);
    }
  }

  return <div ref={root} className={styles.searchSelect} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button {...inputProps} ref={trigger} type="button" className={styles.selectTrigger} aria-required={undefined} aria-label={`${label}${inputProps['aria-required'] ? ' (zorunlu)' : ''}: ${value || placeholder}`} aria-haspopup="dialog" aria-expanded={expanded} aria-controls={expanded ? `${inputProps.id}-popup` : undefined} onClick={() => expanded ? close() : show()} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
    }}>
      <span className={!value ? styles.selectPlaceholder : undefined}>{value || placeholder}</span><span aria-hidden="true">⌄</span>
    </button>
    {expanded && <div className={styles.selectPopup} id={`${inputProps.id}-popup`} role="dialog" aria-label={`${label} seçimi`}>
      <div className={styles.selectSearch}>
        <label className="visually-hidden" htmlFor={`${inputProps.id}-search`}>{searchPlaceholder}</label>
        <input id={`${inputProps.id}-search`} autoFocus type="search" role="combobox" autoComplete="off" placeholder={searchPlaceholder} value={query} aria-expanded="true" aria-autocomplete="list" aria-controls={listId} aria-activedescendant={filtered.length ? `${listId}-${activeIndex}` : undefined} onKeyDown={navigate} onChange={event => { setQuery(event.target.value); setActiveIndex(0); }} />
      </div>
      <div ref={list} id={listId} role="listbox" aria-label={label} className={styles.selectList}>
        {filtered.map((option, index) => <div key={option} id={`${listId}-${index}`} role="option" aria-selected={value === option} className={`${styles.selectOption} ${index === activeIndex ? styles.activeSelectOption : ''}`} onPointerDown={event => event.preventDefault()} onClick={() => choose(option)}>
          <span>{option}</span>{value === option && <span aria-hidden="true">✓</span>}
        </div>)}
      </div>
      <p className={styles.selectCount} role="status">{filtered.length ? `${filtered.length} seçenek` : 'Sonuç bulunamadı.'}</p>
    </div>}
  </div>;
}
