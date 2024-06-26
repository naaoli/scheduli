// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO(#34): Add ability to choose which section the user wants, not just
//  automatically choosing the first section

/**
 * The id of the next schedule that will be added to the calendar.
 * @type {number}
 */
let id = 1

/**
 * The calendar object.
 * @type {Calendar}
 */
let calendar

/**
 * An alias for the Luxon DateTime object.
 * @type {DateTime}
 */
const DateTime = luxon.DateTime

/**
 * Days of the school week.
 * @enum {number}
 */
const enumDays = {
  DATE_SUNDAY: 0,
  DATE_MONDAY: 1,
  DATE_TUESDAY: 2,
  DATE_WEDNESDAY: 3,
  DATE_THURSDAY: 4,
  DATE_FRIDAY: 5,
  DATE_SATURDAY: 6,
}

/**
 * The array of colors that a calendar schedule can have.
 * @type {Array.<string>}
 */
const ORIGINAL_COLORS = [
  "#ff5f4a",
  "#b52310",
  "#f7b32a",
  "#dba100",
  "#b3c42f",
  "#6bd63a",
  "#3ead0a",
  "#34d17d",
  "#009144",
  "#38d1cc",
  "#03638c",
  "#2a2e82",
  "#491f87",
  "#8f1088",
]

/**
 * A duplicated version of the ORIGINAL_COLORS array. This array gets 'reset' to
 * the ORIGINAL_COLORS array every time a new course schedule is requested.
 * @type {Array.<string>}
 */
let scheduleColors

/**
 * The default color the schedule is set to be when no color is provided.
 * @type {string}
 */
const DEFAULT_SCHEDULE_COLOR = "#00a9ff"

/**
 * Initializes the calendar and moves the view to a hardcoded date in the
 * past.
 */
function initCalendar() {
  // The timezone takes into account the Easter Time zone offset + 1 hour of
  // dayling savings. Since it's a set day in the past, scheduling dates on this
  // calendar shouldn't change because of the time zone.
  calendar = new tui.Calendar("#calendar", {
    defaultView: "week",
    useCreationPopup: true,
    useDetailPopup: true,
    disableDblClick: true,
    disableClick: true,
    isReadOnly: true,
    scheduleView: ["time"],
    taskView: false,
    timezones: [
      {
        timezoneOffset: -300,
        tooltip: "EDT",
      },
    ],
  })
  // The hard coded date that all scheduled events should fall around
  // Date: Sunday January 2nd, 2000 @ 00:00 EST
  calendar.setDate(new Date("2000-01-02T00:00:00"))

  randomizeColors()
  scheduleColors = [...ORIGINAL_COLORS]
}

/**
 * Adds a course to the calendar.
 * @param {Object} course The JSON Object for the course.
 */
async function addCourse(course, section) {
  if (course == null || section == null) {
    return
  }
  const response = await fetch(
    `https://api.umd.io/v1/courses/sections/${encodeURIComponent(section)}`
  )
  const json = await response.json()
  if (json == null) {
    console.log("No sections found for course:", course)
    return
  }
  const firstSection = json[0]
  if (firstSection.meetings == null) {
    console.log("No meetings found for course:", course)
    return
  }

  const color = scheduleColors.pop()
  firstSection.meetings.forEach((meeting) =>
    decodeDayAndAddToCalendar(meeting, firstSection, color)
  )
}

/**
 * Adds a course meeting to the calendar
 * @param {Object} meeting The JSON Object for the meeting.
 * @param {Object} course The JSON Object for the course.
 * @param {string} color The color that the calendar event should be.
 */

function decodeDayAndAddToCalendar(meeting, course, color) {
  const meetingDays = meeting.days

  const startTime = meeting.start_time
  const endTime = meeting.end_time

  if (meetingDays.includes("SU")) {
    addCourseToCalendar(course, startTime, endTime, enumDays.DATE_SUNDAY, color)
  }
  if (meetingDays.includes("M")) {
    addCourseToCalendar(course, startTime, endTime, enumDays.DATE_MONDAY, color)
  }
  if (meetingDays.includes("TU")) {
    addCourseToCalendar(
      course,
      startTime,
      endTime,
      enumDays.DATE_TUESDAY,
      color
    )
  }
  if (meetingDays.includes("W")) {
    addCourseToCalendar(
      course,
      startTime,
      endTime,
      enumDays.DATE_WEDNESDAY,
      color
    )
  }
  if (meetingDays.includes("TH")) {
    addCourseToCalendar(
      course,
      startTime,
      endTime,
      enumDays.DATE_THURSDAY,
      color
    )
  }
  if (meetingDays.includes("F")) {
    addCourseToCalendar(course, startTime, endTime, enumDays.DATE_FRIDAY, color)
  }
  if (meetingDays.includes("SA")) {
    addCourseToCalendar(
      course,
      startTime,
      endTime,
      enumDays.DATE_SATURDAY,
      color
    )
  }
}

/**
 * Adds a course to the calendar given the day of the week and a time.
 * @param {Object} course The JSON Object for the course.
 * @param {string} startTime The string representation of a 12-hour clock
 *     time eg. 8:30pm.
 * @param {string} endTime The string representation of a 12-hour clock
 *     time eg. 8:30pm.
 * @param {enumDays} day The day that the course falls on.
 */
function addCourseToCalendar(course, startTime, endTime, day, color) {
  const startDate = createDate(day, startTime)
  const endDate = createDate(day, endTime)
  createSchedule(course, startDate, endDate, color)
}

/**
 * Creates a schedule on the calendar using the toast API.
 * @param {Object} course The JSON Object for the course.
 * @param {DateTime} startDate The DateTime object of the start time.
 * @param {DateTime} endDate The DateTime object of the end time.
 */
function createSchedule(course, startDate, endDate, color) {
  // The default color is hard-coded to be blue;
  if (color == null) {
    color = DEFAULT_SCHEDULE_COLOR
  }
  const schedule = {
    id: id.toString(),
    color: "#ffffff",
    bgColor: color,
    borderColor: color,
    calendarId: "1",
    title: course.section_id,
    category: "time",
    location: course.meetings.building,
    start: startDate.toISO(),
    end: endDate.toISO(),
    isReadOnly: true,
  }

  console.log("Schedule: ", schedule)
  console.log("Calendar: ", calendar)
  calendar.createSchedules([schedule])
  // Each schedule needs a unique ID. We'll start at 1 and go up from there.
  id++
}

/**
 * Creates a schedule on the calendar using the toast API.
 * @param {enumDays} day The day that the course falls on.
 * @param {hour} min The army-time minute portion of the time/date we want
 *     to create.
 * @return {DateTime} The new DateTime object.
 */
function createDate(day, min) {
  // Split the time string into hours, minutes, and am/pm indicator
  const timeComponents = min.match(/^(\d+):(\d+)(am|pm)$/i)
  if (!timeComponents) {
    throw new Error(
      "Invalid time format: min parameter must be in HH:MMam or HH:MMpm format"
    )
  }

  let [_, hoursStr, minutesStr, ampm] = timeComponents
  // Convert hours and minutes to integers
  let hours = parseInt(hoursStr, 10)
  let minutes = parseInt(minutesStr, 10)

  // Adjust hours for pm time (add 12 if it's pm and not noon)
  if (ampm.toLowerCase() === "pm" && hours !== 12) {
    hours += 12
  }

  // Handle midnight (12:00am)
  if (hours === 12 && ampm.toLowerCase() === "am") {
    hours = 0
  }

  // Create DateTime object
  const sunday = DateTime.fromObject({
    month: 1,
    day: 2,
    year: 2000,
    hour: 0,
    minute: 0,
    second: 0,
    zone: "America/New_York",
  })

  // Calculate minutes since midnight
  const minutesSinceMidnight = hours * 60 + minutes

  // Add days and minutes to Sunday DateTime object
  return sunday.plus({ days: day, minutes: minutesSinceMidnight })
}

/**
 * Clears the calendar of all schedules.
 */
function clear() {
  calendar.clear(/*immediately=*/ true)
  scheduleColors = [...ORIGINAL_COLORS]
}

/**
 * Randomizes the ORIGINAL_COLORS array.
 */
function randomizeColors() {
  for (let i = ORIGINAL_COLORS.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i)
    const temp = ORIGINAL_COLORS[i]
    ORIGINAL_COLORS[i] = ORIGINAL_COLORS[j]
    ORIGINAL_COLORS[j] = temp
  }
}

export const Calendar = {
  addCourse: addCourse,
  initCalendar: initCalendar,
  clear: clear,
}
