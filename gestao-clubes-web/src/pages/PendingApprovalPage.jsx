import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function PendingApprovalPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                <div className="mb-6">
                    <svg
                        className="mx-auto h-16 w-16 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4v2m0 4v2m0-12a1 1 0 11-2 0 1 1 0 012 0zm0-4a1 1 0 11-2 0 1 1 0 012 0zm4 4a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Registo Pendente de Aprovação
                </h1>

                <p className="text-gray-600 mb-6">
                    Obrigado pelo seu registo! Sua conta está aguardando aprovação de um administrador.
                    Este processo geralmente leva 24 a 48 horas.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                    <p className="text-sm text-blue-700">
                        Você será notificado por email assim que sua conta for aprovada.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                >
                    Fazer Logout
                </button>

                <p className="text-xs text-gray-500 mt-6">
                    Se tiver dúvidas, entre em contato com o suporte técnico.
                </p>
            </div>
        </div>
    );
}
