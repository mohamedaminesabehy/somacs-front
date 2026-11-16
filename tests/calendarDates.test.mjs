import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDays, dateKey, shiftCalendarDate } from '../src/pages/sav/calendarDates.mjs'

test('month starts on Monday and ends on Sunday with complete weeks', () => {
  const days = calendarDays('2026-11-15', 'month')
  assert.equal(days[0], '2026-10-26')
  assert.equal(days.at(-1), '2026-12-06')
  assert.equal(days.length, 42)
  assert.equal(new Set(days).size, 42)
})
test('month navigation clamps end-of-month dates', () => {
  assert.equal(shiftCalendarDate('2026-01-31', 'month', 1), '2026-02-28')
  assert.equal(shiftCalendarDate('2024-01-31', 'month', 1), '2024-02-29')
  assert.equal(shiftCalendarDate('2026-12-31', 'month', 1), '2027-01-31')
})
test('week and day views preserve registered dates', () => {
  assert.deepEqual(calendarDays('2026-11-15', 'day'), ['2026-11-15'])
  assert.equal(calendarDays('2026-11-15', 'week')[0], '2026-11-09')
  assert.equal(calendarDays('2026-11-15', 'week').length, 7)
  assert.equal(shiftCalendarDate('2026-11-15', 'week', -1), '2026-11-08')
})
test('missing or invalid dates are not invented', () => {
  assert.equal(dateKey(null), null)
  assert.equal(dateKey('Non renseigné'), null)
  assert.equal(dateKey('2026-02-30'), null)
  assert.equal(dateKey('2026-11-14'), '2026-11-14')
})
