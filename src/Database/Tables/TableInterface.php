<?php

namespace IgniteBookings\Database\Tables;

interface TableInterface {
    public function name(): string;
    public function sql(): string;
}