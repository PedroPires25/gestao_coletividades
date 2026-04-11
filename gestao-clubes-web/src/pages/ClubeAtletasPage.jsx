import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import {
    createAtleta,
    getEscaloes,
    getEstadosAtleta,
    getModalidadesByClube,
} from "../services/atletas";

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

export default function ClubeAtletasPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin } = useAuth();

    const [clube, setClube] = useState(null);
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
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            ...(isSuperAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
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
        [clubeId, isSuperAdmin, logout, navigate]
    );

    async function carregarPagina() {
        if (!clubeId) return;

        setErro("");
        setMsg("");
        setLoadingPagina(true);

        try {
            const [clubeData, modalidadesData, escaloesData, estadosData] = await Promise.all([
                getClubeById(clubeId),
                getModalidadesByClube(clubeId),
                getEscaloes(),
                getEstadosAtleta(),
            ]);

            const listaModalidades = Array.isArray(modalidadesData) ? modalidadesData : [];
            const listaEscaloes = Array.isArray(escaloesData) ? escaloesData : [];
            const listaEstados = Array.isArray(estadosData) ? estadosData : [];

            setClube(clubeData || null);
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
            setErro(e.message || "Não foi possível carregar a página de atletas.");
        } finally {
            setLoadingPagina(false);
        }
    }

    useEffect(() => {
        carregarPagina();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={clube?.nome || "Clube"}
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
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

                {erro ? <div className="alert error">{erro}</div> : null}
                {msg ? <div className="alert ok">{msg}</div> : null}

                <div className="stack-sections">
                    <section className="card card-quick-links">
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

                    <section className="card">
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
                                        <input
                                            id="telefone"
                                            className="input"
                                            name="telefone"
                                            placeholder="912345678"
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
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
