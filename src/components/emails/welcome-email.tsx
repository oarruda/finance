import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}

export default function WelcomeEmail({
  name,
  email,
  password,
  loginUrl,
}: WelcomeEmailProps) {
  return (
  <html>
    <head>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .credentials {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .credentials p {
          margin: 10px 0;
        }
        .credentials strong {
          color: #667eea;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e9ecef;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <h1>🎉 Bem-vindo ao FIN</h1>
        </div>
        <div className="content">
          <p>Olá <strong>{name}</strong>,</p>
          <p>
            Uma conta foi criada para você no FIN. 
            Abaixo estão suas credenciais de acesso:
          </p>
          
          <div className="credentials">
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Senha Temporária:</strong> {password}</p>
          </div>

          <div className="warning">
            <p>
              ⚠️ <strong>Importante:</strong> Esta é uma senha temporária. 
              Por motivos de segurança, recomendamos que você altere sua senha 
              após o primeiro acesso.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href={loginUrl} className="button">
              Acessar Sistema
            </a>
          </div>

          <p style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
            Se você tiver alguma dúvida ou precisar de ajuda, entre em contato 
            com o administrador do sistema.
          </p>
        </div>
        <div className="footer">
          <p>
            Este é um email automático. Por favor, não responda a esta mensagem.
          </p>
          <p>© {new Date().getFullYear()} Sistema Financeiro. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
  </html>
  );
}
