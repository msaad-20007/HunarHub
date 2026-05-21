package com.hunarhub.utils;

import java.util.Properties;
import javax.mail.*;
import javax.mail.internet.*;

/**
 * Sends HTML emails via Gmail SMTP.
 * All public methods are non-fatal — they log on failure but never throw.
 */
public class EmailSender {

    private static final String SMTP_HOST     = "smtp.gmail.com";
    private static final String SMTP_PORT     = "587";
    private static final String EMAIL_USERNAME = "hello.hunarhub@gmail.com";
    private static final String EMAIL_PASSWORD = "jryl bpdp jstr nlij";
    private static final String FROM_NAME      = "HunarHub";

    // ── Core send ─────────────────────────────────────────────────────────────
    private static void send(String toEmail, String subject, String htmlBody) {
        Properties props = new Properties();
        props.put("mail.smtp.auth",            "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host",            SMTP_HOST);
        props.put("mail.smtp.port",            SMTP_PORT);
        props.put("mail.smtp.ssl.trust",       SMTP_HOST);

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(EMAIL_USERNAME, EMAIL_PASSWORD);
            }
        });

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(EMAIL_USERNAME, FROM_NAME));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject, "UTF-8");
            message.setContent(htmlBody, "text/html; charset=UTF-8");
            Transport.send(message);
            System.out.println("[Email] Sent '" + subject + "' → " + toEmail);
        } catch (Exception e) {
            System.err.println("[Email] Failed to send '" + subject + "' → " + toEmail + " : " + e.getMessage());
        }
    }

    // ── Shared HTML wrapper ───────────────────────────────────────────────────
    private static String wrap(String accentColor, String emoji, String title, String bodyHtml) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<style>" +
            "  *{margin:0;padding:0;box-sizing:border-box;}" +
            "  body{background:#060E18;font-family:'Segoe UI',Arial,sans-serif;color:#C8D8E8;}" +
            "  .wrap{max-width:600px;margin:0 auto;padding:32px 16px;}" +
            "  .card{background:#0B1825;border-radius:20px;border:1px solid #162535;overflow:hidden;}" +
            "  .header{background:linear-gradient(135deg,#0A1E32,#0C2540);padding:40px 32px;text-align:center;border-bottom:1px solid #162535;}" +
            "  .logo-ring{display:inline-flex;align-items:center;justify-content:center;" +
            "    width:80px;height:80px;border-radius:50%;border:2px solid " + accentColor + "60;" +
            "    background:linear-gradient(135deg," + accentColor + "15,transparent);margin-bottom:16px;}" +
            "  .logo-emoji{font-size:36px;}" +
            "  .brand{font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:3px;margin-bottom:4px;}" +
            "  .brand span{color:" + accentColor + ";}" +
            "  .tagline{font-size:12px;color:#3A5568;letter-spacing:2px;text-transform:uppercase;}" +
            "  .body{padding:32px;}" +
            "  .greeting{font-size:22px;font-weight:700;color:#D8EAF8;margin-bottom:8px;}" +
            "  .text{font-size:15px;color:#7A9AB0;line-height:1.7;margin-bottom:16px;}" +
            "  .divider{height:1px;background:linear-gradient(90deg,transparent," + accentColor + "40,transparent);margin:24px 0;}" +
            "  .info-box{background:#060E18;border-radius:14px;border:1px solid #162535;padding:20px;margin:20px 0;}" +
            "  .info-row{display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #0C1E2E;}" +
            "  .info-row:last-child{border-bottom:none;}" +
            "  .info-icon{font-size:18px;width:32px;flex-shrink:0;}" +
            "  .info-label{font-size:11px;color:#3A5568;font-weight:700;letter-spacing:1px;text-transform:uppercase;}" +
            "  .info-value{font-size:14px;color:#C8D8E8;font-weight:600;margin-top:2px;}" +
            "  .otp-box{text-align:center;background:#060E18;border-radius:16px;border:2px solid " + accentColor + "40;padding:28px;margin:24px 0;}" +
            "  .otp-label{font-size:12px;color:#3A5568;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;}" +
            "  .otp-code{font-size:48px;font-weight:900;color:" + accentColor + ";letter-spacing:12px;" +
            "    text-shadow:0 0 20px " + accentColor + "60;}" +
            "  .otp-expire{font-size:12px;color:#3A5568;margin-top:10px;}" +
            "  .btn{display:inline-block;background:linear-gradient(135deg," + accentColor + "," + accentColor + "CC);" +
            "    color:#060E18;font-weight:800;font-size:15px;padding:14px 36px;border-radius:12px;" +
            "    text-decoration:none;letter-spacing:0.5px;margin:8px 0;}" +
            "  .status-badge{display:inline-block;padding:8px 20px;border-radius:20px;font-weight:700;font-size:13px;" +
            "    border:1px solid " + accentColor + "50;background:" + accentColor + "15;color:" + accentColor + ";}" +
            "  .footer{text-align:center;padding:24px 32px;border-top:1px solid #0C1E2E;}" +
            "  .footer-text{font-size:12px;color:#243545;line-height:1.8;}" +
            "  .footer-brand{color:" + accentColor + ";font-weight:700;}" +
            "  .highlight{color:" + accentColor + ";font-weight:700;}" +
            "</style></head><body>" +
            "<div class='wrap'><div class='card'>" +
            "<div class='header'>" +
            "  <div class='logo-ring'><span class='logo-emoji'>" + emoji + "</span></div>" +
            "  <div class='brand'>HUNAR<span>HUB</span></div>" +
            "  <div class='tagline'>Skilled Workers at Your Doorstep</div>" +
            "</div>" +
            "<div class='body'>" + bodyHtml + "</div>" +
            "<div class='footer'>" +
            "  <p class='footer-text'>© 2025 <span class='footer-brand'>HunarHub</span>. All rights reserved.<br>" +
            "  This email was sent from <span class='footer-brand'>hello.hunarhub@gmail.com</span><br>" +
            "  If you did not request this, please ignore this email.</p>" +
            "</div>" +
            "</div></div></body></html>";
    }

    // ── 1. Welcome Email (Customer) ───────────────────────────────────────────
    public static void sendWelcomeCustomer(String toEmail, String name) {
        String body =
            "<p class='greeting'>Welcome, " + name + "! 🎉</p>" +
            "<p class='text'>Your <span class='highlight'>HunarHub</span> account is ready. " +
            "You can now browse and book skilled workers near you — plumbers, electricians, painters, and more.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>🔍</span><div><div class='info-label'>Step 1</div><div class='info-value'>Browse skilled workers by category</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>📅</span><div><div class='info-label'>Step 2</div><div class='info-value'>Book instantly or schedule in advance</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>💬</span><div><div class='info-label'>Step 3</div><div class='info-value'>Chat directly with your worker</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>⭐</span><div><div class='info-label'>Step 4</div><div class='info-value'>Rate and review after the job</div></div></div>" +
            "</div>" +
            "<p class='text'>We're glad to have you on board. Let's get things done!</p>";
        send(toEmail, "Welcome to HunarHub! 🔧", wrap("#00D2FF", "🔧", "Welcome", body));
    }

    // ── 2. Welcome Email (Worker) ─────────────────────────────────────────────
    public static void sendWelcomeWorker(String toEmail, String name, String category) {
        String body =
            "<p class='greeting'>Welcome aboard, " + name + "! 🔧</p>" +
            "<p class='text'>Your <span class='highlight'>HunarHub</span> worker account has been created. " +
            "Your profile is currently under review by our admin team.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>👤</span><div><div class='info-label'>Name</div><div class='info-value'>" + name + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🛠️</span><div><div class='info-label'>Category</div><div class='info-value'>" + category + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>⏳</span><div><div class='info-label'>Status</div><div class='info-value'>Pending Admin Approval</div></div></div>" +
            "</div>" +
            "<p class='text'>Once approved, your profile will be visible to customers and you'll start receiving booking requests. " +
            "You'll get an email notification as soon as your account is approved.</p>";
        send(toEmail, "Welcome to HunarHub — Pending Approval 🔧", wrap("#FFC107", "🔧", "Welcome Worker", body));
    }

    // ── 3. Worker Approved ────────────────────────────────────────────────────
    public static void sendWorkerApproved(String toEmail, String name, String category) {
        String body =
            "<p class='greeting'>Great news, " + name + "! ✅</p>" +
            "<p class='text'>Your <span class='highlight'>HunarHub</span> worker profile has been <span class='highlight'>approved</span>. " +
            "You are now visible to customers and can start receiving booking requests.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>✅</span><div><div class='info-label'>Status</div><div class='info-value'>Verified & Approved</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🛠️</span><div><div class='info-label'>Category</div><div class='info-value'>" + category + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>📱</span><div><div class='info-label'>Next Step</div><div class='info-value'>Open your Worker Dashboard to manage requests</div></div></div>" +
            "</div>" +
            "<p class='text'>Customers can now find and book you. Keep your dashboard open to respond to requests quickly!</p>";
        send(toEmail, "Your HunarHub Profile is Approved! ✅", wrap("#00E676", "✅", "Approved", body));
    }

    // ── 4. Worker Rejected ────────────────────────────────────────────────────
    public static void sendWorkerRejected(String toEmail, String name) {
        String body =
            "<p class='greeting'>Hello, " + name + "</p>" +
            "<p class='text'>We regret to inform you that your <span class='highlight'>HunarHub</span> worker profile application has not been approved at this time.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>❌</span><div><div class='info-label'>Status</div><div class='info-value'>Application Rejected</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>📧</span><div><div class='info-label'>Contact</div><div class='info-value'>hello.hunarhub@gmail.com</div></div></div>" +
            "</div>" +
            "<p class='text'>If you believe this is a mistake or would like to reapply with updated information, " +
            "please contact our support team at <span class='highlight'>hello.hunarhub@gmail.com</span>.</p>";
        send(toEmail, "HunarHub — Application Status Update", wrap("#FF4C4C", "❌", "Rejected", body));
    }

    // ── 5. New Booking Request (to Worker) ────────────────────────────────────
    public static void sendNewBookingToWorker(String toEmail, String workerName,
            String customerName, String bookingType, int bookingId, String bookingDate) {
        String typeColor = "URGENT".equals(bookingType) ? "#FF4C4C" : "ADVANCE".equals(bookingType) ? "#3A7BD5" : "#00D2FF";
        String body =
            "<p class='greeting'>New Booking Request! 📋</p>" +
            "<p class='text'>Hello <span class='highlight'>" + workerName + "</span>, you have received a new booking request on HunarHub.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>#</span><div><div class='info-label'>Booking ID</div><div class='info-value'>#" + bookingId + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>👤</span><div><div class='info-label'>Customer</div><div class='info-value'>" + customerName + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>📅</span><div><div class='info-label'>Date</div><div class='info-value'>" + bookingDate + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🏷️</span><div><div class='info-label'>Type</div><div class='info-value'><span style='color:" + typeColor + ";font-weight:700;'>" + bookingType + "</span></div></div></div>" +
            "</div>" +
            "<p class='text'>Please open your <span class='highlight'>Worker Dashboard</span> to accept or reject this request. Respond quickly to maintain a good rating!</p>";
        send(toEmail, "New " + bookingType + " Booking Request — HunarHub 📋", wrap(typeColor, "📋", "New Booking", body));
    }

    // ── 6. Booking Accepted (to Customer) ────────────────────────────────────
    public static void sendBookingAccepted(String toEmail, String customerName,
            String workerName, String category, int bookingId, String bookingDate) {
        String body =
            "<p class='greeting'>Booking Confirmed! 🎉</p>" +
            "<p class='text'>Great news, <span class='highlight'>" + customerName + "</span>! Your booking has been <span class='highlight'>accepted</span>.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>#</span><div><div class='info-label'>Booking ID</div><div class='info-value'>#" + bookingId + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🔧</span><div><div class='info-label'>Worker</div><div class='info-value'>" + workerName + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🛠️</span><div><div class='info-label'>Service</div><div class='info-value'>" + category + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>📅</span><div><div class='info-label'>Date</div><div class='info-value'>" + bookingDate + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>✅</span><div><div class='info-label'>Status</div><div class='info-value'><span style='color:#00E676;font-weight:700;'>ACCEPTED</span></div></div></div>" +
            "</div>" +
            "<p class='text'>You can chat with your worker directly through the <span class='highlight'>HunarHub app</span>. We hope you have a great experience!</p>";
        send(toEmail, "Booking Accepted — " + workerName + " is on the way! ✅", wrap("#00E676", "✅", "Accepted", body));
    }

    // ── 7. Booking Rejected (to Customer) ────────────────────────────────────
    public static void sendBookingRejected(String toEmail, String customerName,
            String workerName, int bookingId) {
        String body =
            "<p class='greeting'>Booking Update</p>" +
            "<p class='text'>Hello <span class='highlight'>" + customerName + "</span>, unfortunately your booking request has been <span style='color:#FF4C4C;font-weight:700;'>rejected</span> by the worker.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>#</span><div><div class='info-label'>Booking ID</div><div class='info-value'>#" + bookingId + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🔧</span><div><div class='info-label'>Worker</div><div class='info-value'>" + workerName + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>❌</span><div><div class='info-label'>Status</div><div class='info-value'><span style='color:#FF4C4C;font-weight:700;'>REJECTED</span></div></div></div>" +
            "</div>" +
            "<p class='text'>Don't worry — there are many other skilled workers available. Open the <span class='highlight'>HunarHub app</span> to find and book another worker.</p>";
        send(toEmail, "Booking Update — HunarHub", wrap("#FF4C4C", "📋", "Booking Rejected", body));
    }

    // ── 8. Booking Completed (to Customer) ───────────────────────────────────
    public static void sendBookingCompleted(String toEmail, String customerName,
            String workerName, String category, int bookingId) {
        String body =
            "<p class='greeting'>Job Completed! 🏆</p>" +
            "<p class='text'>Hello <span class='highlight'>" + customerName + "</span>, your booking has been marked as <span class='highlight'>completed</span>.</p>" +
            "<div class='divider'></div>" +
            "<div class='info-box'>" +
            "  <div class='info-row'><span class='info-icon'>#</span><div><div class='info-label'>Booking ID</div><div class='info-value'>#" + bookingId + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🔧</span><div><div class='info-label'>Worker</div><div class='info-value'>" + workerName + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🛠️</span><div><div class='info-label'>Service</div><div class='info-value'>" + category + "</div></div></div>" +
            "  <div class='info-row'><span class='info-icon'>🏆</span><div><div class='info-label'>Status</div><div class='info-value'><span style='color:#3A7BD5;font-weight:700;'>COMPLETED</span></div></div></div>" +
            "</div>" +
            "<p class='text'>We'd love to hear your feedback! Please take a moment to <span class='highlight'>rate and review</span> " + workerName + " in the app. Your review helps other customers.</p>";
        send(toEmail, "Job Completed — Please Rate " + workerName + " ⭐", wrap("#3A7BD5", "🏆", "Completed", body));
    }

    // ── 9. Forgot Password OTP ────────────────────────────────────────────────
    public static void sendPasswordResetOtp(String toEmail, String name, String otp) {
        String body =
            "<p class='greeting'>Password Reset Request 🔐</p>" +
            "<p class='text'>Hello <span class='highlight'>" + name + "</span>, " +
            "we received a request to reset your <span class='highlight'>HunarHub</span> password.</p>" +
            "<div class='divider'></div>" +
            "<div class='otp-box'>" +
            "  <div class='otp-label'>YOUR VERIFICATION CODE</div>" +
            "  <div class='otp-code'>" + otp + "</div>" +
            "  <div class='otp-expire'>⏱ Expires in 10 minutes</div>" +
            "</div>" +
            "<p class='text'>Enter this code in the app to reset your password. " +
            "If you did not request a password reset, you can safely ignore this email — " +
            "your account remains secure.</p>";
        send(toEmail, "HunarHub — Password Reset Code: " + otp, wrap("#FF6B35", "🔐", "Reset Password", body));
    }

    // ── Legacy plain-text fallback (keeps old callers working) ───────────────
    public static void sendEmail(String toEmail, String subject, String body) {
        send(toEmail, subject, wrap("#00D2FF", "🔧", subject,
            "<p class='text'>" + body.replace("\n", "<br>") + "</p>"));
    }
}
