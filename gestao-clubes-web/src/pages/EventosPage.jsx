import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getAtletasTreinador } from "../services/treinador";
import {
  listarEventos,
  criarEvento,
  atualizarEvento,
  deletarEvento,
} from "../services/eventos";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

import modalidadesIcon from "../assets/modalidades.svg";

function formatDateTimeForInput(dateString) {
  if (!dateString) return "";
  const text = String(dateString).trim();
  if (text.includes("T")) {
    return text.slice(0, 16);
  }
  if (text.includes(" ")) {
    return text.replace(" ", "T").slice(0, 16);
  }
  return text.slice(0, 16);
}

function formatDateTimeForDisplay(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${min}`;
}

function convertToServerFormat(datetimeLocalValue) {
  if (!datetimeLocalValue) return "";
  const parts = datetimeLocalValue.split("T");
  if (parts.length !== 2) return datetimeLocalValue;
  return `${parts[0]} ${parts[1]}:00`;
}

export default function EventosPage() {
  const { isAdmin, isTreinador } = useAuth();
  const { clubeId, clubeModalidadeId } = useParams();
  const location = useLocation();

  const isConvocatoriasMode = location.pathname.includes("/treinador/convocatorias");

  const [clube, setClube] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    dataHora: "",
    local: "",
    atletaIds: [],
  });

  const [atletasSearch, setAtletasSearch] = useState("");

  useEffect(() => {
    async function carregar() {
      setErro("");
      setLoading(true);
      try {
        const clubeData = await getClubeById(parseInt(clubeId));
        setClube(clubeData);

        const eventosData = await listarEventos(
          parseInt(clubeId),
          parseInt(clubeModalidadeId)
        );
        setEventos(Array.isArray(eventosData) ? eventosData : []);

        if (isTreinador) {
            const atletasData = await getAtletasTreinador(clubeId);
            setAtletas(Array.isArray(atletasData) ? atletasData : []);
        }

      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }

    if (clubeId) {
      carregar();
    }
  }, [clubeId, clubeModalidadeId, isTreinador]);

  const canManageEventos = isAdmin || (isTreinador && isConvocatoriasMode);

  const atletasFiltrados = atletas.filter((a) =>
    a.nome.toLowerCase().includes(atletasSearch.toLowerCase())
  );

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function toggleAthlete(atletaId) {
    setForm((f) => {
      const ids = f.atletaIds.includes(atletaId)
        ? f.atletaIds.filter((id) => id !== atletaId)
        : [...f.atletaIds, atletaId];
      return { ...f, atletaIds: ids };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMsg("");

    if (!form.titulo.trim()) {
      setErro("Título é obrigatório");
      return;
    }
    if (!form.dataHora) {
      setErro("Data e hora são obrigatórios");
      return;
    }

    try {
      const payload = {
        titulo: form.titulo.trim(),
        dataHora: convertToServerFormat(form.dataHora),
        local: form.local.trim() || null,
        convocados: form.atletaIds,
        criadoPorTreinador: true,
        clubeModalidadeId: parseInt(clubeModalidadeId),
        tipo: 'MODALIDADE'
      };

      if (editingId) {
        await atualizarEvento(
          parseInt(clubeId),
          parseInt(clubeModalidadeId),
          editingId,
          payload
        );
        setMsg("Evento atualizado com sucesso!");
      } else {
        await criarEvento(
          parseInt(clubeId),
          parseInt(clubeModalidadeId),
          payload
        );
        setMsg("Evento criado com sucesso!");
      }

      const eventosData = await listarEventos(
        parseInt(clubeId),
        parseInt(clubeModalidadeId)
      );
      setEventos(Array.isArray(eventosData) ? eventosData : []);

      setForm({ titulo: "", dataHora: "", local: "", atletaIds: [] });
      setEditingId(null);
      setShowForm(false);
      setAtletasSearch("");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleDelete(eventoId) {
    setErro("");
    setMsg("");
    const ok = window.confirm(
      "Tens a certeza que queres apagar este evento?"
    );
    if (!ok) return;

    try {
      await deletarEvento(
        parseInt(clubeId),
        parseInt(clubeModalidadeId),
        eventoId
      );
      setMsg("Evento apagado com sucesso!");

      const eventosData = await listarEventos(
        parseInt(clubeId),
        parseInt(clubeModalidadeId)
      );
      setEventos(Array.isArray(eventosData) ? eventosData : []);
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleEdit(evento) {
    setEditingId(evento.id);
    setForm({
      titulo: evento.titulo || "",
      dataHora: formatDateTimeForInput(evento.dataHora) || "",
      local: evento.local || "",
      atletaIds: [], // TODO: Carregar os atletas já convocados se a API fornecer
    });
    setShowForm(true);
    setTimeout(() => {
      const formEl = document.querySelector(".evento-form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }

  function handleCancel() {
    setForm({ titulo: "", dataHora: "", local: "", atletaIds: [] });
    setEditingId(null);
    setShowForm(false);
    setAtletasSearch("");
  }

  const prepareExportData = () => {
    const columns = [
        { key: 'titulo', label: 'Título' },
        { key: 'dataHoraFormatada', label: 'Data e Hora' },
        { key: 'local', label: 'Local' },
        { key: 'totalAtletas', label: 'Atletas (Nº)' },
    ];
    const dataToExport = eventos.map(e => ({
        ...e,
        dataHoraFormatada: formatDateTimeForDisplay(e.dataHora) || "-",
        local: e.local || "-",
        totalAtletas: e.totalAtletas || 0,
    }));
    return { columns, dataToExport };
  };

  const handleExportCsv = () => {
    const { columns, dataToExport } = prepareExportData();
    exportToCsv(dataToExport, columns, `eventos_${clube?.nome || clubeId}.csv`);
  };

  const handleExportPdf = () => {
    const { columns, dataToExport } = prepareExportData();
    exportToPdf(dataToExport, columns, isConvocatoriasMode ? "Convocatórias" : "Eventos do Clube", clube?.nome, `eventos_${clube?.nome || clubeId}.pdf`);
  };

  const handlePrint = () => {
    const { columns, dataToExport } = prepareExportData();
    printPdf(dataToExport, columns, isConvocatoriasMode ? "Convocatórias" : "Eventos do Clube", clube?.nome);
  };

  if (loading) {
    return (
      <div>
        <SideMenu
          title="Gestão de Coletividades"
          subtitle="A carregar..."
          logoHref="/menu"
          logoSrc="/LOGO_GCDC04.png"
        />
        <div className="container" style={{ paddingTop: 24 }}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideMenu
        title="Gestão de Coletividades"
        subtitle={clube?.nome || "Clube"}
        logoHref="/menu"
        logoSrc="/LOGO_GCDC04.png"
      />

      <div
        className="container"
        style={{
          paddingTop: 24,
          minHeight: "100dvh",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      >
        <div className="page-title page-title-with-icon no-print">
          <div className="page-title-main-wrap">
            <span className="page-title-icon-circle">
              <img src={modalidadesIcon} alt="Eventos" className="page-title-icon" />
            </span>

            <div className="page-title-texts">
              <h1>{isConvocatoriasMode ? "Convocatórias" : "Eventos do Clube"}</h1>
            </div>
          </div>
        </div>

        {erro ? <div className="alert error no-print">{erro}</div> : null}
        {msg ? <div className="alert ok no-print">{msg}</div> : null}

        <div className="stack-sections">
          {/* LISTA DE EVENTOS */}
          <section className="card">
            <div className="modalidades-toolbar">
              <div className="toolbar-title-group">
                <h2>{isConvocatoriasMode ? "Minhas Convocatórias" : "Próximos Eventos"}</h2>
                <span className="toolbar-count">{eventos.length}</span>
              </div>
              <div className="actions no-print">
                 <button className="btn" onClick={handleExportPdf} disabled={eventos.length === 0}>Exportar PDF</button>
                 <button className="btn" onClick={handleExportCsv} disabled={eventos.length === 0}>Exportar CSV</button>
                 <button className="btn" onClick={handlePrint} disabled={eventos.length === 0}>Imprimir</button>
                 {canManageEventos && !showForm && (
                  <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + {isConvocatoriasMode ? "Nova Convocatória" : "Novo Evento"}
                  </button>
                )}
              </div>
            </div>

            {eventos.length === 0 ? (
              <p className="subtle">Nenhum evento criado ainda.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Data e Hora</th>
                      <th>Local</th>
                      <th className="text-center">Atletas</th>
                      {canManageEventos && <th className="text-center no-print">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((evento) => (
                      <tr key={evento.id}>
                        <td className="font-weight-bold">{evento.titulo}</td>
                        <td>{formatDateTimeForDisplay(evento.dataHora)}</td>
                        <td>{evento.local || "-"}</td>
                        <td className="text-center">{evento.totalAtletas || 0}</td>
                        {canManageEventos && (
                          <td className="text-center no-print">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEdit(evento)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(evento.id)}
                              title="Apagar"
                              style={{ marginLeft: "8px" }}
                            >
                              🗑️
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* FORMULÁRIO */}
          {showForm && canManageEventos && (
            <section className="card evento-form no-print">
              <h2>{editingId ? "Editar Convocatória" : "Nova Convocatória"}</h2>

              <div className="form-scroll">
              <form onSubmit={handleSubmit} className="row">
                <div className="row2">
                  <div className="row">
                    <label className="field-label" htmlFor="titulo">
                      Título *
                    </label>
                    <input
                      id="titulo"
                      name="titulo"
                      className="input"
                      type="text"
                      value={form.titulo}
                      onChange={handleInputChange}
                      placeholder="Ex: Jogo contra X"
                    />
                  </div>

                  <div className="row">
                    <label className="field-label" htmlFor="dataHora">
                      Data e Hora *
                    </label>
                    <input
                      id="dataHora"
                      name="dataHora"
                      className="input"
                      type="datetime-local"
                      value={form.dataHora}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <label className="field-label" htmlFor="local">
                    Local
                  </label>
                  <input
                    id="local"
                    name="local"
                    className="input"
                    type="text"
                    value={form.local}
                    onChange={handleInputChange}
                    placeholder="Ex: Pavilhão Municipal"
                  />
                </div>

                <div className="form-section-divider"></div>

                <div className="form-section">
                  <h3 className="form-section-title">Participantes</h3>
                  <div className="row">
                    <label className="field-label">Selecionar Atletas {isTreinador ? "(do seu escalão)" : ""}</label>
                  <input
                    type="text"
                    placeholder="Procurar atleta..."
                    value={atletasSearch}
                    onChange={(e) => setAtletasSearch(e.target.value)}
                    className="input"
                  />
                  <div className="atleta-list-container">
                    {atletasFiltrados.length > 0 ? (
                      atletasFiltrados.map((atleta) => (
                        <div
                          key={atleta.id}
                          className={`atleta-list-item ${
                            form.atletaIds.includes(atleta.id) ? "selected" : ""
                          }`}
                          onClick={() => toggleAthlete(atleta.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="atleta-item-content">
                            <span className="atleta-name">{atleta.nome}</span>
                            <div className="checkbox-indicator">
                              {form.atletaIds.includes(atleta.id) && (
                                <span className="check-mark">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="subtle">
                        {atletasSearch
                          ? "Nenhum atleta encontrado"
                          : "Nenhum atleta disponível"}
                      </p>
                    )}
                  </div>
                  <small className="subtle">
                    {form.atletaIds.length} atleta(s) selecionado(s)
                  </small>
                  </div>
                </div>

                <div className="actions">
                  <button type="submit" className="btn btn-primary">
                    {editingId ? "Atualizar" : "Criar"} {isConvocatoriasMode ? "Convocatória" : "Evento"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        .atleta-list-container {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 4px;
          background: white;
          margin: 10px 0;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
          font-weight: 600;
          color: #333;
        }

        .table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .table tbody tr:hover {
          background: #f9f9f9;
        }

        .text-center {
          text-align: center;
        }

        .btn-sm {
          padding: 6px 10px;
          font-size: 0.9em;
          background: white;
          border: 1px solid #ddd;
          color: #333;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
        }

        .btn-sm:hover {
          background: #333;
          color: white;
          border-color: #333;
        }

        .atleta-checkbox-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          background: white;
          margin: 10px 0;
        }

        .evento-form {
          margin-top: 30px;
        }

        .font-weight-bold {
          font-weight: 600;
        }
      `}</style>
    </>
  );
}