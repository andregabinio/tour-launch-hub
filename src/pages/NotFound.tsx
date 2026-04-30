import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="picote-bg flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-extrabold tracking-tight text-7xl text-brand-azul">404</h1>
        <p className="mb-6 text-xl text-foreground lowercase">essa rota não existe por aqui</p>
        <a href="/" className="text-brand-azul font-semibold underline underline-offset-4 hover:opacity-80 lowercase">
          voltar pro painel
        </a>
      </div>
    </div>
  );
};

export default NotFound;
