export type ProjectSummary = {
  id: number;
  name: string;
};

export type ProjectTask = {
  id: number;
  name: string;
  owner: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  percentComplete: number;
  isKeyControl: boolean;
};

export type ProjectData = {
  id: number;
  name: string;
  tasks: ProjectTask[];
};
