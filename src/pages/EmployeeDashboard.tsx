import { useEffect, useState } from 'react';
import { supabase, AttendanceRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({ present: 0, absent: 0, late: 0, totalHours: 0 });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setTodayAttendance(todayData);

      const { data: monthData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .order('date', { ascending: false });

      if (monthData) {
        const stats = {
          present: monthData.filter(r => r.status === 'present').length,
          absent: monthData.filter(r => r.status === 'absent').length,
          late: monthData.filter(r => r.status === 'late').length,
          totalHours: monthData.reduce((sum, r) => sum + (r.total_hours || 0), 0),
        };
        setMonthlyStats(stats);
      }

      const { data: recentData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

      setRecentAttendance(recentData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const checkInTime = now.toISOString();

      const hour = now.getHours();
      const status = hour >= 9 ? 'late' : 'present';

      const { error } = await supabase.from('attendance').insert({
        user_id: user.id,
        date: today,
        check_in_time: checkInTime,
        status,
      });

      if (error) throw error;
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !todayAttendance) return;

    try {
      const checkOutTime = new Date().toISOString();
      const checkInTime = new Date(todayAttendance.check_in_time!);
      const hours = (new Date(checkOutTime).getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: checkOutTime,
          total_hours: Math.round(hours * 100) / 100,
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'half-day': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Today's Status</h2>
            <p className="text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div>
            {!todayAttendance ? (
              <button
                onClick={handleCheckIn}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Check In</span>
              </button>
            ) : !todayAttendance.check_out_time ? (
              <button
                onClick={handleCheckOut}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Check Out</span>
              </button>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-gray-700 font-medium">Completed</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {todayAttendance && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Check In</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayAttendance.check_in_time ? new Date(todayAttendance.check_in_time).toLocaleTimeString() : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Check Out</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayAttendance.check_out_time ? new Date(todayAttendance.check_out_time).toLocaleTimeString() : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(todayAttendance.status)}`}>
                {todayAttendance.status}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Present Days</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{monthlyStats.present}</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Late Days</p>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{monthlyStats.late}</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Absent Days</p>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{monthlyStats.absent}</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Total Hours</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{monthlyStats.totalHours.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Recent Attendance (Last 7 Days)
        </h2>
        <div className="space-y-3">
          {recentAttendance.map((record) => (
            <div key={record.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-gray-600">
                  {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'} - {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{record.total_hours || 0} hrs</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
