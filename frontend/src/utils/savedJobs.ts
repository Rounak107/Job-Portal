export function getSavedJobs(): number[] {
  const saved = localStorage.getItem("savedJobs");
  return saved ? JSON.parse(saved) : [];
}

export function saveJob(id: number) {
  const jobs = getSavedJobs();
  if (!jobs.includes(id)) {
    jobs.push(id);
    localStorage.setItem("savedJobs", JSON.stringify(jobs));
  }
}

export function unsaveJob(id: number) {
  let jobs = getSavedJobs();
  jobs = jobs.filter((jobId) => jobId !== id);
  localStorage.setItem("savedJobs", JSON.stringify(jobs));
}

export function isJobSaved(id: number): boolean {
  return getSavedJobs().includes(id);
}
