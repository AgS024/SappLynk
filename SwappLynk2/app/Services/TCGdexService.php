<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class TCGdexService 
{
    protected $base = 'https://api.tcgdex.net/v2/es';

    // 🔧 Función auxiliar para asegurar que las imágenes tengan extensión .png correcta
    private function fixCardImages($data)
    {
        $quality = 'high';
        $format  = 'png';

        $fixImageUrl = function ($url) use ($quality, $format) {
            if (!$url || !is_string($url)) return $url;

            // Si ya termina con /high.png o similar, no tocarla
            if (preg_match("/\/(low|normal|high)\.{$format}$/", $url) || str_ends_with($url, ".{$format}")) {
                return preg_replace('/(\.png)+$/', '.png', $url);
            }

            // Añadir sufijo correcto solo si falta
            return rtrim($url, '/') . "/{$quality}.{$format}";
        };

        // Carta única
        if (isset($data['image'])) {
            $data['image'] = $fixImageUrl($data['image']);
        }
        // Array de cartas
        elseif (is_array($data) && isset($data[0])) {
            foreach ($data as &$card) {
                if (isset($card['image'])) {
                    $card['image'] = $fixImageUrl($card['image']);
                }
            }
        }

        return $data;
    }

    // 🔍 Buscar cartas por nombre "simple" (barra de búsqueda básica)
    public function searchCards($query) 
    {
        $resp = Http::get("{$this->base}/cards", ['name' => $query]);

        if (!$resp->successful()) {
            return [];
        }

        $data = $resp->json();
        return $this->fixCardImages($data);
    }

    // 🃏 Obtener una carta específica
    public function getCard($id) 
    {
        $resp = Http::get("{$this->base}/cards/{$id}");
        if (!$resp->successful()) {
            return null;
        }

        $data = $resp->json();
        return $this->fixCardImages($data);
    }

    // 📦 Obtener todos los sets
    public function getSets() 
    {
        $cacheKey = 'tcgdex_sets_es';

        return Cache::remember($cacheKey, 86400, function () {
            $resp = Http::get("{$this->base}/sets");
            return $resp->successful() ? $resp->json() : [];
        });
    }

    // 📘 Obtener un set específico
    public function getSet($setId) 
    {
        $cacheKey = "tcgdex_set_{$setId}";

        return Cache::remember($cacheKey, 86400, function () use ($setId) {
            $resp = Http::get("{$this->base}/sets/{$setId}");
            if (!$resp->successful()) {
                return null;
            }

            $data = $resp->json();
            return $this->fixCardImages($data);
        });
    }

    //     Búsqueda avanzada: pasa los filtros tal cual a la API
    //    (name, types, set.id, dexId, rarity, hp, etc.)
    public function advancedSearch(array $filters = [])
    {
        $resp = Http::get("{$this->base}/cards", $filters);

        
        if (!$resp->successful()) {
            return [];
        }

        $data = $resp->json();
        return $this->fixCardImages($data);
    }

    // helper para buscar solo por tipo
    public function searchByType(string $type)
    {
        return $this->advancedSearch(['types' => $type]);
    }
}
