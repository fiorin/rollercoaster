import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="page-body">
      <div className="page-title">
        <h2>Página não encontrada</h2>
      </div>
      <p className="page-description">
        O endereço que você abriu não existe neste app.
      </p>
      <button
        type="button"
        className="primary"
        onClick={() => navigate("/home")}
      >
        Voltar para o início
      </button>
    </div>
  );
}
