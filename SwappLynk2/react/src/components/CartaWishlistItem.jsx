import { Link } from 'react-router-dom';
import TButton from './core/TButton.jsx';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function CartaWishlistItem({ item, onDelete }) {
  const tcg = item.tcgdex || item.data || item.carta || item;

  const imageUrl =
    tcg.images?.small ||
    tcg.image?.normal ||
    item.image?.normal ||
    item.image ||
    tcg.image ||
    'https://via.placeholder.com/250x350?text=Sin+imagen';

  const cartaName = tcg.name || 'Carta sin nombre';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link to={`/carta/${item.id_carta}`}>
        <img
          src={imageUrl}
          alt={cartaName}
          className="w-full h-48 object-cover hover:opacity-80"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'https://via.placeholder.com/250x350?text=Sin+imagen';
          }}
        />
      </Link>
      <div className="p-3">
        <h3 className="font-bold text-sm truncate">{cartaName}</h3>
        {item.precio_aviso && (
          <p className="text-red-600 font-semibold mt-1">
            Aviso: €{item.precio_aviso}
          </p>
        )}
        <div className="mt-3">
          <TButton
            circle
            link
            color="red"
            onClick={onDelete}
            className="w-full flex justify-center"
          >
            <TrashIcon className="h-5 w-5" />
          </TButton>
        </div>
      </div>
    </div>
  );
}
