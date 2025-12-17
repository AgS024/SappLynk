<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
</head>
<body>
  <p>Hola {{ $sellerName }},</p>

  <p>
    Te avisamos de que tu carta <strong>{{ $cardName }}</strong> ha sido comprada en SwappLynk.
  </p>

  @if(!empty($purchaseInfo))
    <p>{{ $purchaseInfo }}</p>
  @endif

  <p>Por favor, envía la carta a la siguiente dirección:</p>

  <ul>
    <li><strong>Dirección:</strong> {{ $shippingAddress['direccion'] }}</li>
    <li><strong>Ciudad:</strong> {{ $shippingAddress['ciudad'] }}</li>
    <li><strong>Provincia:</strong> {{ $shippingAddress['provincia'] }}</li>
    <li><strong>Código Postal:</strong> {{ $shippingAddress['cp'] }}</li>
  </ul>

  <p>Gracias por usar SwappLynk.</p>
</body>
</html>
