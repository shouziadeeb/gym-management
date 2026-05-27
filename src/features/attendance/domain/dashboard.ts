export type AttendanceDashboardStats = {
  presentToday: number;
  absentToday: number;
  activeMembers: number;
  expiredMembers: number;
};

export function buildAttendanceDashboardStats(input: {
  presentToday: number;
  activeMembers: number;
  expiredMembers: number;
}): AttendanceDashboardStats {
  const absentToday = Math.max(0, input.activeMembers - input.presentToday);

  return {
    presentToday: input.presentToday,
    absentToday,
    activeMembers: input.activeMembers,
    expiredMembers: input.expiredMembers,
  };
}
