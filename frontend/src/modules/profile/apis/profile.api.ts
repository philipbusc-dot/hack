import api from "../../../api";
import type {
  Profile,
  ProfileStat,
  ProfileUpdateInput,
  StatInput,
} from "../types/profile.types";

// READ — the logged-in user's profile + statistics.
export async function getProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>("/profile");
  return data;
}

// UPDATE — name (username) and/or about (description).
export async function updateProfile(
  input: ProfileUpdateInput
): Promise<Profile> {
  const { data } = await api.patch<Profile>("/profile", input);
  return data;
}

// UPLOAD — replace the profile picture (deletes the previous one server-side).
export async function uploadPhoto(file: File): Promise<Profile> {
  const form = new FormData();
  form.append("photo", file);
  const { data } = await api.post<Profile>("/profile/photo", form);
  return data;
}

// CREATE — add a statistic.
export async function addStat(input: StatInput): Promise<ProfileStat> {
  const { data } = await api.post<ProfileStat>("/profile/stats", input);
  return data;
}

// UPDATE — edit a statistic.
export async function updateStat(
  id: string,
  input: Partial<StatInput>
): Promise<ProfileStat> {
  const { data } = await api.patch<ProfileStat>(`/profile/stats/${id}`, input);
  return data;
}

// DELETE — remove a statistic.
export async function deleteStat(id: string): Promise<void> {
  await api.delete(`/profile/stats/${id}`);
}
