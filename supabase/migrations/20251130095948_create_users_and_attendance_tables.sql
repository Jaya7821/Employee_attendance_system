/*
  # Employee Attendance System - Initial Schema

  ## Overview
  Creates the core database structure for an employee attendance tracking system with role-based access control.

  ## New Tables
  
  ### `profiles`
  Extended user profile information linked to Supabase auth.users
  - `id` (uuid, primary key) - References auth.users
  - `name` (text) - Full name of the user
  - `email` (text) - Email address (unique)
  - `role` (text) - User role: 'employee' or 'manager'
  - `employee_id` (text) - Unique employee identifier (e.g., EMP001)
  - `department` (text) - Department name
  - `created_at` (timestamptz) - Account creation timestamp

  ### `attendance`
  Daily attendance records for all employees
  - `id` (uuid, primary key) - Unique record identifier
  - `user_id` (uuid) - References profiles.id
  - `date` (date) - Attendance date
  - `check_in_time` (timestamptz) - Check-in timestamp
  - `check_out_time` (timestamptz) - Check-out timestamp (nullable)
  - `status` (text) - Status: 'present', 'absent', 'late', 'half-day'
  - `total_hours` (numeric) - Total hours worked
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Employees can view/update their own profile and attendance
  - Managers can view all profiles and attendance records
  - Employees can only insert/update their own attendance records

  ## Indexes
  - Index on attendance.user_id for fast user lookups
  - Index on attendance.date for date-based queries
  - Composite index on (user_id, date) for unique constraint and fast queries
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('employee', 'manager')),
  employee_id text UNIQUE NOT NULL,
  department text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half-day')) DEFAULT 'present',
  total_hours numeric(4,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Attendance policies for SELECT
CREATE POLICY "Employees can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Attendance policies for INSERT
CREATE POLICY "Employees can insert own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Attendance policies for UPDATE
CREATE POLICY "Employees can update own attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Attendance policies for DELETE
CREATE POLICY "Employees can delete own attendance"
  ON attendance FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);