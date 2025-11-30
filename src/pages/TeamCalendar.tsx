import { useEffect, useState } from 'react';
import { supabase, AttendanceRecord, Profile } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type AttendanceWithProfile = AttendanceRecord & {
  profiles: Profile;
};

export function TeamCalendar() {
  const [attendance, setAttendance] = useState<AttendanceWithProfile[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [currentMonth]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select('*, profiles!inner(*)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getAttendanceStatsForDate = (day: number) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    const dayAttendance = attendance.filter(a => a.date === dateStr);
    return {
      present: dayAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
      absent: dayAttendance.filter(a => a.status === 'absent').length,
      total: dayAttendance.length,
    };
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Team Calendar View</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }
                const stats = getAttendanceStatsForDate(day);
                const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                const percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

                let bgColor = 'bg-gray-50';
                if (percentage >= 90) bgColor = 'bg-green-100';
                else if (percentage >= 70) bgColor = 'bg-yellow-100';
                else if (stats.total > 0) bgColor = 'bg-red-100';

                return (
                  <div
                    key={day}
                    className={`aspect-square border-2 rounded-lg p-2 transition-all ${bgColor} ${
                      isToday ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{day}</div>
                    {stats.total > 0 && (
                      <div className="text-xs space-y-1">
                        <div className="text-green-700 font-medium">
                          ✓ {stats.present}
                        </div>
                        {stats.absent > 0 && (
                          <div className="text-red-700 font-medium">
                            ✗ {stats.absent}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 border-2 border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">90%+ Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 border-2 border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">70-89% Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-100 border-2 border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">&lt;70% Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-50 border-2 border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">No Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
