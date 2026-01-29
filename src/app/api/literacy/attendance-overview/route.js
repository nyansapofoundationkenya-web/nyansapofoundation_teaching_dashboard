import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes (shorter cache for attendance)

export async function POST(request) {
  try {
    const { organization_id } = await request.json();
    if (!organization_id) {
      return Response.json(
        { success: false, error: "Missing organization_id" },
        { status: 400 }
      );
    }

    const statsRef = db
      .collection("organization")
      .doc(organization_id)
      .collection("stats")
      .doc("attendance_overview");

    const now = Date.now();
    const cachedDoc = await statsRef.get();

    // 1️⃣ If cached data exists
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const isFresh =
        data.last_updated && now - data.last_updated.toMillis() < CACHE_DURATION;

      // Serve fresh cache
      if (isFresh) {
        console.log(`✅ Using cached attendance data for ${organization_id}`);
        return Response.json({
          success: true,
          data: data.result,
          cached: true,
          last_updated: data.last_updated.toDate(),
        });
      }

      // Serve stale data immediately + start background recalc
      console.log(`⏳ Attendance cache stale, returning old data while recalculating...`);
      const response = Response.json({
        success: true,
        data: data.result,
        cached: true,
        last_updated: data.last_updated.toDate(),
        refreshing: true,
      });

      // Trigger background recalculation (non-blocking)
      ;(async () => {
        try {
          console.log(`♻️ Background recalculation started for attendance ${organization_id}`);
          const freshResult = await computeAttendanceOverview(organization_id);
          await statsRef.set({ result: freshResult, last_updated: new Date() });
          console.log(`✅ Background attendance cache updated for ${organization_id}`);
        } catch (err) {
          console.error("ERROR in background attendance recalculation:", err);
        }
      })();

      return response;
    }

    // 2️⃣ No cache found — compute fresh
    const result = await computeAttendanceOverview(organization_id);
    await statsRef.set({ result, last_updated: new Date() });

    return Response.json({
      success: true,
      data: result,
      cached: false,
      last_updated: new Date(),
    });
  } catch (error) {
    console.error("ERROR:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ----------------------
// Heavy computation helper
async function computeAttendanceOverview(organization_id) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Get date 60 days ago for historical data (to calculate previous periods)
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 60);

  // Get all projects for this organization
  const projectsSnapshot = await db
    .collection("organization")
    .doc(organization_id)
    .collection("projects")
    .get();

  if (projectsSnapshot.empty) {
    return {
      today: {
        attendance_rate: 0,
        total_present: 0,
        total_students: 0,
        date: todayStr,
        schools_took_attendance: 0,
        schools_pending_attendance: 0,
        total_schools: 0,
      },
      last_7_days: [],
      last_30_days: [],
      weekly_comparison: {
        this_week_avg: 0,
        last_week_avg: 0,
        change: 0,
        trend: "neutral",
      },
      monthly_comparison: {
        this_month_avg: 0,
        last_month_avg: 0,
        change: 0,
        trend: "neutral",
      },
    };
  }

  // Store attendance data by date
  const attendanceByDate = {}; // { "2025-01-29": { present: 100, total: 120 } }
  
  // Track schools for today's attendance
  let totalSchools = 0;
  const schoolsTookAttendanceToday = new Set(); // Track unique schools that took attendance today

  // Iterate through all projects
  for (const projectDoc of projectsSnapshot.docs) {
    const projectId = projectDoc.id;

    // Get all schools in this project
    const schoolsSnapshot = await db
      .collection("organization")
      .doc(organization_id)
      .collection("projects")
      .doc(projectId)
      .collection("schools")
      .get();

    totalSchools += schoolsSnapshot.size;

    // Iterate through all schools
    for (const schoolDoc of schoolsSnapshot.docs) {
      const schoolId = schoolDoc.id;

      // Get attendance records for this school
      const attendanceSnapshot = await db
        .collection("organization")
        .doc(organization_id)
        .collection("projects")
        .doc(projectId)
        .collection("schools")
        .doc(schoolId)
        .collection("attendance")
        .get();

      // Process each attendance record
      for (const attendanceDoc of attendanceSnapshot.docs) {
        const dateId = attendanceDoc.id; // e.g., "2025-01-29"
        const attendanceData = attendanceDoc.data();

        // Check if this school took attendance today
        if (dateId === todayStr) {
          schoolsTookAttendanceToday.add(`${projectId}_${schoolId}`);
        }

        // Parse the date to check if it's within our range
        const recordDate = new Date(dateId);
        if (recordDate < sixtyDaysAgo || recordDate > today) {
          continue; // Skip dates outside our window
        }

        // Initialize date entry if it doesn't exist
        if (!attendanceByDate[dateId]) {
          attendanceByDate[dateId] = { present: 0, total: 0 };
        }

        // Count present and total students using your actual structure
        // students: [{ attendance: true/false, name: "...", id: "...", grade: 3 }]
        if (attendanceData.students && Array.isArray(attendanceData.students)) {
          const presentCount = attendanceData.students.filter(
            (s) => s.attendance === true
          ).length;
          const totalCount = attendanceData.students.length;

          attendanceByDate[dateId].present += presentCount;
          attendanceByDate[dateId].total += totalCount;
        }
      }
    }
  }

  // Calculate today's attendance
  const todayData = attendanceByDate[todayStr] || { present: 0, total: 0 };
  const todayRate =
    todayData.total > 0
      ? parseFloat(((todayData.present / todayData.total) * 100).toFixed(2))
      : 0;

  // Calculate schools that took attendance today
  const schoolsTookAttendance = schoolsTookAttendanceToday.size;
  const schoolsPendingAttendance = totalSchools - schoolsTookAttendance;

  // Calculate last 7 days trend
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayData = attendanceByDate[dateStr] || { present: 0, total: 0 };
    const rate =
      dayData.total > 0
        ? parseFloat(((dayData.present / dayData.total) * 100).toFixed(2))
        : 0;

    last7Days.push({
      date: dateStr,
      day: date.toLocaleDateString("en-US", { weekday: "short" }), // Mon, Tue, etc.
      attendance_rate: rate,
      total_present: dayData.present,
      total_students: dayData.total,
    });
  }

  // Calculate last 30 days data
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayData = attendanceByDate[dateStr] || { present: 0, total: 0 };
    const rate =
      dayData.total > 0
        ? parseFloat(((dayData.present / dayData.total) * 100).toFixed(2))
        : 0;

    last30Days.push({
      date: dateStr,
      attendance_rate: rate,
      total_present: dayData.present,
      total_students: dayData.total,
    });
  }

  // ==================== WEEKLY COMPARISON ====================
  // This week: last 7 days (already calculated)
  const thisWeekRates = last7Days.filter((d) => d.attendance_rate > 0).map((d) => d.attendance_rate);
  const thisWeekAvg =
    thisWeekRates.length > 0
      ? parseFloat((thisWeekRates.reduce((sum, r) => sum + r, 0) / thisWeekRates.length).toFixed(2))
      : 0;

  // Last week: days 8-14 before today
  const lastWeekRates = [];
  for (let i = 13; i >= 7; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayData = attendanceByDate[dateStr] || { present: 0, total: 0 };
    if (dayData.total > 0) {
      const rate = parseFloat(((dayData.present / dayData.total) * 100).toFixed(2));
      lastWeekRates.push(rate);
    }
  }

  const lastWeekAvg =
    lastWeekRates.length > 0
      ? parseFloat((lastWeekRates.reduce((sum, r) => sum + r, 0) / lastWeekRates.length).toFixed(2))
      : 0;

  const weeklyChange = parseFloat((thisWeekAvg - lastWeekAvg).toFixed(2));
  const weeklyTrend = weeklyChange > 0 ? "up" : weeklyChange < 0 ? "down" : "neutral";

  // ==================== MONTHLY COMPARISON ====================
  // This month: last 30 days
  const thisMonthRates = last30Days.filter((d) => d.attendance_rate > 0).map((d) => d.attendance_rate);
  const thisMonthAvg =
    thisMonthRates.length > 0
      ? parseFloat((thisMonthRates.reduce((sum, r) => sum + r, 0) / thisMonthRates.length).toFixed(2))
      : 0;

  // Last month: days 31-60 before today
  const lastMonthRates = [];
  for (let i = 59; i >= 30; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayData = attendanceByDate[dateStr] || { present: 0, total: 0 };
    if (dayData.total > 0) {
      const rate = parseFloat(((dayData.present / dayData.total) * 100).toFixed(2));
      lastMonthRates.push(rate);
    }
  }

  const lastMonthAvg =
    lastMonthRates.length > 0
      ? parseFloat((lastMonthRates.reduce((sum, r) => sum + r, 0) / lastMonthRates.length).toFixed(2))
      : 0;

  const monthlyChange = parseFloat((thisMonthAvg - lastMonthAvg).toFixed(2));
  const monthlyTrend = monthlyChange > 0 ? "up" : monthlyChange < 0 ? "down" : "neutral";

  return {
    today: {
      attendance_rate: todayRate,
      total_present: todayData.present,
      total_students: todayData.total,
      date: todayStr,
      schools_took_attendance: schoolsTookAttendance,
      schools_pending_attendance: schoolsPendingAttendance,
      total_schools: totalSchools,
    },
    last_7_days: last7Days,
    last_30_days: last30Days,
    weekly_comparison: {
      this_week_avg: thisWeekAvg,
      last_week_avg: lastWeekAvg,
      change: weeklyChange,
      trend: weeklyTrend,
    },
    monthly_comparison: {
      this_month_avg: thisMonthAvg,
      last_month_avg: lastMonthAvg,
      change: monthlyChange,
      trend: monthlyTrend,
    },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";