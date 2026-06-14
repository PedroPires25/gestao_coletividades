import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import TelefoneInput from "../components/TelefoneInput";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import {
    createAtleta,
    getAtletasByClubeModalidade,
    getEscaloes,
    getEstadosAtleta,
    getModalidadesByClube,
} from "../services/atletas";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";
import { validateTelefone } from "../utils/validation";

import atletasIcon from "../assets/atletas.svg";

import futebolIcon from "../assets/futebol.svg";
import basquetebolIcon from "../assets/basquetebol.svg";
import andebolIcon from "../assets/andebol.svg";
import futsalIcon from "../assets/futsal.svg";
import voleibolIcon from "../assets/voleibol.svg";
import atletismoIcon from "../assets/atletismo.svg";
import natacaoIcon from "../assets/natacao.svg";
import tenisIcon from "../assets/tenis.svg";
import padelIcon from "../assets/padel.svg";
import hoqueiIcon from "../assets/hoquei.svg";
import ginasticaIcon from "../assets/ginastica.svg";
import karateIcon from "../assets/karate.svg";
import judoIcon from "../assets/judo.svg";
import taekwondoIcon from "../assets/taekwondo.svg";
import escaladaIcon from "../assets/escalada.svg";
import patinagemIcon from "../assets/patinagem.svg";
import tenisMesaIcon from "../assets/tenis-de-mesa.svg";
import defaultIcon from "../assets/default.svg";

const COLOR_CLASSES = [
    "icon-turquoise",
    "icon-orange",
    "icon-red",
    "icon-green",
    "icon-purple",
];

function normalizarNomeModalidade(nome) {
    return String(nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getFiguraModalidade(nome) {
    const normalizado = normalizarNomeModalidade(nome);

    const mapa = {
        futebol: futebolIcon,
        basquetebol: basquetebolIcon,
        andebol: andebolIcon,
        futsal: futsalIcon,
        voleibol: voleibolIcon,
        atletismo: atletismoIcon,
        natacao: natacaoIcon,
        tenis: tenisIcon,
        padel: padelIcon,
        hoquei: hoqueiIcon,
        ginastica: ginasticaIcon,
        karate: karateIcon,
        judo: judoIcon,
        taekwondo: taekwondoIcon,
        escalada: escaladaIcon,
        patinagem: patinagemIcon,
        "tenis de mesa": tenisMesaIcon,
    };

    return mapa[normalizado] || defaultIcon;
}

function getClubeModalidadeId(item) {
    return String(
        item?.id ??
        item?.clubeModalidadeId ??
        item?.clube_modalidade_id ??
        ""
    );
}

function getModalidadeId(item) {
    return String(
        item?.modalidade?.id ??
        item?.modalidadeId ??
        item?.modalidade_id ??
        ""
    );
}

function formatDateOnly(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (!text) return "";
    return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function displayEscalao(atleta) {
    return (
        atleta?.escalao?.nome ||
        atleta?.escalao_nome ||
        atleta?.escalaoNome ||
        atleta?.escalao ||
        "-"
    );
}

function displayEstado(atleta) {
    return (
        atleta?.estado?.descricao ||
        atleta?.estado_descricao ||
        atleta?.estadoDescricao ||
        atleta?.estado ||
        "-"
    );
}

function hasPendingName(value) {
    return !value || String(value).trim() === "-";
}

function PendingNameCell() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(255, 193, 7, 0.14)",
                border: "1px solid rgba(255, 193, 7, 0.38)",
                boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
            }}
        >
            <div style={{ color: "#ffd166", fontWeight: 800 }}>
                ⚠ Completar dados de inscrição
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                Registo criado por aprovação administrativa
            </div>
        </div>
    );
}

export default function ClubeAtletasPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin } = useAuth();

    const [clube, setClube] = useState(null);
    const [atletasRows, setAtletasRows] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [escaloes, setEscaloes] = useState([]);
    const [estados, setEstados] = useState([]);

    const [loadingPagina, setLoadingPagina] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [form, setForm] = useState({
        modalidadeId: "",
        nome: "",
        dataNascimento: "",
        email: "",
        telefone: "",
        morada: "",
        remuneracao: "0.00",
        escalaoId: "",
        estadoId: "",
        dataInscricao: "",
        dataFim: "",
        ativo: true,
    });

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
            ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
            { label: "Staff", to: `/clubes/${clubeId}/staff` },
            { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, isAdmin, isSuperAdmin, logout, navigate]
    );

    const modalidadesByClubeModalidadeId = useMemo(() => {
        const entries = modalidades.map((item) => [
            getClubeModalidadeId(item),
            item?.modalidade?.nome || item?.nome || "Modalidade",
        ]);
        return new Map(entries);
    }, [modalidades]);

    useEffect(() => {
        let isMounted = true;

        async function carregarPagina() {
            if (!clubeId) return;

            if (isMounted) {
                setErro("");
                setMsg("");
                setLoadingPagina(true);
            }

            try {
                const [clubeData, modalidadesData, escaloesData, estadosData] = await Promise.all([
                    getClubeById(clubeId),
                    getModalidadesByClube(clubeId),
                    getEscaloes(),
                    getEstadosAtleta(),
                ]);

                if (!isMounted) return;

                const listaModalidades = Array.isArray(modalidadesData) ? modalidadesData : [];
                const listaEscaloes = Array.isArray(escaloesData) ? escaloesData : [];
                const listaEstados = Array.isArray(estadosData) ? estadosData : [];
                const atletasPorModalidade = await Promise.all(
                    listaModalidades.map(async (item) => {
                        const clubeModalidadeId = getClubeModalidadeId(item);
                        if (!clubeModalidadeId) return [];
                        const atletas = await getAtletasByClubeModalidade(clubeId, clubeModalidadeId);
                        return Array.isArray(atletas) ? atletas : [];
                    })
                );

                if (!isMounted) return;

                setClube(clubeData || null);
                setAtletasRows(atletasPorModalidade.flat());
                setModalidades(listaModalidades);
                setEscaloes(listaEscaloes);
                setEstados(listaEstados);

                setForm((prev) => ({
                    ...prev,
                    modalidadeId: prev.modalidadeId || getModalidadeId(listaModalidades?.[0]),
                    escalaoId: prev.escalaoId || String(listaEscaloes?.[0]?.id || ""),
                    estadoId: prev.estadoId || String(listaEstados?.[0]?.id || ""),
                    dataInscricao: prev.dataInscricao || new Date().toISOString().slice(0, 10),
                }));
            } catch (e) {
                if (isMounted) {
                    setErro(e.message || "Não foi possível carregar a página de atletas.");
                }
            } finally {
                if (isMounted) {
                    setLoadingPagina(false);
                }
            }
        }

        carregarPagina();
        
        return () => {
            isMounted = false;
        };
    }, [clubeId]);

    function onChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function onSubmit(e) {
        e.preventDefault();

        if (!form.modalidadeId) {
            setErro("Seleciona uma modalidade.");
            return;
        }
        const telErr = validateTelefone(form.telefone);
        if (telErr) { setErro(telErr); return; }

        setErro("");
        setMsg("");
        setSaving(true);

        try {
            await createAtleta(clubeId, form.modalidadeId, {
                nome: String(form.nome || "").trim(),
                dataNascimento: form.dataNascimento || null,
                email: String(form.email || "").trim() || null,
                telefone: String(form.telefone || "").trim() || null,
                morada: String(form.morada || "").trim() || null,
                estadoId: form.estadoId ? Number(form.estadoId) : null,
                escalaoId: form.escalaoId ? Number(form.escalaoId) : null,
                remuneracao: Number(form.remuneracao || 0),
                dataInscricao: form.dataInscricao || null,
                dataFim: form.dataFim || null,
                ativo: Boolean(form.ativo),
            });

            const modalidadeRegisto = modalidades.find(
                (item) => getModalidadeId(item) === String(form.modalidadeId)
            );

            setMsg("Atleta registado com sucesso.");
            setForm((prev) => ({
                ...prev,
                nome: "",
                dataNascimento: "",
                email: "",
                telefone: "",
                morada: "",
                remuneracao: "0.00",
                dataFim: "",
                ativo: true,
                dataInscricao: new Date().toISOString().slice(0, 10),
            }));

            if (modalidadeRegisto) {
                navigate(
                    `/clubes/${clubeId}/atletas/modalidades/${getClubeModalidadeId(modalidadeRegisto)}`
                );
            }
        } catch (e) {
            setErro(e.message || "Não foi possível registar o atleta.");
        } finally {
            setSaving(false);
        }
    }

    const prepareExportData = () => {
        const columns = [
            { key: 'nome', label: 'Nome' },
            { key: 'modalidadeNome', label: 'Modalidade' },
            { key: 'escalao', label: 'Escalão' },
            { key: 'estado', label: 'Estado' },
            { key: 'epoca', label: 'Época' },
            { key: 'dataInscricao', label: 'Data Inscrição' },
        ];
        
        const dataToExport = atletasRows.map(atleta => ({
            ...atleta,
            modalidadeNome: modalidadesByClubeModalidadeId.get(String(atleta?.clubeModalidadeId ?? "")) || "Modalidade",
            escalao: displayEscalao(atleta),
            estado: displayEstado(atleta),
            dataInscricao: formatDateOnly(atleta.dataInscricao) || "-",
        }));
        
        return { columns, dataToExport };
    };

    const handleExportCsv = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `atletas_${clube?.nome || clubeId}.csv`);
    };
    
    const handleExportPdf = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: "Listagem Geral de Atletas",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            filename: `atletas_${clube?.nome || clubeId}.pdf`,
            generatedText: "Criado em",
        });
    };

    const handlePrint = () => {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: "Listagem Geral de Atletas",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            generatedText: "Criado em",
        });
    };

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={clube?.nome || "Clube"}
                logoHref="/menu"
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon no-print">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={atletasIcon} alt="Atletas" className="page-title-icon" />
                        </span>

                        <div className="page-title-texts">
                            <h1>Atletas</h1>
                        </div>
                    </div>

                    <div className="hint">{clube?.nome || ""}</div>
                </div>

                {erro && <div className="alert error no-print">{erro}</div>}
                {msg && <div className="alert ok no-print">{msg}</div>}

                <div className="stack-sections">
                    <section className="card card-quick-links no-print">
                        <h2>Modalidades</h2>
                        <p className="subtle">
                            Clica numa modalidade para abrir a listagem dos atletas dessa modalidade.
                        </p>

                        {loadingPagina ? (
                            <p className="subtle">A carregar modalidades...</p>
                        ) : modalidades.length === 0 ? (
                            <p className="subtle">Este clube ainda não tem modalidades associadas.</p>
                        ) : (
                            <div className="modalidade-figuras-grid">
                                {modalidades.map((item, index) => {
                                    const nome = item?.modalidade?.nome || item?.nome || "Modalidade";
                                    const iconSrc = getFiguraModalidade(nome);
                                    const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length];
                                    const clubeModalidadeId = getClubeModalidadeId(item);

                                    return (
                                        <Link
                                            key={clubeModalidadeId || `modalidade-${index}`}
                                            to={`/clubes/${clubeId}/atletas/modalidades/${clubeModalidadeId}`}
                                            className={`modalidade-figura-btn ${colorClass}`}
                                            title={nome}
                                        >
                                            <span className="modalidade-figura-circle">
                                                <span className="menu-style-icon">
                                                    <img src={iconSrc} alt={nome} />
                                                </span>
                                            </span>

                                            <span className="modalidade-figura-label">{nome}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Listagem de atletas</h2>
                                <span className="toolbar-count">{atletasRows.length} registo(s)</span>
                            </div>
                            <div className="actions no-print">
                                <button className="btn" onClick={handleExportPdf}>Exportar PDF</button>
                                <button className="btn" onClick={handleExportCsv}>Exportar CSV</button>
                                <button className="btn" onClick={handlePrint}>Imprimir</button>
                            </div>
                        </div>

                        {loadingPagina ? (
                            <p className="subtle">A carregar atletas...</p>
                        ) : atletasRows.length === 0 ? (
                            <p className="subtle">Sem atletas registados neste clube.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Modalidade</th>
                                        <th>Escalão</th>
                                        <th>Estado</th>
                                        <th>Época</th>
                                        <th>Data Inscrição</th>
                                        <th className="no-print">Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {atletasRows.map((atleta) => {
                                        const pendingName = hasPendingName(atleta.nome);
                                        const clubeModalidadeId = String(atleta?.clubeModalidadeId ?? "");
                                        const modalidadeNome =
                                            modalidadesByClubeModalidadeId.get(clubeModalidadeId) || "Modalidade";

                                        return (
                                            <tr
                                                key={`${atleta.id}-${clubeModalidadeId || "sem-modalidade"}`}
                                                style={
                                                    pendingName
                                                        ? {
                                                            background: "rgba(255, 193, 7, 0.18)",
                                                            boxShadow: "inset 5px 0 0 #ffcc33",
                                                        }
                                                        : {}
                                                }
                                            >
                                                <td>{pendingName ? <PendingNameCell /> : atleta.nome}</td>
                                                <td>{modalidadeNome}</td>
                                                <td>{displayEscalao(atleta)}</td>
                                                <td>{displayEstado(atleta)}</td>
                                                <td>{atleta.epoca || "-"}</td>
                                                <td>{formatDateOnly(atleta.dataInscricao) || "-"}</td>
                                                <td className="no-print">
                                                    {clubeModalidadeId ? (
                                                        <button
                                                            type="button"
                                                            className="btn"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/clubes/${clubeId}/atletas/modalidades/${clubeModalidadeId}`
                                                                )
                                                            }
                                                        >
                                                            Abrir
                                                        </button>
                                                    ) : (
                                                        <span className="cell-muted">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="card no-print">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Gerir Eventos</h2>
                                <span className="toolbar-count">Convocações</span>
                            </div>
                        </div>

                        {loadingPagina ? (
                            <p className="subtle">A carregar modalidades...</p>
                        ) : modalidades.length === 0 ? (
                            <p className="subtle">Este clube ainda não tem modalidades associadas.</p>
                        ) : (
                            <div className="modalidade-figuras-grid">
                                {modalidades.map((item, index) => {
                                    const nome = item?.modalidade?.nome || item?.nome || "Modalidade";
                                    const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length];
                                    const clubeModalidadeId = getClubeModalidadeId(item);

                                    return (
                                        <Link
                                            key={`eventos-${clubeModalidadeId}`}
                                            to={`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos`}
                                            className={`modalidade-figura-btn ${colorClass}`}
                                            title={`Eventos - ${nome}`}
                                        >
                                            <span className="modalidade-figura-circle">
                                                <span className="menu-style-icon">
                                                    <span style={{ fontSize: "2em" }}>📅</span>
                                                </span>
                                            </span>

                                            <span className="modalidade-figura-label">{nome}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="card no-print">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Registar atleta</h2>
                                <span className="toolbar-count">Base de dados</span>
                            </div>
                        </div>

                        {loadingPagina ? (
                            <p className="subtle">A carregar dados do formulário...</p>
                        ) : modalidades.length === 0 ? (
                            <p className="subtle">Este clube ainda não tem modalidades associadas.</p>
                        ) : (
                            <div className="form-scroll">
                            <form onSubmit={onSubmit} className="row">
                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="modalidadeId">
                                            Modalidade
                                        </label>
                                        <select
                                            id="modalidadeId"
                                            className="input"
                                            name="modalidadeId"
                                            value={form.modalidadeId}
                                            onChange={onChange}
                                            required
                                        >
                                            <option value="">Selecionar</option>
                                            {modalidades.map((item) => (
                                                <option
                                                    key={getModalidadeId(item)}
                                                    value={getModalidadeId(item)}
                                                >
                                                    {item?.modalidade?.nome || item?.nome || "Modalidade"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row">
                                        <label className="field-label" htmlFor="nome">
                                            Nome
                                        </label>
                                        <input
                                            id="nome"
                                            className="input"
                                            name="nome"
                                            placeholder="Nome do atleta"
                                            value={form.nome}
                                            onChange={onChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="dataNascimento">
                                            Data de nascimento
                                        </label>
                                        <input
                                            id="dataNascimento"
                                            className="input"
                                            name="dataNascimento"
                                            type="date"
                                            value={form.dataNascimento}
                                            onChange={onChange}
                                        />
                                    </div>

                                    <div className="row">
                                        <label className="field-label" htmlFor="dataInscricao">
                                            Data de inscrição
                                        </label>
                                        <input
                                            id="dataInscricao"
                                            className="input"
                                            name="dataInscricao"
                                            type="date"
                                            value={form.dataInscricao}
                                            onChange={onChange}
                                        />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="email">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            className="input"
                                            name="email"
                                            type="email"
                                            placeholder="email@exemplo.pt"
                                            value={form.email}
                                            onChange={onChange}
                                        />
                                    </div>

                                    <div className="row">
                                        <label className="field-label" htmlFor="telefone">
                                            Telefone
                                        </label>
                                        <TelefoneInput
                                            name="telefone"
                                            value={form.telefone}
                                            onChange={onChange}
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="morada">
                                        Morada
                                    </label>
                                    <input
                                        id="morada"
                                        className="input"
                                        name="morada"
                                        placeholder="Morada"
                                        value={form.morada}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="remuneracao">
                                            Remuneração
                                        </label>
                                        <input
                                            id="remuneracao"
                                            className="input"
                                            name="remuneracao"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.remuneracao}
                                            onChange={onChange}
                                        />
                                    </div>

                                    <div className="row">
                                        <label className="field-label" htmlFor="dataFim">
                                            Data fim
                                        </label>
                                        <input
                                            id="dataFim"
                                            className="input"
                                            name="dataFim"
                                            type="date"
                                            value={form.dataFim}
                                            onChange={onChange}
                                        />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="escalaoId">
                                            Escalão
                                        </label>
                                        <select
                                            id="escalaoId"
                                            className="input"
                                            name="escalaoId"
                                            value={form.escalaoId}
                                            onChange={onChange}
                                        >
                                            <option value="">Selecionar</option>
                                            {escaloes.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row">
                                        <label className="field-label" htmlFor="estadoId">
                                            Estado
                                        </label>
                                        <select
                                            id="estadoId"
                                            className="input"
                                            name="estadoId"
                                            value={form.estadoId}
                                            onChange={onChange}
                                        >
                                            <option value="">Selecionar</option>
                                            {estados.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.descricao}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <label className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        name="ativo"
                                        checked={form.ativo}
                                        onChange={onChange}
                                    />
                                    Atleta ativo
                                </label>

                                <div className="actions">
                                    <button className="btn btn-primary" type="submit" disabled={saving}>
                                        {saving ? "A guardar..." : "Registar atleta"}
                                    </button>
                                </div>
                            </form>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}