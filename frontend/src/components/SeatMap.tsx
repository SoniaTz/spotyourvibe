import { useState, useEffect } from 'react';
import { Loader2, Armchair, MapPin, Sofa, Theater } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface Seat {
  id: string;
  eventId: string;
  row: string;
  number: number;
  label: string;
  status: 'available' | 'held' | 'booked';
  bookingId: string | null;
}

interface SeatMapData {
  seatingType: string;
  rows: number;
  columns: number;
  seats: Seat[];
}

interface SeatMapProps {
  eventId: string;
  maxTickets: number;
  onSelectionChange: (selectedSeats: Seat[]) => void;
  disabled?: boolean;
}

export default function SeatMap({ eventId, maxTickets, onSelectionChange, disabled = false }: SeatMapProps) {
  const [seatData, setSeatData] = useState<SeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  useEffect(() => {
    fetchSeats();
  }, [eventId]);

  const fetchSeats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<{ success: boolean; data: SeatMapData }>(`/bookings/seats/${eventId}`);
      if (res.success && res.data) {
        setSeatData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load seat map');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seat: Seat) => {
    if (disabled || seat.status !== 'available') return;

    setSelectedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seat.label)) {
        next.delete(seat.label);
      } else {
        if (next.size >= maxTickets) return prev;
        next.add(seat.label);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!seatData) return;
    const selected = seatData.seats.filter((s) => selectedSeats.has(s.label));
    onSelectionChange(selected);
  }, [selectedSeats, seatData, onSelectionChange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-gray-400">Loading seat map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Theater className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="font-semibold mb-0.5">Unable to load seating map</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!seatData || seatData.seatingType !== 'assigned') {
    return null;
  }

  const seatsByRow: Record<string, Seat[]> = {};
  seatData.seats.forEach((seat) => {
    if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
    seatsByRow[seat.row].push(seat);
  });

  const rowLabels = Object.keys(seatsByRow).sort();
  const availableCount = seatData.seats.filter((s) => s.status === 'available').length;
  const bookedCount = seatData.seats.filter((s) => s.status === 'booked').length;
  const selectedCount = selectedSeats.size;

  // Split rows into sections (left, center, right) for aisle gaps
  const getSeatSections = (seats: Seat[]) => {
    const third = Math.floor(seats.length / 3);
    return {
      left: seats.slice(0, third),
      center: seats.slice(third, third * 2),
      right: seats.slice(third * 2),
    };
  };

  return (
    <div className="space-y-4">
      {/* Legend + Stats combined */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-b from-indigo-50 to-indigo-100 border-2 border-indigo-200 flex items-center justify-center">
                <Sofa className="w-3 h-3 text-indigo-500" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-green-600">{availableCount}</span>
                <span className="text-gray-500 ml-0.5">free</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-b from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center">
                <Sofa className="w-3 h-3 text-gray-400" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-500">{bookedCount}</span>
                <span className="text-gray-500 ml-0.5">taken</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2.5 rounded-t-sm bg-gradient-to-b from-indigo-50 to-indigo-100 border border-indigo-200" />
              <span className="text-gray-500">Free</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2.5 rounded-t-sm bg-gradient-to-b from-indigo-500 to-indigo-600 border border-indigo-600" />
              <span className="text-gray-500">You</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2.5 rounded-t-sm bg-gradient-to-b from-gray-200 to-gray-300 border border-gray-300" />
              <span className="text-gray-500">Taken</span>
            </div>
          </div>

          {/* Selection counter */}
          {selectedCount > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-700 flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5" />
              {selectedCount} / {maxTickets}
            </div>
          )}
        </div>
      </div>

      {/* Seat Map */}
      <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm overflow-x-auto">
        <div className="min-w-max">
        {/* Theater curtain top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 rounded-t-xl" />

        {/* Stage */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-b from-gray-800/20 to-transparent blur-sm rounded-full" />
            <div className="relative px-12 sm:px-20 py-2.5 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white text-[10px] sm:text-xs font-bold tracking-[0.2em] rounded-t-xl shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              <div className="absolute -top-3 left-1/4 w-2 h-2 rounded-full bg-amber-400/40 blur-sm" />
              <div className="absolute -top-3 left-2/4 w-2 h-2 rounded-full bg-amber-400/40 blur-sm" />
              <div className="absolute -top-3 left-3/4 w-2 h-2 rounded-full bg-amber-400/40 blur-sm" />
              <span className="relative z-10">🎭 STAGE</span>
            </div>
            <div className="h-1 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-b-lg" />
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-1">
          {rowLabels.map((rowLabel) => {
            const sections = getSeatSections(seatsByRow[rowLabel]);
            return (
              <div key={rowLabel} className="flex items-center justify-center gap-0">
                {/* Row label left */}
                <div className="w-5 text-right text-[9px] sm:text-[10px] font-bold text-gray-400 mr-1 select-none font-mono">
                  {rowLabel}
                </div>

                {/* Left section */}
                <div className="flex gap-px sm:gap-0.5">
                  {sections.left.map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.has(seat.label)}
                      disabled={disabled}
                      isHovered={hoveredSeat === seat.label}
                      onHover={setHoveredSeat}
                      onClick={() => toggleSeat(seat)}
                    />
                  ))}
                </div>

                {/* Aisle */}
                <div className="w-2 sm:w-3" />

                {/* Center section */}
                <div className="flex gap-px sm:gap-0.5">
                  {sections.center.map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.has(seat.label)}
                      disabled={disabled}
                      isHovered={hoveredSeat === seat.label}
                      onHover={setHoveredSeat}
                      onClick={() => toggleSeat(seat)}
                    />
                  ))}
                </div>

                {/* Aisle */}
                <div className="w-2 sm:w-3" />

                {/* Right section */}
                <div className="flex gap-px sm:gap-0.5">
                  {sections.right.map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.has(seat.label)}
                      disabled={disabled}
                      isHovered={hoveredSeat === seat.label}
                      onHover={setHoveredSeat}
                      onClick={() => toggleSeat(seat)}
                    />
                  ))}
                </div>

                {/* Row label right */}
                <div className="w-5 text-left text-[9px] sm:text-[10px] font-bold text-gray-400 ml-1 select-none font-mono">
                  {rowLabel}
                </div>
              </div>
            );
          })}
        </div>

      </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedCount > 0 && (
        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Armchair className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Your Selection ({selectedCount})
                </p>
                <p className="text-[10px] text-gray-500">
                  {selectedCount === 1 ? '1 seat' : `${selectedCount} seats`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSeats(new Set())}
              className="text-[10px] text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {seatData.seats
              .filter((s) => selectedSeats.has(s.label))
              .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number)
              .map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[10px] font-semibold rounded-md shadow-sm"
                >
                  <Sofa className="w-2.5 h-2.5" />
                  {s.label}
                </span>
              ))}
          </div>
          {/* Visual preview of seat positions */}
          <div className="mt-3 pt-2.5 border-t border-indigo-100">
            <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
              <MapPin className="w-2.5 h-2.5" />
              <span>
                <span className="font-mono">
                Row{' '}
                {Array.from(new Set(
                  seatData.seats
                    .filter((s) => selectedSeats.has(s.label))
                    .map((s) => s.row)
                )).sort().join(', ')}
                {' — '}
                Seats{' '}
                {seatData.seats
                  .filter((s) => selectedSeats.has(s.label))
                  .sort((a, b) => a.number - b.number)
                  .map((s) => s.number)
                  .join(', ')}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeatButton({
  seat,
  selected,
  disabled,
  isHovered,
  onHover,
  onClick,
}: {
  seat: Seat;
  selected: boolean;
  disabled: boolean;
  isHovered: boolean;
  onHover: (label: string | null) => void;
  onClick: () => void;
}) {
  const isBooked = seat.status === 'booked';
  const isAvailable = seat.status === 'available';
  const isClickable = isAvailable && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      onMouseEnter={() => onHover(seat.label)}
      onMouseLeave={() => onHover(null)}
      title={`${seat.label}${isBooked ? ' — Already booked' : selected ? ' — Selected' : ` — Row ${seat.row}, Seat ${seat.number}`}`}
      className={`
        relative
        w-6 h-6 sm:w-7 sm:h-7
        rounded-t-sm rounded-b-[2px]
        text-[9px] sm:text-[10px]
        font-bold
        transition-all duration-150
        flex items-center justify-center
        focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:ring-offset-0.5
        select-none
        ${
          selected
            ? 'bg-gradient-to-b from-indigo-400 to-indigo-600 text-white border border-indigo-500 shadow shadow-indigo-300/40 scale-110 z-10'
            : isBooked
            ? 'bg-gradient-to-b from-gray-200 to-gray-300 text-gray-400 border border-gray-300 cursor-not-allowed'
            : isAvailable && !disabled
            ? 'bg-gradient-to-b from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 hover:border-indigo-400 hover:shadow-sm hover:-translate-y-px cursor-pointer'
            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
        }
        ${isHovered && isClickable ? '-translate-y-px shadow-sm' : ''}
      `}
      aria-label={`Seat ${seat.label}, ${isBooked ? 'booked' : selected ? 'selected' : 'available'}`}
      aria-pressed={selected}
    >
      {/* Seat number */}
      <span className={`${selected ? 'text-white drop-shadow-sm' : ''}`}>
        {seat.number}
      </span>

      {/* Hover tooltip */}
      {isHovered && isClickable && !selected && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
          {seat.label}
          <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-gray-900" />
        </div>
      )}
    </button>
  );
}