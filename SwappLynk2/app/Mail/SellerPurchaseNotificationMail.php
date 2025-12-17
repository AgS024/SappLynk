<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SellerPurchaseNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $sellerName;
    public string $cardName;
    public string $purchaseInfo;
    public array $shippingAddress;

    /**
     * Construye el correo para notificar al vendedor que su carta se ha vendido
     * y debe enviarla a la dirección de intermediación.
     */
    public function __construct(string $sellerName, string $cardName, string $purchaseInfo = '')
    {
        $this->sellerName = $sellerName;
        $this->cardName = $cardName;
        $this->purchaseInfo = $purchaseInfo;

        $this->shippingAddress = [
            'direccion' => 'Calle Extremadura, 9, 2D',
            'ciudad' => 'Jerez',
            'provincia' => 'Cádiz',
            'cp' => '11407',
        ];
    }

    /**
     * Define asunto y plantilla del email.
     */
    public function build()
    {
        return $this
            ->subject('Tu carta se ha vendido en SwappLynk')
            ->view('emails.seller_purchase_notification');
    }
}
