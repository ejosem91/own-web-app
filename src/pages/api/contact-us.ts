import nodemailer from 'nodemailer';

export const prerender = false;

const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port: Number(import.meta.env.SMTP_PORT || 587),
  secure: String(import.meta.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  },
});

export async function POST({ request }: { request: Request }) {
  try {
    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    const botcheck = String(form.get('botcheck') || '');

    if (botcheck) return new Response('OK', { status: 200 }); // honeypot

    if (!email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Faltan campos obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await transporter.sendMail({
      from: `"${name || 'Formulario Web'}" <${import.meta.env.SMTP_USER}>`, // tu remitente real
      to: import.meta.env.TO_EMAIL || import.meta.env.SMTP_USER,
      subject: `Nuevo contacto: ${name || email}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
      replyTo: email, // para que al responder, vaya al visitante
    });

    return new Response(null, {
      status: 303,
      headers: { Location: '/gracias' },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ ok: false, error: 'No se pudo enviar el email.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
