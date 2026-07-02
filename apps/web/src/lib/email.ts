import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Paideia <onboarding@resend.dev>";

export async function sendAnamneseNotification(params: {
  therapistEmail: string;
  therapistName: string;
  clientName: string;
  clientEmail: string;
  intention: string;
  anamneseId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();

  await resend.emails.send({
    from: FROM,
    to: params.therapistEmail,
    subject: `Nova anamnese recebida — ${params.clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#C2542F;margin-bottom:4px">Paideia</h2>
        <p style="color:#666;margin-top:0">Plataforma de supervisão clínica</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <h3 style="color:#1a1a1a">Nova anamnese recebida</h3>
        <p>Olá, <strong>${params.therapistName}</strong>!</p>
        <p>Um novo cliente preencheu a anamnese e aguarda sua avaliação:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:8px 0;color:#666;width:140px">Nome</td>
            <td style="padding:8px 0;font-weight:600">${params.clientName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666">Email</td>
            <td style="padding:8px 0">${params.clientEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;vertical-align:top">Intenção</td>
            <td style="padding:8px 0;font-style:italic">"${params.intention}"</td>
          </tr>
        </table>
        <p>Acesse o painel para visualizar a anamnese completa e aceitar ou recusar o cliente.</p>
        <p style="margin-top:32px;color:#999;font-size:12px">
          Paideia · Plataforma de supervisão clínica para terapeutas
        </p>
      </div>
    `,
  });
}

export async function sendAnamneseInvite(params: {
  patientEmail: string;
  therapistName: string;
  anamneseUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();

  await resend.emails.send({
    from: FROM,
    to: params.patientEmail,
    subject: `${params.therapistName} convidou você para preencher sua anamnese`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#C2542F;margin-bottom:4px">Paideia</h2>
        <p style="color:#666;margin-top:0">Plataforma de supervisão clínica</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <h3 style="color:#1a1a1a">Você foi convidado(a) para preencher uma anamnese</h3>
        <p>Olá!</p>
        <p><strong>${params.therapistName}</strong> convidou você para preencher uma anamnese inicial antes da sua sessão.</p>
        <p>É rápido, seguro e não requer cadastro.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${params.anamneseUrl}"
            style="background:#C2542F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;display:inline-block">
            Preencher anamnese
          </a>
        </div>
        <p style="color:#999;font-size:12px">Ou acesse diretamente: <a href="${params.anamneseUrl}" style="color:#C2542F">${params.anamneseUrl}</a></p>
        <p style="margin-top:32px;color:#999;font-size:12px">
          Paideia · Plataforma de supervisão clínica para terapeutas
        </p>
      </div>
    `,
  });
}

export async function sendAnamneseConfirmation(params: {
  clientEmail: string;
  clientName: string;
  therapistName: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();

  await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: "Anamnese recebida com sucesso",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#C2542F;margin-bottom:4px">Paideia</h2>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <h3 style="color:#1a1a1a">Anamnese recebida!</h3>
        <p>Olá, <strong>${params.clientName}</strong>!</p>
        <p>Sua anamnese foi recebida com sucesso e será avaliada por <strong>${params.therapistName}</strong> em breve.</p>
        <p>Assim que for analisada, você receberá um retorno.</p>
        <p style="margin-top:32px;color:#999;font-size:12px">
          Paideia · Plataforma de supervisão clínica para terapeutas
        </p>
      </div>
    `,
  });
}
