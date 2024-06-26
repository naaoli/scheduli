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

import { Util } from "./util.js"

let selected = [] // Courses selected by the user
let courses = [] // List with all courses
/**
 * @type {{courseId: string}, {course: Object}}
 */
const courseInfo = {}

/**
 * Gets departments from /api/departments servlet to populate dropdown list
 */
async function getDepartmentOptions() {
  let response
  let departmentList
  try {
    response = await fetch("/api/departments")
    departmentList = await response.json()
  } catch (err) {
    Util.createAlert(
      "An error occurred",
      "danger",
      document.getElementById("alert-container")
    )
    return
  }
  const departmentContainer = document.getElementById("departments")
  departmentContainer.innerHTML = "" // Clearing departmentContainer to get rid of previous options
  // Add instruction to courseList dropdown
  const option = document.createElement("option")
  option.innerText = "Select a Department"
  option.selected = true
  option.hidden = true
  departmentContainer.appendChild(option)
  // Add each course to course list
  const departmentsDetailed = departmentList.departments
  departmentsDetailed.forEach((department) =>
    addDepartmentOption(department, departmentContainer)
  )
}

/**
 * Creates options in departments select list
 * @param {Object} department The JSON Object for the course to add to the
 *     dropdown
 * @param {Element} departmentContainer The element of the container you want
 *     to add options to
 */
function addDepartmentOption(department, departmentContainer) {
  const option = document.createElement("option")
  option.innerText = department.dept_id
  option.value = department.dept_id
  departmentContainer.appendChild(option)
}

/**
 * Gets courses from /api/courses servlet to populate dropdown list
 */
async function getCourseOptions() {
  const departmentSelection = document.getElementById("departments")
  const selectedDepartment =
    departmentSelection.options[departmentSelection.selectedIndex].value
  let response
  let courseList
  try {
    response = await fetch(
      `https://api.umd.io/v1/courses?dept_id=${encodeURIComponent(
        selectedDepartment
      )}`
    )
    courseList = await response.json()
  } catch (err) {
    Util.createAlert(
      "An error occurred",
      "danger",
      document.getElementById("alert-container")
    )
    return
  }
  const courseContainer = document.getElementById("courses")
  courseContainer.innerHTML = "" // Clearing courseContainer to get rid of previous options
  // Add default option to courses dropdown
  const option = document.createElement("option")
  option.innerText = "Select a Course"
  option.selected = true
  option.hidden = true
  courseContainer.appendChild(option)
  // Add each course to course list
  const c_ids = courseList.map((course) => course.course_id)
  const coursesDetailed = courseList
  coursesDetailed.forEach((course) => addCourseOption(course, courseContainer))
}

/**
 * Creates options in select courses list
 * @param {Object} course The JSON Object for the course to add to the
 *     dropdown
 * @param {Element} courseContainer The element of the container you want to
 *     add options to
 */
function addCourseOption(course, courseContainer) {
  courseInfo[course.course_id] = course
  const option = document.createElement("option")
  option.innerText = course.course_id
  courses.push(course.course_id)
  option.value = course.course_id
  courseContainer.appendChild(option)
}

/**
 * Adds a course to the list of selected courses
 */
function addToSelected() {
  const courseContainer = document.getElementById("selected-classes")
  const courseSelection = document.getElementById("courses")
  const selectedCourse =
    courseSelection.options[courseSelection.selectedIndex].value
  if (!selected.includes(selectedCourse) && courses.includes(selectedCourse)) {
    selected.push(selectedCourse)
    courseContainer.appendChild(createCourseListElement(selectedCourse))
  }
}

/**
 * Creates a list element for a course
 * @param {string} course The name of the course to add to the list of
 *     selected courses
 */
function createCourseListElement(course) {
  const liElement = document.createElement("li")
  liElement.setAttribute("class", "list-group-item")

  const courseId = document.createElement("b")
  courseId.innerText = `${course}: `
  liElement.append(courseId)
  liElement.append(document.createTextNode(courseInfo[course].name))

  const deleteButtonElement = document.createElement("button")
  const buttonImage = document.createElement("i")
  buttonImage.setAttribute("class", "fas fa-trash-alt")
  deleteButtonElement.appendChild(buttonImage)
  deleteButtonElement.setAttribute(
    "class",
    "float-right rounded-circle border-0"
  )
  deleteButtonElement.addEventListener("click", () => {
    liElement.remove()
    selected = selected.filter((value) => value != course)
  })
  liElement.appendChild(deleteButtonElement)
  return liElement
}

function getSelected() {
  return selected
}

function getCourses() {
  return courses
}

function getCourseInfo() {
  return courseInfo
}

export const CourseSelector = {
  getSelected: getSelected,
  getCourses: getCourses,
  getCourseInfo: getCourseInfo,
  getDepartmentOptions: getDepartmentOptions,
  getCourseOptions: getCourseOptions,
  addToSelected: addToSelected,
}
