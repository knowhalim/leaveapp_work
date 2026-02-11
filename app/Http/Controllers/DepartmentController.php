<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::with(['manager', 'employees.user'])
            ->withCount('employees');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        $departments = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $managers = User::where('role', 'manager')
            ->orWhere('role', 'admin')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Admin/Departments/Create', [
            'managers' => $managers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['boolean'],
        ]);

        $department = Department::create($validated);

        ActivityLog::log('department.created', $department);

        return redirect()->route('departments.index')
            ->with('success', 'Department created successfully.');
    }

    public function show(Department $department)
    {
        $department->load(['manager', 'employees.user', 'employees.employeeType']);

        $stats = [
            'totalEmployees' => $department->employees()->count(),
            'activeEmployees' => $department->activeEmployees()->count(),
        ];

        return Inertia::render('Admin/Departments/Show', [
            'department' => $department,
            'stats' => $stats,
        ]);
    }

    public function edit(Department $department)
    {
        $managers = User::where('role', 'manager')
            ->orWhere('role', 'admin')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Admin/Departments/Edit', [
            'department' => $department,
            'managers' => $managers,
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,' . $department->id],
            'manager_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['boolean'],
        ]);

        $department->update($validated);

        ActivityLog::log('department.updated', $department);

        return redirect()->route('departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department)
    {
        if ($department->employees()->count() > 0) {
            return back()->with('error', 'Cannot delete department with employees. Please reassign employees first.');
        }

        ActivityLog::log('department.deleted', $department, [
            'department_name' => $department->name,
        ]);

        $department->delete();

        return redirect()->route('departments.index')
            ->with('success', 'Department deleted successfully.');
    }

    public function toggleStatus(Department $department)
    {
        $department->update(['is_active' => !$department->is_active]);

        ActivityLog::log($department->is_active ? 'department.activated' : 'department.deactivated', $department);

        return back()->with('success', 'Department status updated successfully.');
    }

    public function employees(Department $department)
    {
        $employees = $department->employees()
            ->with(['user', 'employeeType'])
            ->paginate(15);

        return Inertia::render('Admin/Departments/Employees', [
            'department' => $department,
            'employees' => $employees,
        ]);
    }
}
