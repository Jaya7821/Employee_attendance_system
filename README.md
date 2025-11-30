# Employee Attendance System

A modern, full-featured attendance tracking system built with React, TypeScript, and Supabase. Supports both employee and manager roles with comprehensive attendance management features.

## Features

### Employee Features
- Register and login with email/password authentication
- Check in/Check out with automatic late detection
- View personal dashboard with attendance statistics
- Calendar view of attendance history with color-coded status
- Monthly attendance summary
- Personal profile management

### Manager Features
- Comprehensive dashboard with team statistics
- View all employees' attendance records
- Filter attendance by employee, date, and status
- Team calendar view with visual attendance indicators
- Generate and export attendance reports to CSV
- Weekly attendance trends and department-wise analytics
- View absent employees list

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd employee-attendance-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

The database schema has already been created with the following tables:
- `profiles` - User profile information
- `attendance` - Daily attendance records

Row Level Security (RLS) is enabled with appropriate policies for data access control.

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### 5. Run the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Database Schema

### Profiles Table
- `id` (uuid) - Primary key, references auth.users
- `name` (text) - Full name
- `email` (text) - Email address (unique)
- `role` (text) - 'employee' or 'manager'
- `employee_id` (text) - Unique employee identifier
- `department` (text) - Department name
- `created_at` (timestamptz) - Account creation timestamp

### Attendance Table
- `id` (uuid) - Primary key
- `user_id` (uuid) - References profiles.id
- `date` (date) - Attendance date
- `check_in_time` (timestamptz) - Check-in timestamp
- `check_out_time` (timestamptz) - Check-out timestamp
- `status` (text) - 'present', 'absent', 'late', or 'half-day'
- `total_hours` (numeric) - Total hours worked
- `created_at` (timestamptz) - Record creation timestamp

## Usage Guide

### For Employees

1. **Register**: Create an account with email, password, employee ID, and department
2. **Login**: Access your dashboard
3. **Check In**: Click the "Check In" button (automatically marked as late if after 9 AM)
4. **Check Out**: Click the "Check Out" button to log your exit time
5. **View History**: Navigate to "My History" to see your attendance calendar
6. **View Profile**: Check your profile information

### For Managers

1. **Login**: Access the manager dashboard
2. **Dashboard**: View team statistics, attendance trends, and absent employees
3. **All Attendance**: Filter and view all employee attendance records
4. **Team Calendar**: See team-wide attendance visualization
5. **Reports**: Generate custom reports and export to CSV

## Key Features

### Attendance Logic
- Check-ins after 9:00 AM are automatically marked as "late"
- Total hours are calculated between check-in and check-out times
- One attendance record per employee per day
- Real-time dashboard updates

### Security
- Row Level Security (RLS) enabled on all tables
- Employees can only view/edit their own data
- Managers can view all employee data
- Secure authentication with Supabase Auth

### Reporting
- Export attendance data to CSV format
- Filter by date range, employee, and status
- Summary statistics included in reports

## Project Structure

```
src/
├── components/
│   ├── Navbar.tsx           # Navigation component
│   └── ProtectedRoute.tsx   # Route protection wrapper
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── pages/
│   ├── AuthPage.tsx         # Login/Register page
│   ├── EmployeeDashboard.tsx    # Employee dashboard
│   ├── EmployeeHistory.tsx      # Employee attendance history
│   ├── EmployeeProfile.tsx      # Employee profile
│   ├── ManagerDashboard.tsx     # Manager dashboard
│   ├── AllAttendance.tsx        # All employees attendance
│   ├── TeamCalendar.tsx         # Team calendar view
│   └── Reports.tsx              # Reports and CSV export
├── App.tsx                  # Main app component
└── main.tsx                 # App entry point
```

## Color Coding

- **Green**: Present
- **Yellow**: Late
- **Red**: Absent
- **Orange**: Half Day

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.
