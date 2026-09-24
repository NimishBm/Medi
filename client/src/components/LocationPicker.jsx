import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, LocateFixed, Check, ChevronDown, Loader, X } from 'lucide-react';

const T = '#0D9488';

export const LocationPicker = ({
  detectedCity,
  availableCities = [],
  locationLoading = false,
  onSelect,
  onDetect,
  compact = false,
}) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const containerRef      = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const cityList = query.trim()
    ? availableCities.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : availableCities;

  const isActive = !!detectedCity;

  const closeAndSelect = (fn) => {
    fn();
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── Trigger pill ── */}
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        background: isActive ? '#F0FDF4' : '#F9FAFB',
        border: `1.5px solid ${isActive ? '#99F6E4' : '#E5E7EB'}`,
        borderRadius: 20,
      }}>
        {/* Main button — opens dropdown */}
        <button
          onClick={() => !locationLoading && setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: compact ? 4 : 5,
            padding: compact
              ? `5px ${isActive ? 6 : 10}px 5px 10px`
              : `5px ${isActive ? 8 : 12}px 5px 12px`,
            background: 'none', border: 'none',
            cursor: locationLoading ? 'default' : 'pointer',
          }}
        >
          {locationLoading
            ? <Loader size={compact ? 12 : 13} color={T} style={{ flexShrink: 0 }} />
            : <MapPin size={compact ? 12 : 13} color={isActive ? T : '#9CA3AF'} style={{ flexShrink: 0 }} />
          }
          <span style={{
            fontSize: compact ? 11 : 12, fontWeight: 600,
            color: isActive ? T : '#6B7280',
            maxWidth: compact ? 66 : 130,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {locationLoading ? 'Detecting…' : (detectedCity || 'Location')}
          </span>
          {!isActive && (
            <ChevronDown size={10} color="#9CA3AF" style={{
              flexShrink: 0, transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'none',
            }} />
          )}
        </button>

        {/* × clear — only when active */}
        {isActive && !locationLoading && (
          <button
            onClick={() => onSelect(null)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: compact ? '5px 8px 5px 0' : '5px 10px 5px 0',
              background: 'none', border: 'none', cursor: 'pointer', color: T,
            }}
          >
            <X size={compact ? 11 : 12} />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#fff', border: '1.5px solid #E8ECF0',
          borderRadius: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
          zIndex: 300, minWidth: 220, overflow: 'hidden',
        }}>

          {/* Search */}
          <div style={{ padding: '10px 10px 8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{
                position: 'absolute', left: 9, top: '50%',
                transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none',
              }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search city…"
                style={{
                  width: '100%', paddingLeft: 28, paddingRight: 10,
                  paddingTop: 7, paddingBottom: 7,
                  background: '#F5F7FA', border: '1.5px solid #E5E7EB',
                  borderRadius: 9, fontSize: 12, outline: 'none',
                  boxSizing: 'border-box', color: '#111827',
                }}
                onFocus={e => { e.target.style.borderColor = '#99F6E4'; }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 256, overflowY: 'auto' }}>

            {/* Detect automatically — hidden while typing */}
            {!query.trim() && (
              <>
                <button
                  onClick={() => closeAndSelect(onDetect)}
                  style={row(false)}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{
                      width: 24, height: 24, background: '#ECFDF5', borderRadius: 7,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <LocateFixed size={12} color={T} />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T }}>Detect automatically</span>
                  </span>
                </button>
                <div style={{ height: 1, background: '#F3F4F6', margin: '2px 10px' }} />
              </>
            )}

            {/* City list */}
            {cityList.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9CA3AF', padding: '14px', margin: 0, textAlign: 'center' }}>
                {query.trim() ? 'No matching cities' : 'No cities available'}
              </p>
            ) : cityList.map(c => {
              const sel = detectedCity === c;
              return (
                <button
                  key={c}
                  onClick={() => closeAndSelect(() => onSelect(c))}
                  style={row(sel)}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = sel ? '#F0FDF4' : 'none'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <MapPin size={12} color={sel ? T : '#CBD5E1'} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? T : '#374151' }}>
                      {c}
                    </span>
                  </span>
                  {sel && <Check size={13} color={T} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const row = (active) => ({
  width: '100%', textAlign: 'left', padding: '8px 14px',
  background: active ? '#F0FDF4' : 'none',
  border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
});
