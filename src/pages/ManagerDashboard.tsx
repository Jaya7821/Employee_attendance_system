import { useEffect, useState } from 'react';
import { supabase, AttendanceRecord, Profile } from '../lib/supabase';
import { Users, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

type DashboardStats = {
  totalEmployees: number;
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
  weeklyTrend: { day: string; present: number; absent: number }[];
  departmentStats: { department: string; present: number; total: number }[];
  absentToday: { name: string; employee_id: string; department: string }[];
};

export function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    weeklyTrend: [],
    departmentStats: [],
    absentToday: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const totalEmployees = profiles?.filter(p => p.role === 'employee').length || 0;

      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('*, profiles!inner(*)')
        .eq('date', today);

      const todayPresent = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const todayLate = todayAttendance?.filter(a => a.status === 'late').length || 0;
      const todayAbsent = totalEmployees - (todayPresent + todayLate);

      const presentUserIds = new Set(todayAttendance?.map(a => a.user_id) || []);
      const absentEmployees = profiles
        ?.filter(p => p.role === 'employee' && !presentUserIds.has(p.id))
        .map(p => ({
          name: p.name,
          employee_id: p.employee_id,
          department: p.department,
        })) || [];

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const { data: weeklyData } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', weekAgoStr)
        .order('date', { ascending: true });

      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = weeklyData?.filter(a => a.date === dateStr) || [];
        weeklyTrend.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          present: dayData.filter(a => a.status === 'present' || a.status === 'late').length,
          absent: totalEmployees - dayData.length,
        });
      }

      const deptMap = new Map<string, { present: number; total: number }>();
      profiles?.filter(p => p.role === 'employee').forEach(p => {
        const dept = p.department || 'Unassigned';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { present: 0, total: 0 });
        }
        const stats = deptMap.get(dept)!;
        stats.total++;
        if (presentUserIds.has(p.id)) {
          stats.present++;
        }
      });

      const departmentStats = Array.from(deptMap.entries()).map(([department, stats]) => ({
        department,
        ...stats,
      }));

      setStats({
        totalEmployees,
        todayPresent,
        todayAbsent,
        todayLate,
        weeklyTrend,
        departmentStats,
        absentToday: absentEmployees,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manager Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Total Employees</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Present Today</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.todayPresent}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.totalEmployees > 0 ? Math.round((stats.todayPresent / stats.totalEmployees) * 100) : 0}% attendance
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Absent Today</p>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.todayAbsent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Late Arrivals</p>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.todayLate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Weekly Attendance Trend
          </h2>
          <div className="space-y-3">
            {stats.weeklyTrend.map((day, index) => (
              <div key={index} className="flex items-center">
                <span className="w-12 text-sm font-medium text-gray-700">{day.day}</span>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full flex items-center justify-end px-2"
                      style={{ width: `${(day.present / stats.totalEmployees) * 100}%` }}
                    >
                      {day.present > 0 && (
                        <span className="text-xs font-medium text-white">{day.present}</span>
                      )}
                    </div>
                    <div
                      className="bg-red-300 h-full flex items-center justify-end px-2"
                      style={{ width: `${(day.absent / stats.totalEmployees) * 100}%` }}
                    >
                      {day.absent > 0 && (
                        <span className="text-xs font-medium text-white">{day.absent}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <span className="text-gray-600">Absent</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Department-wise Attendance
          </h2>
          <div className="space-y-4">
            {stats.departmentStats.map((dept, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                  <span className="text-sm text-gray-600">
                    {dept.present}/{dept.total} ({Math.round((dept.present / dept.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(dept.present / dept.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <XCircle className="w-5 h-5 mr-2 text-red-600" />
          Absent Employees Today
        </h2>
        {stats.absentToday.length === 0 ? (
          <p className="text-gray-600 text-center py-8">All employees are present today!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.absentToday.map((emp, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-600">{emp.employee_id}</p>
                  <p className="text-xs text-gray-500">{emp.department}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
