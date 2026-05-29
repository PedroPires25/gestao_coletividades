import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RequireAdmin from "./auth/RequireAdmin";
import RequireSuperAdmin from "./auth/RequireSuperAdmin";
import RequireNotMedico from "./auth/RequireNotMedico";
import TomorrowReminder from "./components/TomorrowReminder";

// páginas base
import LoginPage from "./pages/LoginPage";
const MenuPage = lazy(() => import("./pages/MenuPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const EmailFeedbackPage = lazy(() => import("./pages/EmailFeedbackPage"));
const ResetSuccessPage = lazy(() => import("./pages/ResetSuccessPage"));
const PendingApprovalPage = lazy(() => import("./pages/PendingApprovalPage"));
const AcessoNegadoPage = lazy(() => import("./pages/AcessoNegadoPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminPendingUsersPage = lazy(() => import("./pages/AdminPendingUsersPage"));
const AdminApprovedUsersPage = lazy(() => import("./pages/AdminApprovedUsersPage"));
const ClubesPage = lazy(() => import("./pages/ClubesPage"));
const ClubeHomePage = lazy(() => import("./pages/ClubeHomePage"));
const ClubeEditPage = lazy(() => import("./pages/ClubeEditPage"));
const ClubeAtletasPage = lazy(() => import("./pages/ClubeAtletasPage"));
const ClubeAtletasModalidadePage = lazy(() => import("./pages/ClubeAtletasModalidadePage"));
const ClubeStaffPage = lazy(() => import("./pages/ClubeStaffPage"));
const ClubeStaffModalidadePage = lazy(() => import("./pages/ClubeStaffModalidadePage"));
const ClubeDepartamentoStaffPage = lazy(() => import("./pages/ClubeDepartamentoStaffPage"));
const ClubeModalidadesPage = lazy(() => import("./pages/ClubeModalidadesPage"));
const ClubeEventosPage = lazy(() => import("./pages/ClubeEventosPage"));
const EventosPage = lazy(() => import("./pages/EventosPage"));
const GestaoEventosPage = lazy(() => import("./pages/GestaoEventosPage"));
const ModalidadeEventosPage = lazy(() => import("./pages/ModalidadeEventosPage"));
const ColetividadesPage = lazy(() => import("./pages/ColetividadesPage"));
const ColetividadeHomePage = lazy(() => import("./pages/ColetividadeHomePage"));
const ColetividadeEditPage = lazy(() => import("./pages/ColetividadeEditPage"));
const ColetividadeAtividadesPage = lazy(() => import("./pages/ColetividadeAtividadesPage"));
const ColetividadeUtentesPage = lazy(() => import("./pages/ColetividadeUtentesPage"));
const ColetividadeUtentesAtividadePage = lazy(() => import("./pages/ColetividadeUtentesAtividadePage"));
const ColetividadeStaffPage = lazy(() => import("./pages/ColetividadeStaffPage"));
const ColetividadeStaffAtividadePage = lazy(() => import("./pages/ColetividadeStaffAtividadePage"));
const AreaAcessoClubePage = lazy(() => import("./pages/AreaAcessoClubePage"));
const AreaAcessoColetividadePage = lazy(() => import("./pages/AreaAcessoColetividadePage"));
const ClubeModuloMedicoPage = lazy(() => import("./pages/ClubeModuloMedicoPage"));
const RegistosLesaoPage = lazy(() => import("./pages/RegistosLesaoPage"));
const ConsultasMedicasPage = lazy(() => import("./pages/ConsultasMedicasPage"));
const ExamesMedicosPage = lazy(() => import("./pages/ExamesMedicosPage"));
const PrescricoesPage = lazy(() => import("./pages/PrescricoesPage"));
const RelatoriosMedicosPage = lazy(() => import("./pages/RelatoriosMedicosPage"));
const AtletaFichaMedicaPage = lazy(() => import("./pages/AtletaFichaMedicaPage"));
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const PoliticaPrivacidadePage = lazy(() => import("./pages/PoliticaPrivacidadePage"));

function NotFoundPage() {
    return (
        <div style={{ padding: 24 }}>
            <h1>Página não encontrada</h1>
        </div>
    );
}

function RequireAuth({ children }) {
    const raw = localStorage.getItem("gc_user");
    if (!raw) return <Navigate to="/login" replace />;

    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.token) return <Navigate to="/login" replace />;
        // Se não está aprovado, redirecionar para pending-approval
        if (parsed?.user?.estadoRegisto !== "APROVADO") {
            return <Navigate to="/pending-approval" replace />;
        }
    } catch {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function RouteLoadingFallback() {
    return (
        <div style={{ padding: 24 }}>
            <h1>A carregar...</h1>
        </div>
    );
}

export default function App() {
    return (
        <Suspense fallback={<RouteLoadingFallback />}>
            <TomorrowReminder />
            <Routes>
                {/* rotas públicas */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/recuperar-password/confirmar" element={<EmailFeedbackPage />} />
                <Route path="/reset-password/success" element={<ResetSuccessPage />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidadePage />} />

                {/* Página de registo pendente */}
                <Route path="/pending-approval" element={<PendingApprovalPage />} />

                {/* Acesso negado */}
                <Route path="/acesso-negado" element={<RequireAuth><AcessoNegadoPage /></RequireAuth>} />

                <Route
                    path="/menu"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <MenuPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* PERFIL */}
                <Route
                    path="/perfil"
                    element={
                        <RequireAuth>
                            <PerfilPage />
                        </RequireAuth>
                    }
                />

                {/* ADMIN */}
                <Route
                    path="/admin/users"
                    element={
                        <RequireAdmin>
                            <AdminUsersPage />
                        </RequireAdmin>
                    }
                />

                <Route
                    path="/admin/users/pending"
                    element={
                        <RequireAdmin>
                            <AdminPendingUsersPage />
                        </RequireAdmin>
                    }
                />

                <Route
                    path="/admin/users/approved"
                    element={
                        <RequireAdmin>
                            <AdminApprovedUsersPage />
                        </RequireAdmin>
                    }
                />

                {/* CLUBES — lista global (apenas SUPER_ADMIN) */}
                <Route
                    path="/clubes"
                    element={
                        <RequireSuperAdmin>
                            <ClubesPage />
                        </RequireSuperAdmin>
                    }
                />

                <Route
                    path="/clubes/:clubeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeHomePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* Edição de dados do clube (SUPER_ADMIN ou ADMIN do próprio clube) */}
                <Route
                    path="/clubes/:clubeId/editar"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeEditPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/modalidades"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeModalidadesPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/atletas"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeAtletasPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/atletas/modalidades/:clubeModalidadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeAtletasModalidadePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeStaffPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff/modalidades/:clubeModalidadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ClubeStaffModalidadePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff/departamento/:tipo"
                    element={
                        <RequireAuth>
                            <ClubeDepartamentoStaffPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/eventos"
                    element={
                        <RequireAuth>
                            <ClubeEventosPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/eventos"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <EventosPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/clube-modalidade/:clubeModalidadeId/eventos"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <EventosPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* COLETIVIDADES — lista global (apenas SUPER_ADMIN) */}
                <Route
                    path="/coletividades"
                    element={
                        <RequireSuperAdmin>
                            <ColetividadesPage />
                        </RequireSuperAdmin>
                    }
                />

                <Route
                    path="/coletividades/:id"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeHomePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* Edição de dados da coletividade (SUPER_ADMIN ou ADMIN da própria coletividade) */}
                <Route
                    path="/coletividades/:id/editar"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeEditPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/atividades"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeAtividadesPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/utentes"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeUtentesPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:coletividadeId/utentes/atividades/:coletividadeAtividadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeUtentesAtividadePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/staff"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeStaffPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:coletividadeId/staff/atividades/:coletividadeAtividadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ColetividadeStaffAtividadePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/clube-modalidade/:clubeModalidadeId/modalidade"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <ModalidadeEventosPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/gestao/eventos"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <GestaoEventosPage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* ÁREA DE ACESSO — utilizador vinculado a clube ou coletividade */}
                <Route
                    path="/minha-area/clube/:clubeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <AreaAcessoClubePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />
                <Route
                    path="/minha-area/coletividade/:coletividadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <AreaAcessoColetividadePage />
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* MÓDULO CLÍNICO */}
                <Route path="/clubes/:clubeId/medico" element={<RequireAuth><ClubeModuloMedicoPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/lesoes" element={<RequireAuth><RegistosLesaoPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/consultas" element={<RequireAuth><ConsultasMedicasPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/exames" element={<RequireAuth><ExamesMedicosPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/prescricoes" element={<RequireAuth><PrescricoesPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/relatorios" element={<RequireAuth><RelatoriosMedicosPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/atletas/:atletaId/ficha" element={<RequireAuth><AtletaFichaMedicaPage /></RequireAuth>} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}
