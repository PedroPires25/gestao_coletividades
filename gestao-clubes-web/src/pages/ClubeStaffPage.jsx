import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import {
    createStaff,
    getCargosStaff,
    getEscaloesStaff,
    getModalidadesByClube,
    getStaffByClube,
} from "../services/staff";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

import atletasIcon from "../assets/atletas.svg";
import direcaoIcon from "../assets/direcao.svg";
import deptMedicoIcon from "../assets/departamento-medico.svg";
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

const DEPARTAMENTO_LABELS = {
    direcao: "Direção",
    medico: "Dept. Médico",
};

function normalizarTexto(nome) {
    return String(nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarNomeModalidade(nome) {
    return normalizarTexto(nome);
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
    return String(item?.id ?? item?.clubeModalidadeId ?? item?.clube_modalidade_id ?? "");
}

function getModalidadeId(item) {
    return String(item?.modalidade?.id ?? item?.modalidadeId ?? item?.modalidade_id ?? "");
}

function formatDateOnly(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (!text) return "";
    return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function displayEscaloes(item) {
    if (item?.escaloesNomes) return item.escaloesNomes;
    if (item?.escaloes_nomes) return item.escaloes_nomes;
    return "-";
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

function getDepartamentoTipoFromCargo(cargo) {
    const normalized = normalizarTexto(cargo);

    if (["presidente", "secretario"].includes(normalized)) {
        return "direcao";
    }

    if (["medico", "enfermeiro", "fisioterapeuta", "massagista"].includes(normalized)) {
        return "medico";
    }

    return "";
}

function getStaffAreaLabel(item) {
    if (item?.modalidade) return item.modalidade;

    const departamentoTipo = getDepartamentoTipoFromCargo(item?.cargo);
    return DEPARTAMENTO_LABELS[departamentoTipo] || "-";
}

function getStaffDestination(clubeId, item) {
    const clubeModalidadeId = item?.clubeModalidadeId;
    if (clubeModalidadeId != null && clubeModalidadeId !== "") {
        return `/clubes/${clubeId}/staff/modalidades/${clubeModalidadeId}`;
    }

    const departamentoTipo = getDepartamentoTipoFromCargo(item?.cargo);
    if (departamentoTipo) {
        return `/clubes/${clubeId}/staff/departamento/${departamentoTipo}`;
    }

    return "";
}

export default function ClubeStaffPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isDepartamentoMedico } = useAuth();

    const [clube, setClube] = useState(null);
    const [staffRows, setStaffRows] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [escaloes, setEscaloes] = useState([]);
    const [loadingPagina, setLoadingPagina] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [form, setForm] = useState({
        modalidadeId: "",
        nome: "",
        email: "",
        telefone: "",
        morada: "",
        numRegisto: "",
        remuneracao: "0.00",
        cargoId: "",
        dataInicio: new Date().toISOString().slice(0, 10),
        dataFim: "",
        observacoes: "",
        ativo: true,
        escaloesIds: [],
    });

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
            ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
            { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
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

    useEffect(() => {
        async function carregarPagina() {
            if (!clubeId) return;
            setErro("");
            setMsg("");
            setLoadingPagina(true);

            try {
                const [clubeData, staffData, modalidadesData, cargosData, escaloesData] = await Promise.all([
                    getClubeById(clubeId),
                    getStaffByClube(clubeId),
                    getModalidadesByClube(clubeId),
                    getCargosStaff(),
                    getEscaloesStaff(),
                ]);

                const listaModalidades = Array.isArray(modalidadesData) ? modalidadesData : [];
                const listaCargos = Array.isArray(cargosData) ? cargosData : [];
                const listaEscaloes = Array.isArray(escaloesData) ? escaloesData : [];

                setClube(clubeData || null);
                setStaffRows(Array.isArray(staffData) ? staffData : []);
                setModalidades(listaModalidades);
                setCargos(listaCargos);
                setEscaloes(listaEscaloes);

                setForm((prev) => ({
                    ...prev,
                    modalidadeId: prev.modalidadeId || getModalidadeId(listaModalidades?.[0]),
                    cargoId: prev.cargoId || String(listaCargos?.[0]?.id || ""),
                }));
            } catch (e) {
                setErro(e.message || "Não foi possível carregar a página de staff.");
            } finally {
                setLoadingPagina(false);
            }
        }

        carregarPagina();
    }, [clubeId]);

    function onChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function toggleEscalao(id) {
        setForm((prev) => {
            const current = prev.escaloesIds || [];
            const normalized = String(id);
            const exists = current.includes(normalized);
            return {
                ...prev,
                escaloesIds: exists
                    ? current.filter((item) => item !== normalized)
                    : [...current, normalized],
            };
        });
    }

    async function onSubmit(e) {
        e.preventDefault();

        if (!form.nome.trim()) {
            setErro("Indica o nome do membro do staff.");
            return;
        }
        if (!form.cargoId) {
            setErro("Seleciona um cargo.");
            return;
        }
        if (!form.modalidadeId) {
            setErro("Seleciona uma modalidade.");
            return;
        }

        setErro("");
        setMsg("");
        setSaving(true);

        try {
            const created = await createStaff(clubeId, {
                nome: form.nome.trim(),
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                numRegisto: form.numRegisto.trim() || null,
                remuneracao: Number(form.remuneracao || 0),
                modalidadeId: Number(form.modalidadeId),
                cargoId: Number(form.cargoId),
                dataInicio: form.dataInicio || null,
                dataFim: form.dataFim || null,
                observacoes: form.observacoes.trim() || null,
                ativo: Boolean(form.ativo),
                escaloesIds: (form.escaloesIds || []).map((id) => Number(id)),
            });

            setMsg("Membro do staff registado com sucesso.");
            setForm((prev) => ({
                ...prev,
                nome: "",
                email: "",
                telefone: "",
                morada: "",
                numRegisto: "",
                remuneracao: "0.00",
                dataFim: "",
                observacoes: "",
                ativo: true,
                dataInicio: new Date().toISOString().slice(0, 10),
                escaloesIds: [],
            }));

            if (created?.clubeModalidadeId) {
                navigate(`/clubes/${clubeId}/staff/modalidades/${created.clubeModalidadeId}`);
            }
        } catch (e) {
            setErro(e.message || "Não foi possível registar o staff.");
        } finally {
            setSaving(false);
        }
    }

    const prepareExportData = () => {
        const columns = [
            { key: 'nome', label: 'Nome' },
            { key: 'cargo', label: 'Cargo' },
            { key: 'area', label: 'Área' },
            { key: 'escaloes', label: 'Escalões' },
            { key: 'epoca', label: 'Época' },
            { key: 'dataInicio', label: 'Data Início' },
        ];
        const dataToExport = staffRows.map(row => ({
            ...row,
            area: getStaffAreaLabel(row),
            escaloes: displayEscaloes(row),
            dataInicio: formatDateOnly(row.dataInicio) || "-",
        }));
        return { columns, dataToExport };
    };

    const handleExportCsv = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `staff_${clube?.nome || clubeId}.csv`);
    };

    const handleExportPdf = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: "Listagem Geral de Staff",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            filename: `staff_${clube?.nome || clubeId}.pdf`,
        });
    };

    const handlePrint = () => {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: "Listagem Geral de Staff",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
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
                            <img src={atletasIcon} alt="Staff" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Staff</h1>
                        </div>
                    </div>
                    <div className="hint">{clube?.nome || ""}</div>
                </div>

                {erro ? <div className="alert error no-print">{erro}</div> : null}
                {msg ? <div className="alert ok no-print">{msg}</div> : null}

                <div className="stack-sections">
                    {/* Departamentos (sem modalidade) */}
                    <section className="card card-quick-links no-print">
                        <h2>Departamentos</h2>
                        <p className="subtle">Secções do clube não afetas a modalidades específicas.</p>

                        <div className="modalidade-figuras-grid">
                            <Link
                                to={`/clubes/${clubeId}/staff/departamento/direcao`}
                                className="modalidade-figura-btn icon-green"
                                title="Direção"
                            >
                                <span className="modalidade-figura-circle">
                                    <span className="menu-style-icon">
                                        <img src={direcaoIcon} alt="Direção" />
                                    </span>
                                </span>
                                <span className="modalidade-figura-label">Direção</span>
                            </Link>

                            {(isAdmin || isDepartamentoMedico) && (
                                <Link
                                    to={`/clubes/${clubeId}/staff/departamento/medico`}
                                    className="modalidade-figura-btn icon-red"
                                    title="Departamento Médico"
                                >
                                    <span className="modalidade-figura-circle">
                                        <span className="menu-style-icon">
                                            <img src={deptMedicoIcon} alt="Departamento Médico" />
                                        </span>
                                    </span>
                                    <span className="modalidade-figura-label">Dept. Médico</span>
                                </Link>
                            )}
                        </div>
                    </section>

                    <section className="card card-quick-links no-print">
                        <h2>Modalidades</h2>
                        <p className="subtle">Clica numa modalidade para abrir a listagem do staff dessa modalidade.</p>

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
                                            to={`/clubes/${clubeId}/staff/modalidades/${clubeModalidadeId}`}
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
                                <h2>Listagem de staff</h2>
                                <span className="toolbar-count">{staffRows.length} registo(s)</span>
                            </div>
                            <div className="actions no-print">
                                <button className="btn" onClick={handleExportPdf}>Exportar PDF</button>
                                <button className="btn" onClick={handleExportCsv}>Exportar CSV</button>
                                <button className="btn" onClick={handlePrint}>Imprimir</button>
                            </div>
                        </div>

                        {loadingPagina ? (
                            <p className="subtle">A carregar staff...</p>
                        ) : staffRows.length === 0 ? (
                            <p className="subtle">Sem staff registado neste clube.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Cargo</th>
                                        <th>Área</th>
                                        <th>Escalões</th>
                                        <th>Época</th>
                                        <th>Data Início</th>
                                        <th className="no-print">Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {staffRows.map((row) => {
                                        const pendingName = hasPendingName(row.nome);
                                        const destination = getStaffDestination(clubeId, row);

                                        return (
                                            <tr
                                                key={`${row.id}-${row.afetacaoId ?? row.clubeModalidadeId ?? "sem-afetacao"}`}
                                                style={
                                                    pendingName
                                                        ? {
                                                            background: "rgba(255, 193, 7, 0.18)",
                                                            boxShadow: "inset 5px 0 0 #ffcc33",
                                                        }
                                                        : {}
                                                }
                                            >
                                                <td>{pendingName ? <PendingNameCell /> : row.nome}</td>
                                                <td>{row.cargo || "-"}</td>
                                                <td>{getStaffAreaLabel(row)}</td>
                                                <td>{displayEscaloes(row)}</td>
                                                <td>{row.epoca || "-"}</td>
                                                <td>{formatDateOnly(row.dataInicio) || "-"}</td>
                                                <td className="no-print">
                                                    {destination ? (
                                                        <button
                                                            type="button"
                                                            className="btn"
                                                            onClick={() => navigate(destination)}
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
                                <h2>Registar staff</h2>
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
                                        <label className="field-label" htmlFor="modalidadeId">Modalidade</label>
                                        <select id="modalidadeId" className="input" name="modalidadeId" value={form.modalidadeId} onChange={onChange} required>
                                            <option value="">Selecionar</option>
                                            {modalidades.map((item) => (
                                                <option key={getModalidadeId(item)} value={getModalidadeId(item)}>
                                                    {item?.modalidade?.nome || item?.nome || "Modalidade"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row">
                                        <label className="field-label" htmlFor="cargoId">Cargo</label>
                                        <select id="cargoId" className="input" name="cargoId" value={form.cargoId} onChange={onChange} required>
                                            <option value="">Selecionar</option>
                                            {cargos.map((cargo) => (
                                                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="nome">Nome</label>
                                        <input id="nome" className="input" name="nome" value={form.nome} onChange={onChange} placeholder="Nome do staff" required />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="numRegisto">Nº Registo</label>
                                        <input id="numRegisto" className="input" name="numRegisto" value={form.numRegisto} onChange={onChange} placeholder="Registo profissional" />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="email">Email</label>
                                        <input id="email" className="input" name="email" type="email" value={form.email} onChange={onChange} placeholder="email@exemplo.pt" />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="telefone">Telefone</label>
                                        <input id="telefone" className="input" name="telefone" value={form.telefone} onChange={onChange} placeholder="912345678" />
                                    </div>
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="morada">Morada</label>
                                    <input id="morada" className="input" name="morada" value={form.morada} onChange={onChange} placeholder="Morada" />
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="remuneracao">Remuneração</label>
                                        <input id="remuneracao" className="input" name="remuneracao" type="number" min="0" step="0.01" value={form.remuneracao} onChange={onChange} />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="dataInicio">Data início</label>
                                        <input id="dataInicio" className="input" name="dataInicio" type="date" value={form.dataInicio} onChange={onChange} />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="dataFim">Data fim</label>
                                        <input id="dataFim" className="input" name="dataFim" type="date" value={form.dataFim} onChange={onChange} />
                                    </div>
                                    <div className="row">
                                        <label className="field-label">Escalões</label>
                                        <div className="checkbox-grid">
                                            {escaloes.map((escalao) => {
                                                const checked = form.escaloesIds.includes(String(escalao.id));
                                                return (
                                                    <label className="filter-checkbox" key={escalao.id}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleEscalao(escalao.id)}
                                                        />
                                                        {escalao.nome}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="observacoes">Observações</label>
                                    <textarea id="observacoes" className="input" name="observacoes" value={form.observacoes} onChange={onChange} rows={3} />
                                </div>

                                <label className="filter-checkbox">
                                    <input type="checkbox" name="ativo" checked={form.ativo} onChange={onChange} />
                                    Afetação ativa
                                </label>

                                <div className="actions">
                                    <button className="btn btn-primary" type="submit" disabled={saving}>
                                        {saving ? "A guardar..." : "Registar staff"}
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