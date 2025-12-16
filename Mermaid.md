erDiagram
    USER ||--o{ COLECCION : tiene
    CARTA ||--o{ COLECCION : aparece_en
    GRADO ||--o{ COLECCION : clasifica

    USER ||--o{ WISHLIST : guarda
    CARTA ||--o{ WISHLIST : deseada_por

    USER ||--o{ EN_VENTA : publica
    CARTA ||--o{ EN_VENTA : se_vende
    GRADO ||--o{ EN_VENTA : con_grado

    EN_VENTA ||--o| VENTA : genera
    USER ||--o{ VENTA : compra
    ESTADO ||--o{ VENTA : estado

    VENTA ||--o{ VALORACION : tiene
    USER ||--o{ VALORACION : recibe
    USER ||--o{ VALORACION : hace

    USER {
      int id
      string name
      string email
    }

    CARTA {
      string id
    }

    GRADO {
      int id
      string nombre
      string descripcion
    }

    COLECCION {
      int id
      int id_usuario
      string id_carta
      int id_grado
    }

    EN_VENTA {
      int id
      int id_usuario
      string id_carta
      int id_grado
      decimal precio
      string estado
    }

    VENTA {
      int id
      int id_en_venta
      int id_comprador
      int id_estado
      decimal precio_total
      datetime fecha_venta
    }

    ESTADO {
      int id
      string nombre
    }

    VALORACION {
      int id
      int id_venta
      int id_valorado
      int id_valorador
      int puntuacion
      string descripcion
    }

    WISHLIST {
      int id
      int id_usuario
      string id_carta
      decimal precio_aviso
    }

