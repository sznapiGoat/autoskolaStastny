import { Resend } from "resend";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "autoskola@autoskola-stastny.cz";
const INSTRUCTOR_EMAIL = process.env.INSTRUCTOR_EMAIL || "instruktor@autoskola-stastny.cz";

function formatDate(date: Date | string): string {
  return format(new Date(date), "d. MMMM yyyy", { locale: cs });
}

function formatDay(date: Date | string): string {
  return format(new Date(date), "EEEE", { locale: cs });
}

export async function sendBookingConfirmationToStudent(data: {
  studentName: string;
  studentEmail: string;
  date: Date;
  startTime: string;
  endTime: string;
  pickupLocation?: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: data.studentEmail,
    subject: `Potvrzení rezervace lekce – ${formatDate(data.date)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">Autoškola Šťastný – Potvrzení rezervace</h2>
        <p>Dobrý den, <strong>${data.studentName}</strong>,</p>
        <p>Vaše lekce jízdy byla úspěšně rezervována. Níže naleznete detaily:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Datum:</strong> ${formatDay(data.date)}, ${formatDate(data.date)}</p>
          <p><strong>Čas:</strong> ${data.startTime} – ${data.endTime}</p>
          ${data.pickupLocation ? `<p><strong>Místo vyzvednutí:</strong> ${data.pickupLocation}</p>` : ""}
          <p><strong>Instruktor:</strong> Autoškola Šťastný</p>
          <p><strong>Kontakt:</strong> ${INSTRUCTOR_EMAIL}</p>
        </div>
        <p>Pokud potřebujete lekci zrušit, učiňte tak nejméně 24 hodin předem.</p>
        <p>Těšíme se na vás!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;"/>
        <p style="color: #888; font-size: 12px;">Autoškola Šťastný | Humpolec</p>
      </div>
    `,
  });
}

export async function sendBookingNotificationToInstructor(data: {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  date: Date;
  startTime: string;
  endTime: string;
  pickupLocation?: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: INSTRUCTOR_EMAIL,
    subject: `Nová rezervace lekce – ${data.studentName} – ${formatDate(data.date)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">Autoškola Šťastný – Nová rezervace</h2>
        <p>Byl/a rezervován/a nová lekce jízdy.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${data.studentName}</p>
          <p><strong>Email:</strong> ${data.studentEmail}</p>
          ${data.studentPhone ? `<p><strong>Telefon:</strong> ${data.studentPhone}</p>` : ""}
          <p><strong>Datum:</strong> ${formatDay(data.date)}, ${formatDate(data.date)}</p>
          <p><strong>Čas:</strong> ${data.startTime} – ${data.endTime}</p>
          ${data.pickupLocation ? `<p><strong>Místo vyzvednutí:</strong> ${data.pickupLocation}</p>` : ""}
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;"/>
        <p style="color: #888; font-size: 12px;">Autoškola Šťastný | Systém rezervací</p>
      </div>
    `,
  });
}

export async function sendCancellationEmail(data: {
  recipientName: string;
  recipientEmail: string;
  date: Date;
  startTime: string;
  endTime: string;
  cancelledBy: "student" | "instructor";
}) {
  const cancelledByText =
    data.cancelledBy === "student" ? "studentem" : "instruktorem";

  await resend.emails.send({
    from: FROM,
    to: data.recipientEmail,
    subject: `Zrušení rezervace lekce – ${formatDate(data.date)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">Autoškola Šťastný – Zrušení rezervace</h2>
        <p>Dobrý den, <strong>${data.recipientName}</strong>,</p>
        <p>Lekce jízdy byla zrušena (zrušeno ${cancelledByText}).</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Datum:</strong> ${formatDay(data.date)}, ${formatDate(data.date)}</p>
          <p><strong>Čas:</strong> ${data.startTime} – ${data.endTime}</p>
        </div>
        <p>Pro novou rezervaci navštivte náš rezervační systém.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;"/>
        <p style="color: #888; font-size: 12px;">Autoškola Šťastný | Humpolec</p>
      </div>
    `,
  });
}

export async function sendReminderEmail(data: {
  studentName: string;
  studentEmail: string;
  date: Date;
  startTime: string;
  endTime: string;
  pickupLocation?: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: data.studentEmail,
    subject: `Připomínka: Lekce jízdy zítra – ${data.startTime}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">Autoškola Šťastný – Připomínka lekce</h2>
        <p>Dobrý den, <strong>${data.studentName}</strong>,</p>
        <p>Připomínáme vám lekci jízdy, která se koná <strong>zítra</strong>:</p>
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p><strong>Datum:</strong> ${formatDay(data.date)}, ${formatDate(data.date)}</p>
          <p><strong>Čas:</strong> ${data.startTime} – ${data.endTime}</p>
          ${data.pickupLocation ? `<p><strong>Místo vyzvednutí:</strong> ${data.pickupLocation}</p>` : ""}
        </div>
        <p>Prosíme, buďte připraveni 5 minut před stanoveným časem.</p>
        <p>Těšíme se na vás!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;"/>
        <p style="color: #888; font-size: 12px;">Autoškola Šťastný | Humpolec</p>
      </div>
    `,
  });
}
