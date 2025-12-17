export default function PageComponent({ title, buttons = "", children }) {
  return (
    <>
      <header className="relative bg-white border-b-2 border-red-600 after:pointer-events-none after:absolute after:inset-x-0 after:inset-y-0 after:border-y after:border-red-200">
        <div className="flex justify-between items-center mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>
          {buttons}
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}
