const API_URL = "http://localhost:8000";

export const fetchCourses = async () => {
  const res = await fetch(`${API_URL}/courses`);
  return res.json();
};

export const fetchAssignments = async () => {
  const res = await fetch(`${API_URL}/assignments`);
  return res.json();
};
