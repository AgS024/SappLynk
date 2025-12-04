import {LockClosedIcon} from '@heroicons/react/24/solid'
import {Link} from 'react-router-dom'
import {useState} from 'react';
import axiosClient from '../axios.js';
import {useStateContext} from '../Contexts/ContextProvider.jsx';


export default function Login() {
      
    const { setCurrentUser, setUserToken } = useStateContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({__html: ''});

    const onSubmit = (ev) => {
        ev.preventDefault();
        setErrors({__html: ''});

        axiosClient.post('/login', {
        email: email,
        password: password,
        })
        .then(({data}) => {
            setCurrentUser(data.user);
            setUserToken(data.token);
        })
        .catch((error) => {
            if (error.response) {
            const finalError = Object.values(error.response.data.errors).reduce((accum, next) => [...accum, ...next], [])
            setErrors({__html: finalError.join('<br>')});
            }
            console.error(error);
        });
    };

    return (
    <>
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-black">Inicia Sesión con tu cuenta</h2>

        {errors.__html && (<div className="rounded bg-red-50 py-2 px-3 text-red-700 center" dangerouslySetInnerHTML={errors}></div>)}
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm"></div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                <label htmlFor="email" className="block text-sm/6 font-medium text-black">
                    Correo electrónico
                </label>
                <div className="mt-2">
                    <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={ev => setEmail(ev.target.value)}
                    autoComplete="email"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                    placeholder="Correo electrónico"
                    />
                </div>
                </div>


                <div>
                <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm/6 font-medium text-black">
                    Contraseña
                    </label>
                </div>
                <div className="mt-2">
                    <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={ev => setPassword(ev.target.value)}
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black border-2 border-red-600 placeholder:text-gray-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/70 sm:text-sm/6"
                    placeholder="Contraseña"
                    />
                </div>
                </div>


                <div>
                <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                    Inicia Sesión
                </button>
                </div>
            </form>


            <p className="mt-10 text-center text-sm/6 text-black">
                No tienes una cuenta?{' '}
                <Link to="/signup" className="font-semibold text-red-600 hover:text-red-700 underline">
                Regístrate
                </Link>
            </p>
        </div>
    </>
    )
}
