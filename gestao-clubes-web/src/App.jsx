import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAdmin from "./auth/RequireAdmin";

// páginas base
import LoginPage from "./pages/LoginPage";
import MenuPage from "./pages/MenuPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EmailFeedbackPage from "./pages/EmailFeedbackPage";
import ResetSuccessPage from "./pages/ResetSuccessPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";

// admin
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminPendingUsersPage from "./pages/AdminPendingUsersPage";
import AdminApprovedUsersPage from "./pages/AdminApprovedUsersPage";

// clubes
import ClubesPage from "./pages/ClubesPage";
import ClubeHomePage from "./pages/ClubeHomePage";
import ClubeAtletasPage from "./pages/ClubeAtletasPage";
import ClubeAtletasModalidadePage from "./pages/ClubeAtletasModalidadePage";
import ClubeStaffPage from "./pages/ClubeStaffPage";
import ClubeStaffModalidadePage from "./pages/ClubeStaffModalidadePage";
import ClubeModalidadesPage from "./pages/ClubeModalidadesPage";
import ClubeEventosPage from "./pages/ClubeEventosPage";
import EventosPage from "./pages/EventosPage";
import GestaoEventosPage from "./pages/GestaoEventosPage";
import ModalidadeEventosPage from "./pages/ModalidadeEventosPage";

// coletividades
import ColetividadesPage from "./pages/ColetividadesPage";
import ColetividadeHomePage from "./pages/ColetividadeHomePage";

// novas páginas das coletividades
import ColetividadeAtividadesPage from "./pages/ColetividadeAtividadesPage";
import ColetividadeUtentesPage from "./pages/ColetividadeUtentesPage";
import ColetividadeUtentesAtividadePage from "./pages/ColetividadeUtentesAtividadePage";
import ColetividadeStaffPage from "./pages/ColetividadeStaffPage";
import ColetividadeStaffAtividadePage from "./pages/ColetividadeStaffAtividadePage";

// área de acesso (utilizador)
import AreaAcessoClubePage from "./pages/AreaAcessoClubePage";
import AreaAcessoColetividadePage from "./pages/AreaAcessoColetividadePage";

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

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* rotas públicas */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/recuperar-password/confirmar" element={<EmailFeedbackPage />} />
                <Route path="/reset-password/success" element={<ResetSuccessPage />} />

                {/* Página de registo pendente */}
                <Route path="/pending-approval" element={<PendingApprovalPage />} />

                <Route
                    path="/menu"
                    element={
                        <RequireAuth>
                            <MenuPage />
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

                {/* CLUBES */}
                <Route
                    path="/clubes"
                    element={
                        <RequireAuth>
                            <ClubesPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId"
                    element={
                        <RequireAuth>
                            <ClubeHomePage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/modalidades"
                    element={
                        <RequireAuth>
                            <ClubeModalidadesPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/atletas"
                    element={
                        <RequireAuth>
                            <ClubeAtletasPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/atletas/modalidades/:clubeModalidadeId"
                    element={
                        <RequireAuth>
                            <ClubeAtletasModalidadePage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff"
                    element={
                        <RequireAuth>
                            <ClubeStaffPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/staff/modalidades/:clubeModalidadeId"
                    element={
                        <RequireAuth>
                            <ClubeStaffModalidadePage />
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
                            <EventosPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/clube-modalidade/:clubeModalidadeId/eventos"
                    element={
                        <RequireAuth>
                            <EventosPage />
                        </RequireAuth>
                    }
                />

                {/* COLETIVIDADES */}
                <Route
                    path="/coletividades"
                    element={
                        <RequireAuth>
                            <ColetividadesPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id"
                    element={
                        <RequireAuth>
                            <ColetividadeHomePage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/atividades"
                    element={
                        <RequireAuth>
                            <ColetividadeAtividadesPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/utentes"
                    element={
                        <RequireAuth>
                            <ColetividadeUtentesPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:coletividadeId/utentes/atividades/:coletividadeAtividadeId"
                    element={
                        <RequireAuth>
                            <ColetividadeUtentesAtividadePage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:id/staff"
                    element={
                        <RequireAuth>
                            <ColetividadeStaffPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/coletividades/:coletividadeId/staff/atividades/:coletividadeAtividadeId"
                    element={
                        <RequireAuth>
                            <ColetividadeStaffAtividadePage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/clubes/:clubeId/clube-modalidade/:clubeModalidadeId/modalidade"
                    element={
                        <RequireAuth>
                            <ModalidadeEventosPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/gestao/eventos"
                    element={
                        <RequireAuth>
                            <GestaoEventosPage />
                        </RequireAuth>
                    }
                />

                {/* ÁREA DE ACESSO — utilizador vinculado a clube ou coletividade */}
                <Route
                    path="/minha-area/clube/:clubeId"
                    element={
                        <RequireAuth>
                            <AreaAcessoClubePage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/minha-area/coletividade/:coletividadeId"
                    element={
                        <RequireAuth>
                            <AreaAcessoColetividadePage />
                        </RequireAuth>
                    }
                />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AuthProvider>
    );
}