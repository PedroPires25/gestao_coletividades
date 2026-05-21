import { Link } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";

export default function PoliticaPrivacidadePage() {
    const { theme } = useTheme();

    return (
        <div className={`login-page ${theme}`} style={{ minHeight: "100vh", overflowY: "auto" }}>
            <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 60px" }}>

                <div style={{ marginBottom: 24 }}>
                    <Link to="/login" className="btn" style={{ fontSize: 14 }}>
                        ← Voltar ao login
                    </Link>
                </div>

                <div style={{
                    background: "#ffffff",
                    color: "#222",
                    padding: "48px 56px",
                    borderRadius: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    lineHeight: 1.7,
                    fontSize: 15,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
                }}>

                <h1 style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, color: "#111" }}>Política de Privacidade</h1>
                <p style={{ color: "#666", marginBottom: 32 }}>
                    Gestão de Coletividades – Desporto e Cultura<br />
                    <em>Última atualização: Maio de 2026</em>
                </p>

                {/* ── POLÍTICA DE PRIVACIDADE ── */}
                <Section title="1. Introdução">
                    <p>
                        A plataforma <strong>Gestão de Coletividades – Desporto e Cultura</strong> foi desenvolvida
                        por <strong>Joel Silva</strong> e <strong>Pedro Pires</strong> no âmbito de atividades
                        académicas da Universidade Aberta.
                    </p>
                    <p>
                        A presente Política de Privacidade estabelece as regras relativas à recolha, utilização,
                        armazenamento e proteção dos dados pessoais dos utilizadores da plataforma, garantindo o
                        cumprimento do <strong>Regulamento Geral sobre a Proteção de Dados (RGPD)</strong> e da
                        legislação nacional aplicável à proteção de dados pessoais.
                    </p>
                    <p>A utilização da plataforma implica a leitura e aceitação das presentes condições.</p>
                </Section>

                <Section title="2. Responsável pelo tratamento dos dados">
                    <p>
                        Durante a fase académica e de desenvolvimento do projeto, os responsáveis pelo tratamento
                        dos dados são:
                    </p>
                    <p><strong>Joel Silva e Pedro Pires</strong><br />
                        Projeto académico desenvolvido no âmbito da Universidade Aberta.
                    </p>
                    <p>
                        Caso a plataforma venha futuramente a ser utilizada por entidades reais, como clubes,
                        associações ou coletividades, a responsabilidade pelo tratamento dos dados será transferida
                        para a entidade gestora responsável pela sua operação.
                    </p>
                </Section>

                <Section title="3. Dados pessoais recolhidos">
                    <p>A plataforma poderá recolher e tratar diferentes categorias de dados pessoais, incluindo:</p>
                    <SubSection title="Dados de identificação">
                        <ul>
                            <li>Nome completo</li>
                            <li>Data de nascimento</li>
                            <li>Género</li>
                            <li>Número interno de identificação</li>
                            <li>Fotografia (quando aplicável)</li>
                            <li>Morada</li>
                        </ul>
                    </SubSection>
                    <SubSection title="Dados de contacto">
                        <ul>
                            <li>Endereço de correio eletrónico</li>
                            <li>Número de telefone</li>
                        </ul>
                    </SubSection>
                    <SubSection title="Dados administrativos">
                        <ul>
                            <li>Dados de inscrição</li>
                            <li>Histórico de participação</li>
                            <li>Clube ou coletividade associada</li>
                            <li>Modalidades praticadas</li>
                            <li>Escalão desportivo</li>
                        </ul>
                    </SubSection>
                    <SubSection title="Dados médicos e de saúde">
                        <p>Quando aplicável, poderão ser recolhidos:</p>
                        <ul>
                            <li>Alergias</li>
                            <li>Restrições médicas</li>
                            <li>Informação clínica relevante</li>
                            <li>Aptidão física</li>
                            <li>Observações médicas necessárias ao acompanhamento do atleta ou utente</li>
                        </ul>
                    </SubSection>
                    <SubSection title="Dados técnicos">
                        <ul>
                            <li>Endereço IP</li>
                            <li>Registos de acesso</li>
                            <li>Dados de sessão</li>
                            <li>Informação relacionada com utilização da plataforma</li>
                        </ul>
                    </SubSection>
                </Section>

                <Section title="4. Finalidade da recolha de dados">
                    <p>Os dados pessoais são recolhidos exclusivamente para:</p>
                    <ul>
                        <li>Gestão de utilizadores</li>
                        <li>Gestão de atletas e utentes</li>
                        <li>Gestão de coletividades</li>
                        <li>Gestão de inscrições</li>
                        <li>Gestão administrativa</li>
                        <li>Gestão de atividades desportivas e culturais</li>
                        <li>Gestão do departamento médico</li>
                        <li>Comunicação com os utilizadores</li>
                        <li>Garantia da segurança e funcionamento do sistema</li>
                        <li>Produção de estatísticas internas</li>
                    </ul>
                </Section>

                <Section title="5. Base legal para tratamento dos dados">
                    <SubSection title="Consentimento do titular">
                        <p>Quando o utilizador autoriza expressamente o tratamento dos dados.</p>
                    </SubSection>
                    <SubSection title="Execução dos serviços disponibilizados">
                        <p>Quando os dados são necessários ao funcionamento da plataforma.</p>
                    </SubSection>
                    <SubSection title="Cumprimento de obrigações legais">
                        <p>Quando exista obrigação legal aplicável.</p>
                    </SubSection>
                    <SubSection title="Interesse legítimo">
                        <p>Para assegurar segurança, manutenção e melhoria do sistema.</p>
                    </SubSection>
                </Section>

                <Section title="6. Tratamento de dados de saúde">
                    <p>Os dados médicos são considerados dados sensíveis e apenas serão tratados:</p>
                    <ul>
                        <li>mediante consentimento explícito</li>
                        <li>para finalidades diretamente relacionadas com acompanhamento desportivo ou segurança do utilizador</li>
                        <li>por pessoas autorizadas</li>
                    </ul>
                </Section>

                <Section title="7. Utilizadores menores de idade">
                    <p>A plataforma poderá incluir atletas ou utilizadores menores de idade. Nestes casos:</p>
                    <ul>
                        <li>será necessária autorização do encarregado de educação</li>
                        <li>apenas serão recolhidos dados estritamente necessários</li>
                        <li>o encarregado de educação poderá solicitar acesso, alteração ou eliminação dos dados do menor</li>
                    </ul>
                </Section>

                <Section title="8. Conservação dos dados">
                    <p>Os dados pessoais serão conservados apenas durante o período necessário para:</p>
                    <ul>
                        <li>cumprimento das finalidades para as quais foram recolhidos</li>
                        <li>cumprimento de obrigações legais</li>
                        <li>necessidades administrativas da plataforma</li>
                    </ul>
                    <p>Findo esse período, os dados serão eliminados ou anonimizados.</p>
                </Section>

                <Section title="9. Partilha de dados">
                    <p>Os dados pessoais não serão vendidos nem cedidos a terceiros. Poderão apenas ser partilhados:</p>
                    <ul>
                        <li>quando exigido por obrigação legal</li>
                        <li>quando necessário para funcionamento técnico do sistema</li>
                        <li>mediante consentimento explícito do titular</li>
                    </ul>
                </Section>

                <Section title="10. Segurança dos dados">
                    <p>Serão adotadas medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra:</p>
                    <ul>
                        <li>acesso não autorizado</li>
                        <li>utilização indevida</li>
                        <li>perda</li>
                        <li>destruição</li>
                        <li>alteração</li>
                        <li>divulgação não autorizada</li>
                    </ul>
                </Section>

                <Section title="11. Direitos dos utilizadores">
                    <p>O titular dos dados possui os seguintes direitos:</p>
                    <ul>
                        <li>Direito de acesso</li>
                        <li>Direito de retificação</li>
                        <li>Direito ao apagamento</li>
                        <li>Direito à limitação do tratamento</li>
                        <li>Direito à portabilidade</li>
                        <li>Direito de oposição</li>
                        <li>Direito de retirar consentimento</li>
                    </ul>
                </Section>

                <Section title="12. Alterações à política">
                    <p>
                        A presente Política de Privacidade poderá ser alterada sempre que necessário.
                        As alterações entrarão em vigor após publicação na plataforma.
                    </p>
                </Section>

                {/* ── TERMOS E CONDIÇÕES ── */}
                <hr style={{ margin: "40px 0", border: "none", borderTop: "1px solid #ddd" }} />
                <h1 style={{ marginBottom: 4, fontWeight: 600, color: "#111" }}>Termos e Condições de Utilização</h1>
                <p style={{ color: "#666", marginBottom: 32 }}>
                    Gestão de Coletividades – Desporto e Cultura<br />
                    <em>Última atualização: Maio de 2026</em>
                </p>

                <Section title="1. Objeto">
                    <p>Os presentes Termos e Condições regulam a utilização da plataforma Gestão de Coletividades – Desporto e Cultura.</p>
                </Section>

                <Section title="2. Acesso à plataforma">
                    <p>O acesso à plataforma poderá exigir:</p>
                    <ul>
                        <li>registo de utilizador</li>
                        <li>autenticação através de credenciais de acesso</li>
                        <li>aceitação dos presentes termos</li>
                    </ul>
                </Section>

                <Section title="3. Responsabilidades do utilizador">
                    <p>O utilizador compromete-se a:</p>
                    <ul>
                        <li>fornecer informação verdadeira</li>
                        <li>manter a confidencialidade das credenciais</li>
                        <li>utilizar a plataforma de forma adequada</li>
                        <li>respeitar os restantes utilizadores</li>
                        <li>não comprometer a segurança do sistema</li>
                    </ul>
                </Section>

                <Section title="4. Utilizações proibidas">
                    <p>É proibido:</p>
                    <ul>
                        <li>utilizar dados falsos</li>
                        <li>tentar obter acesso não autorizado</li>
                        <li>alterar ou comprometer dados do sistema</li>
                        <li>utilizar a plataforma para atividades ilegais</li>
                        <li>interferir com o funcionamento normal do serviço</li>
                    </ul>
                </Section>

                <Section title="5. Informação médica">
                    <p>As informações médicas inseridas deverão ser corretas e atualizadas.</p>
                    <p>A plataforma não substitui avaliação médica profissional.</p>
                </Section>

                <Section title="6. Suspensão de acesso">
                    <p>O acesso poderá ser suspenso em situações de:</p>
                    <ul>
                        <li>utilização indevida</li>
                        <li>violação dos presentes termos</li>
                        <li>tentativa de acesso ilícito</li>
                        <li>comportamento que comprometa a segurança do sistema</li>
                    </ul>
                </Section>

                <Section title="7. Limitação de responsabilidade">
                    <p>Os responsáveis pelo desenvolvimento da plataforma não serão responsáveis por:</p>
                    <ul>
                        <li>interrupções temporárias do serviço</li>
                        <li>falhas técnicas</li>
                        <li>utilização incorreta da plataforma</li>
                        <li>danos resultantes de informação incorreta fornecida pelos utilizadores</li>
                    </ul>
                </Section>

                <Section title="8. Alterações aos termos">
                    <p>Os presentes Termos e Condições podem ser alterados a qualquer momento.</p>
                </Section>

                </div>

                <div style={{ marginTop: 32, textAlign: "center" }}>
                    <Link to="/login" className="btn btn-primary">
                        ← Voltar ao login
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ── Componentes auxiliares de layout ──
function Section({ title, children }) {
    return (
        <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#111", borderBottom: "1px solid #e5e5e5", paddingBottom: 6, marginBottom: 12, marginTop: 24 }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

function SubSection({ title, children }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 6 }}>{title}</h3>
            {children}
        </div>
    );
}
