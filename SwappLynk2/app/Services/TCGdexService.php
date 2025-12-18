<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class TCGdexService
{
    // URL base de la API de TCGdex (idioma español)
    protected $base = 'https://api.tcgdex.net/v2/es';

    /**
     * Ajusta/normaliza las URLs de imágenes que devuelve TCGdex.
     *
     * Problema que resuelve:
     * - A veces la API devuelve un "base url" y hay que añadir /high.png
     * - O puede venir con ".png.png" por concatenaciones repetidas
     *
     * Esta función se encarga de dejar siempre una URL válida terminada en /high.png.
     */
    private function fixCardImages($data)
    {
        // Configuración fija: queremos calidad alta y formato PNG
        $quality = 'high';
        $format  = 'png';

        // Closure que recibe una url y la normaliza
        $fixImageUrl = function ($url) use ($quality, $format) {
            // Si no hay url o no es string, devolvemos tal cual
            if (!$url || !is_string($url)) return $url;

            // Si ya termina en /high.png o similar, no la modificamos,
            // pero sí "limpiamos" casos raros tipo ".png.png"
            if (preg_match("/\/(low|normal|high)\.{$format}$/", $url) || str_ends_with($url, ".{$format}")) {
                return preg_replace('/(\.png)+$/', '.png', $url);
            }

            // Si no tiene sufijo, se lo añadimos (ej: ".../images/xy7-54" -> ".../images/xy7-54/high.png")
            return rtrim($url, '/') . "/{$quality}.{$format}";
        };

        // Caso 1: respuesta de una carta (tiene 'image' directamente)
        if (isset($data['image'])) {
            $data['image'] = $fixImageUrl($data['image']);
        }
        // Caso 2: respuesta de lista de cartas (array de elementos)
        elseif (is_array($data) && isset($data[0])) {
            foreach ($data as &$card) {
                if (isset($card['image'])) {
                    $card['image'] = $fixImageUrl($card['image']);
                }
            }
        }

        return $data;
    }

    public function searchCards($query)
    {
        // Búsqueda simple de cartas por nombre (para barra de búsqueda básica)
        $resp = Http::get("{$this->base}/cards", ['name' => $query]);

        // Si la API falla, devolvemos array vacío para que el front no reviente
        if (!$resp->successful()) {
            return [];
        }

        // Parseamos JSON y normalizamos imágenes
        $data = $resp->json();
        return $this->fixCardImages($data);
    }

    public function getCard($id)
    {
        // Obtiene el detalle de una carta concreta por ID (ej: "swsh12-45", "bw8-3", etc.)
        $resp = Http::get("{$this->base}/cards/{$id}");

        // Si no existe o la API falla, devolvemos null
        if (!$resp->successful()) {
            return null;
        }

        // Parseamos y normalizamos imágenes
        $data = $resp->json();
        return $this->fixCardImages($data);
    }

    public function getSets()
    {
        // Cacheamos los sets porque cambian poco y es una llamada bastante usada
        $cacheKey = 'tcgdex_sets_es';

        // 86400 = 24 horas en segundos
        return Cache::remember($cacheKey, 86400, function () {
            $resp = Http::get("{$this->base}/sets");
            return $resp->successful() ? $resp->json() : [];
        });
    }

    public function getSet($setId)
    {
        // Cacheamos cada set por separado para no pedirlo continuamente a la API
        $cacheKey = "tcgdex_set_{$setId}";

        return Cache::remember($cacheKey, 86400, function () use ($setId) {
            $resp = Http::get("{$this->base}/sets/{$setId}");

            // Si la API falla o el set no existe, devolvemos null
            if (!$resp->successful()) {
                return null;
            }

            // Parseamos y normalizamos imágenes (a veces el set incluye cartas con image)
            $data = $resp->json();
            return $this->fixCardImages($data);
        });
    }

    public function advancedSearch(array $filters = [])
    {
        // Búsqueda avanzada: enviamos filtros tal cual a /cards
        // (name, types, set.id, dexId, rarity, hp, etc.)
        $resp = Http::get("{$this->base}/cards", $filters);

        // Si la API falla, devolvemos lista vacía para que el front simplemente muestre "sin resultados"
        if (!$resp->successful()) {
            return [];
        }

        // Parseamos JSON y normalizamos imágenes del listado
        $data = $resp->json();
        return $this->fixCardImages($data);
    }

    public function searchByType(string $type)
    {
        // Helper para búsqueda directa por tipo reutilizando advancedSearch()
        return $this->advancedSearch(['types' => $type]);
    }
}
