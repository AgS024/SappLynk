<?php

use Illuminate\Support\Facades\Route;
use App\Mail\WishlistPriceAlertMail;
use Illuminate\Support\Facades\Mail;

Route::get('/', function () {
    return view('welcome');
});

