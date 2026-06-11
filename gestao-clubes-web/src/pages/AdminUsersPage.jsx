import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getAdminUsers, getAdminProfiles, updateUserPerfil, updateUserPrivilegios, updateUserEstadoRegisto } from "../api";
import { getHomePathByRole } from "../utils/navigation";

export default function AdminUsersPage() {
    const { user, logout, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const homePath = useMemo(() => getHomePathByRole(user), [user]);

    const menuItems = [
        { label: "Home", to: homePath },
        ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
        ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
        { label: "Perfis", to: "/admin/users" },
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [usersData, profilesData] = await Promise.all([
                    getAdminUsers(),
                    getAdminProfiles(),
                ]);
                setUsers(usersData || []);
                setProfiles(profilesData || []);
            } catch (e) {
                setErro(e.message || "Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleUpdate(userId, action, value) {
        try {
            switch (action) {
                case 'perfil':
                    await updateUserPerfil(userId, value);
                    break;
                case 'privilegios':
                    await updateUserPrivilegios(userId, value);
                    break;
                case 'estado':
                    await updateUserEstadoRegisto(userId, value);
                    break;
                default:
                    break;
            }
            const updatedUsers = await getAdminUsers();
            setUsers(updatedUsers || []);
        } catch (e) {
            alert(e.message || "Erro ao atualizar.");
        }
    }

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle="Gestão de Perfis"
                logoHref={homePath}
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Gestão de Perfis</h1>
                </div>

                {erro && <div className="alert error">{erro}</div>}

                {loading ? (
                    <p>A carregar...</p>
                ) : (
                    <div className="table-wrap">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Utilizador</th>
                                    <th>Perfil</th>
                                    <th>Estado</th>
                                    <th>Privilégios</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.email}</td>
                                        <td>
                                            <select
                                                className="input"
                                                value={u.role}
                                                onChange={e => handleUpdate(u.id, 'perfil', e.target.value)}
                                            >
                                                {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="input"
                                                value={u.estadoRegisto}
                                                onChange={e => handleUpdate(u.id, 'estado', e.target.value)}
                                            >
                                                <option value="PENDENTE">Pendente</option>
                                                <option value="APROVADO">Aprovado</option>
                                                <option value="REJEITADO">Rejeitado</option>
                                            </select>
                                        </td>
                                        <td>
                                            <label className="filter-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={u.privilegiosAtivos}
                                                    onChange={e => handleUpdate(u.id, 'privilegios', e.target.checked)}
                                                />
                                                Ativos
                                            </label>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm" onClick={() => navigate(`/perfil/${u.id}`)}>Ver Detalhes</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}