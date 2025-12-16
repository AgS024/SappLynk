<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WishlistPriceAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $userName;
    public string $cardName;
    public float $price;
    public string $sellerName;
    public string $url;

    public function __construct(string $userName, string $cardName, float $price, string $sellerName, string $url)
    {
        $this->userName   = $userName;
        $this->cardName   = $cardName;
        $this->price      = $price;
        $this->sellerName = $sellerName;
        $this->url        = $url;
    }

    public function build()
    {
        return $this
            ->subject('📢 Carta de tu wishlist disponible')
            ->view('emails.wishlist-price-alert');
    }
}
