export type AttendanceHistoryAnalytics = {
  totalRecords: number;
  presentToday: number;
  activeMembers: number;
  attendanceRate: number;
};

export function buildAttendanceHistoryAnalytics(input: {
  totalRecords: number;
  presentToday: number;
  activeMembers: number;
}): AttendanceHistoryAnalytics {
  const attendanceRate =
    input.activeMembers > 0 ? Math.round((input.presentToday / input.activeMembers) * 100) : 0;

  return {
    totalRecords: input.totalRecords,
    presentToday: input.presentToday,
    activeMembers: input.activeMembers,
    attendanceRate,
  };
}
