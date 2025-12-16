<?php

namespace App\Jobs;

use App\Models\EnVenta;
use App\Models\Wishlist;
use App\Services\TCGdexService;
use App\Mail\WishlistPriceAlertMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class SendWishlistPriceAlert implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $enVentaId;

    public function __construct(int $enVentaId)
    {
        $this->enVentaId = $enVentaId;
    }

    public function handle(): void
    {
        $pub = EnVenta::with(['usuario'])->find($this->enVentaId);
        if (!$pub) return;

        // Solo si está activa
        if ($pub->estado !== 'activa') return;

        $precioPub = (float) $pub->precio;
        if ($precioPub <= 0) return;

        $idCarta = $pub->id_carta;

        // Buscar wishlists que cumplan precio_aviso >= precioPub y user NO cancelada
        $wishlists = Wishlist::query()
            ->where('id_carta', $idCarta)
            ->whereNotNull('precio_aviso')
            ->where('precio_aviso', '>=', $precioPub)
            ->with(['usuario' => function ($q) {
                $q->select('id', 'name', 'email', 'cancelada');
            }])
            ->get();

        if ($wishlists->isEmpty()) return;

        $tcgdex = new TCGdexService();
        $cardInfo = $tcgdex->getCard($idCarta); // array / null

        foreach ($wishlists as $w) {
            $user = $w->usuario;
            if (!$user) continue;
            if ($user->cancelada) continue;
            if (!$user->email) continue;

            /**
             * ✅ Anti-spam:
             * no reenviar el mismo aviso para (usuario + publicación)
             */
            $cacheKey = "wishlist_alert_sent:user:{$user->id}:enventa:{$pub->id}";
            $added = Cache::add($cacheKey, true, now()->addDays(7)); // solo si no existía

            if (!$added) {
                continue;
            }

            Mail::to($user->email)->send(
                new WishlistPriceAlertMail(
                    userName: $user->name ?? 'Usuario',
                    idCarta: $idCarta,
                    cardInfo: $cardInfo,
                    precioAviso: (float) ($w->precio_aviso ?? 0),
                    precioPublicacion: $precioPub,
                    enVentaId: (int) $pub->id
                )
            );
        }
    }
}
