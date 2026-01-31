/**
 * EMAIL SERVICE
 * Handles all email sending functionality
 */

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        this.provider = process.env.EMAIL_PROVIDER || 'nodemailer';
        this.from = process.env.EMAIL_FROM;
        this.fromName = process.env.EMAIL_FROM_NAME || 'RTWE ERP';
        
        if (this.provider === 'sendgrid') {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        } else {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        }
    }
    
    async sendEmail(to, subject, html, text = null) {
        try {
            if (this.provider === 'sendgrid') {
                const msg = {
                    to,
                    from: { email: this.from, name: this.fromName },
                    subject,
                    html,
                    text: text || html.replace(/<[^>]*>/g, '')
                };
                await sgMail.send(msg);
            } else {
                await this.transporter.sendMail({
                    from: `"${this.fromName}" <${this.from}>`,
                    to,
                    subject,
                    html,
                    text
                });
            }
            
            console.log(`✓ Email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            console.error('Email send error:', error);
            throw error;
        }
    }
    
    async sendVerificationEmail(user, token) {
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4a3520; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 30px; background: #4a3520; 
                             color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏭 RTWE ERP</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome, ${user.full_name}!</h2>
                        <p>Thank you for joining RTWE ERP. To complete your registration, 
                           please verify your email address.</p>
                        <p style="text-align: center;">
                            <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                        <p><strong>This link will expire in 24 hours.</strong></p>
                        <p>If you didn't create this account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 RTWE ERP. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(
            user.email,
            'Verify Your Email - RTWE ERP',
            html
        );
    }
    
    async sendPasswordResetEmail(user, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial;">
                    <div style="background: #4a3520; color: white; padding: 20px; text-align: center;">
                        <h1>🏭 RTWE ERP</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2>Password Reset Request</h2>
                        <p>Hello ${user.full_name},</p>
                        <p>We received a request to reset your password. Click the button below to proceed:</p>
                        <p style="text-align: center;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; 
                               background: #4a3520; color: white; text-decoration: none; 
                               border-radius: 5px; margin: 20px 0;">Reset Password</a>
                        </p>
                        <p>Or copy this link: ${resetUrl}</p>
                        <p><strong>This link will expire in 2 hours.</strong></p>
                        <p>If you didn't request this, please ignore this email and your password 
                           will remain unchanged.</p>
                    </div>
                    <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                        <p>© 2026 RTWE ERP. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(
            user.email,
            'Reset Your Password - RTWE ERP',
            html
        );
    }
    
    async sendWelcomeEmail(user, tempPassword) {
        const loginUrl = `${process.env.FRONTEND_URL}/login`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial;">
                    <div style="background: #4a3520; color: white; padding: 20px; text-align: center;">
                        <h1>🏭 RTWE ERP</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2>Welcome to RTWE ERP!</h2>
                        <p>Hello ${user.full_name},</p>
                        <p>Your account has been created successfully. Here are your login credentials:</p>
                        <div style="background: white; padding: 20px; border-left: 4px solid #4a3520; margin: 20px 0;">
                            <p><strong>Username:</strong> ${user.username}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                            <p><strong>Company:</strong> ${user.company_name}</p>
                            <p><strong>Unit:</strong> ${user.unit_name || 'All Units'}</p>
                            <p><strong>Role:</strong> ${user.role.replace('_', ' ').toUpperCase()}</p>
                        </div>
                        <p style="text-align: center;">
                            <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; 
                               background: #4a3520; color: white; text-decoration: none; 
                               border-radius: 5px; margin: 20px 0;">Login Now</a>
                        </p>
                        <p><strong>⚠️ Important:</strong></p>
                        <ul>
                            <li>You will be required to change your password on first login</li>
                            <li>Keep your credentials secure and do not share them</li>
                            <li>Contact your administrator if you need assistance</li>
                        </ul>
                    </div>
                    <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                        <p>© 2026 RTWE ERP. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(
            user.email,
            'Welcome to RTWE ERP - Account Created',
            html
        );
    }
}

module.exports = new EmailService();
