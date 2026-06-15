<?php
namespace IgniteBookings\Database;

use IgniteBookings\Database\Tables\CategoriesTable;
use IgniteBookings\Database\Tables\ServicesTable;
use IgniteBookings\Database\Tables\EmployeesTable;
use IgniteBookings\Database\Tables\CustomersTable;
use IgniteBookings\Database\Tables\PackagesTable;
use IgniteBookings\Database\Tables\AppointmentsTable;
use IgniteBookings\Database\Tables\EmployeeServicesTable;
use IgniteBookings\Database\Tables\WorkingHoursTable;
use IgniteBookings\Database\Tables\AvailabilityExceptionsTable;
use IgniteBookings\Database\Tables\PackageServicesTable;
use IgniteBookings\Database\Tables\PaymentsTable;
use IgniteBookings\Database\Tables\NotificationsTable;

class Schema {

    /**
     * Order of instantiation is crucial!
     * Independence-ranked hierarchy ensures FK generation matches dependency rules perfectly.
     */
    public static function getTables(): array {
        return [
            // Level 1: Core Base Tables (Zero foreign key dependencies)
            new CategoriesTable(),
            new EmployeesTable(),
            new CustomersTable(),
            new PackagesTable(),

            // Level 2: Inter-dependent Base Tables (References Level 1)
            new ServicesTable(), // References Categories

            // Level 3: Core Transaction Hub (References multiple Level 1 & 2 items)
            new AppointmentsTable(), // References Services, Employees, Customers, Packages

            // Level 4: Child Pivot & Log Components (References parent rows via CASCADE/RESTRICT paths)
            new EmployeeServicesTable(),
            new WorkingHoursTable(),
            new AvailabilityExceptionsTable(),
            new PackageServicesTable(),
            new PaymentsTable(),
            new NotificationsTable(),
        ];
    }
}
