<!doctype html>
<html lang="es">
  <body style="font-family: Arial, sans-serif;">
    <h2>📩 ¡Alerta de Wishlist!</h2>

    <p>Hola {{ $userName }},</p>

    <p>
      Ha aparecido <strong>{{ $cardName }}</strong> por
      <strong>{{ number_format($price, 2) }} €</strong>,
      por debajo de tu precio de aviso.
    </p>

    <p>
      Vendedor: <strong>{{ $sellerName }}</strong>
    </p>

    <p>
      <a href="{{ $url }}">Ver en el marketplace</a>
    </p>

    <p style="color:#666; font-size:12px;">
      SwappLynk
    </p>
  </body>
</html>
