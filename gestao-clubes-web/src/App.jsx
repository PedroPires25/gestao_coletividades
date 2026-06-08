import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RequireAdmin from "./auth/RequireAdmin";
import RequireSuperAdmin from "./auth/RequireSuperAdmin";
import RequireNotMedico from "./auth/RequireNotMedico";
import RequireNotTreinador from "./auth/RequireNotTreinador";
import TomorrowReminder from "./components/TomorrowReminder";

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
const ClubeTransferenciasPage = lazy(() => import("./pages/ClubeTransferenciasPage"));
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
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const PoliticaPrivacidadePage = lazy(() => import("./pages/PoliticaPrivacidadePage"));

const ClubeModuloMedicoPage = lazy(() => import("./pages/ClubeModuloMedicoPage"));
const RegistosLesaoPage = lazy(() => import("./pages/RegistosLesaoPage"));
const ConsultasMedicasPage = lazy(() => import("./pages/ConsultasMedicasPage"));
const ExamesMedicosPage = lazy(() => import("./pages/ExamesMedicosPage"));
const PrescricoesPage = lazy(() => import("./pages/PrescricoesPage"));
const RelatoriosMedicosPage = lazy(() => import("./pages/RelatoriosMedicosPage"));
const AtletaFichaMedicaPage = lazy(() => import("./pages/AtletaFichaMedicaPage"));

const ClubeModuloTreinadorPage = lazy(() => import("./pages/ClubeModuloTreinadorPage"));
const SessoesTreinoPage = lazy(() => import("./pages/SessoesTreinoPage"));
const AssiduidadePage = lazy(() => import("./pages/AssiduidadePage"));
const PlanoTreinoPage = lazy(() => import("./pages/PlanoTreinoPage"));
const EquipasPage = lazy(() => import("./pages/EquipasPage"));
const AtletasTreinadorPage = lazy(() => import("./pages/AtletasTreinadorPage"));
const ConvocatoriasPage = lazy(() => import("./pages/ConvocatoriasPage"));
const TesourariaPage = lazy(() => import("./pages/TesourariaPage"));


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

    let parsed = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return <Navigate to="/login" replace />;
    }

    if (!parsed?.token) return <Navigate to="/login" replace />;
    if (parsed?.user?.estadoRegisto !== "APROVADO") {
        return <Navigate to="/pending-approval" replace />;
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
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/recuperar-password/confirmar" element={<EmailFeedbackPage />} />
                <Route path="/reset-password/success" element={<ResetSuccessPage />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidadePage />} />

                <Route path="/pending-approval" element={<PendingApprovalPage />} />

                <Route path="/acesso-negado" element={<RequireAuth><AcessoNegadoPage /></RequireAuth>} />

                <Route
                    path="/menu"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <MenuPage />
                                </RequireNotTreinador>
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
                                <RequireNotTreinador>
                                    <ClubeHomePage />
                                </RequireNotTreinador>
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
                                <RequireNotTreinador>
                                    <ClubeEditPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/modalidades"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ClubeModalidadesPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/atletas"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ClubeAtletasPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/atletas/modalidades/:clubeModalidadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ClubeAtletasModalidadePage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ClubeStaffPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff/modalidades/:clubeModalidadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ClubeStaffModalidadePage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff/departamento/:tipo"
                    element={
                        <RequireAuth>
                            <RequireNotTreinador>
                                <ClubeDepartamentoStaffPage />
                            </RequireNotTreinador>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/transferencias"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ClubeTransferenciasPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
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
                                <RequireNotTreinador>
                                    <ColetividadeHomePage />
                                </RequireNotTreinador>
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
                                <RequireNotTreinador>
                                    <ColetividadeEditPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/atividades"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ColetividadeAtividadesPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/utentes"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ColetividadeUtentesPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:coletividadeId/utentes/atividades/:coletividadeAtividadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ColetividadeUtentesAtividadePage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/staff"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ColetividadeStaffPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:coletividadeId/staff/atividades/:coletividadeAtividadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ColetividadeStaffAtividadePage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/clube-modalidade/:clubeModalidadeId/modalidade"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <ModalidadeEventosPage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/gestao/eventos"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <GestaoEventosPage />
                                </RequireNotTreinador>
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
                                <RequireNotTreinador>
                                    <AreaAcessoClubePage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />
                <Route
                    path="/minha-area/coletividade/:coletividadeId"
                    element={
                        <RequireAuth>
                            <RequireNotMedico>
                                <RequireNotTreinador>
                                    <AreaAcessoColetividadePage />
                                </RequireNotTreinador>
                            </RequireNotMedico>
                        </RequireAuth>
                    }
                />

                {/* MÓDULO CLÍNICO */}
                <Route path="/clubes/:clubeId/medico" element={<RequireAuth><RequireNotTreinador><ClubeModuloMedicoPage /></RequireNotTreinador></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/lesoes" element={<RequireAuth><RequireNotTreinador><RegistosLesaoPage /></RequireNotTreinador></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/consultas" element={<RequireAuth><RequireNotTreinador><ConsultasMedicasPage /></RequireNotTreinador></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/exames" element={<RequireAuth><RequireNotTreinador><ExamesMedicosPage /></RequireNotTreinador></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/prescricoes" element={<RequireAuth><RequireNotTreinador><PrescricoesPage /></RequireNotTreinador></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/relatorios" element={<RequireAuth><RequireNotTreinador><RelatoriosMedicosPage /></RequireNotTreinador></RequireAuth>} />
                <Route path="/clubes/:clubeId/medico/atletas/:atletaId/ficha" element={<RequireAuth><RequireNotTreinador><AtletaFichaMedicaPage /></RequireNotTreinador></RequireAuth>} />

                {/* MÓDULO TREINADOR */}
                <Route path="/clubes/:clubeId/treinador" element={<RequireAuth><ClubeModuloTreinadorPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/treinador/sessoes" element={<RequireAuth><SessoesTreinoPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/treinador/assiduidade" element={<RequireAuth><AssiduidadePage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/treinador/planos" element={<RequireAuth><PlanoTreinoPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/treinador/equipas" element={<RequireAuth><EquipasPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/treinador/atletas-lista" element={<RequireAuth><AtletasTreinadorPage /></RequireAuth>} />
                <Route path="/clubes/:clubeId/treinador/convocatorias" element={<RequireAuth><ConvocatoriasPage /></RequireAuth>} />

                {/* TESOURARIA */}
                <Route path="/clubes/:clubeId/tesouraria" element={<RequireAuth><RequireNotMedico><RequireNotTreinador><TesourariaPage /></RequireNotTreinador></RequireNotMedico></RequireAuth>} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}