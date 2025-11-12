import logoImg from "../../assets/markdown-svgrepo-com.svg";
export default function MainHeader() {
  return (
    <header className="text-center p-5 bg-linear-to-l from-sky-100 to-blue-300 shadow-md">
      <h1 className="text-3xl font-bold m-0 text-sky-900 flex items-center justify-center">
        <img
          src={logoImg}
          alt="Markdown Logo"
          className="w-14 object-contain me-2"
        />
        Markdown Previewer
      </h1>
    </header>
  );
}
