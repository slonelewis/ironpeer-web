import React, { useState, useEffect, useCallback, useRef } from 'react';
import classNames from 'classnames';
import css from './BlockDatesCalendar.module.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Zero out time for local date comparison
const startOfDay = date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toLocalDateString = date => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isBeforeToday = date => {
  const today = startOfDay(new Date());
  return startOfDay(date) < today;
};

const isTodayDate = date => {
  return toLocalDateString(date) === toLocalDateString(new Date());
};

// Build a map of dateString -> exception for the given month
const buildBlockedMap = (exceptions, year, month) => {
  const map = {};
  exceptions.forEach(exc => {
    const { start, end, seats } = exc.attributes;
    if (seats !== 0) return; // only care about blocked (seats=0)
    // Iterate days covered by this exception
    const s = startOfDay(new Date(start));
    const e = startOfDay(new Date(end));
    const cur = new Date(s);
    while (cur < e) {
      if (cur.getFullYear() === year && cur.getMonth() === month) {
        map[toLocalDateString(cur)] = exc.id.uuid;
      }
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
};

// Get all calendar cells for a month (including padding)
const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

/**
 * Monthly grid calendar for blocking/unblocking dates.
 *
 * @param {Object} props
 * @param {string} props.listingId
 * @param {Array} props.allExceptions - loaded exceptions from Redux
 * @param {Object} props.monthlyExceptionQueries - fetch state per month
 * @param {Function} props.onAddAvailabilityException - fn({listingId, start, end, seats})
 * @param {Function} props.onDeleteAvailabilityException - fn({id})
 * @param {Function} props.onFetchExceptions - fn(params)
 */
const BlockDatesCalendar = props => {
  const {
    listingId,
    allExceptions = [],
    monthlyExceptionQueries = {},
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onFetchExceptions,
    scheduledDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  } = props;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [toggling, setToggling] = useState({}); // dateString -> bool (in-flight)
  const fetchedMonths = useRef(new Set());

  // Fetch exceptions for a given month if not already fetched
  const fetchMonth = useCallback((y, m) => {
    const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
    if (fetchedMonths.current.has(monthKey)) return;
    fetchedMonths.current.add(monthKey);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    onFetchExceptions({ listingId, start, end, timeZone: 'Etc/UTC' });
  }, [listingId, onFetchExceptions]);

  // Fetch current and next month on mount + month change
  useEffect(() => {
    fetchMonth(year, month);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    fetchMonth(nextYear, nextMonth);
  }, [year, month, fetchMonth]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const canGoPrev = () => {
    const now = new Date();
    return !(year === now.getFullYear() && month === now.getMonth());
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const blockedMap = buildBlockedMap(allExceptions, year, month);
  const calendarDays = getCalendarDays(year, month);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const isLoading = monthlyExceptionQueries[monthKey]?.fetchExceptionsInProgress;

  const handleDayClick = async date => {
    if (!date) return;
    if (isBeforeToday(date)) return;
    const dateStr = toLocalDateString(date);
    if (toggling[dateStr]) return;

    const exceptionId = blockedMap[dateStr];

    setToggling(t => ({ ...t, [dateStr]: true }));
    try {
      if (exceptionId) {
        // Unblock — delete the exception
        await onDeleteAvailabilityException({ id: exceptionId });
      } else {
        // Block — create exception for this single day (seats: 0)
        const start = new Date(year, month, date.getDate(), 0, 0, 0);
        const end = new Date(year, month, date.getDate() + 1, 0, 0, 0);
        await onAddAvailabilityException({ listingId, start, end, seats: 0 });
      }
    } finally {
      setToggling(t => ({ ...t, [dateStr]: false }));
    }
  };

  return (
    <div className={css.calendar}>
      {/* Header: month nav */}
      <div className={css.header}>
        <button
          className={css.navBtn}
          onClick={prevMonth}
          disabled={!canGoPrev()}
          aria-label="Previous month"
          type="button"
        >
          ‹
        </button>
        <span className={css.monthLabel}>
          {MONTHS[month]} {year}
        </span>
        <button
          className={css.navBtn}
          onClick={nextMonth}
          aria-label="Next month"
          type="button"
        >
          ›
        </button>
      </div>

      {/* Day of week labels */}
      <div className={css.weekRow}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className={css.weekLabel}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={classNames(css.grid, { [css.loading]: isLoading })}>
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className={css.empty} />;

          const dateStr = toLocalDateString(date);
          const isPast = isBeforeToday(date);
          const isToday = isTodayDate(date);
          const isBlocked = !!blockedMap[dateStr];
          const isToggling = !!toggling[dateStr];
          const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const isOffSchedule = scheduledDays.length < 7 && !scheduledDays.includes(DAY_NAMES[date.getDay()]);

          return (
            <button
              key={dateStr}
              type="button"
              className={classNames(css.day, {
                [css.dayPast]: isPast || isOffSchedule,
                [css.dayToday]: isToday && !isOffSchedule,
                [css.dayBlocked]: isBlocked,
                [css.dayOffSchedule]: isOffSchedule,
                [css.dayToggling]: isToggling,
              })}
              onClick={() => handleDayClick(date)}
              disabled={isPast || isToggling || isOffSchedule}
              aria-label={`${dateStr}${isBlocked ? ' (blocked)' : ''}`}
            >
              <span className={css.dayNum}>{date.getDate()}</span>
              {isBlocked && <span className={css.blockX}>✕</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={css.legend}>
        <span className={css.legendItem}>
          <span className={classNames(css.legendDot, css.legendAvailable)} />
          Available
        </span>
        <span className={css.legendItem}>
          <span className={classNames(css.legendDot, css.legendBlocked)} />
          Blocked
        </span>
      </div>
    </div>
  );
};

export default BlockDatesCalendar;
