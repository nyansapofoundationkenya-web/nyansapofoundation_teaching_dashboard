import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  console.log('=== Contact Form API Called ===');
  
  try {
    // Parse request
    const body = await request.json();
    console.log('Form data received:', JSON.stringify(body, null, 2));
    
    // Validate environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('ERROR: SMTP credentials not found in environment variables');
      console.log('SMTP_USER exists:', !!process.env.SMTP_USER);
      console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
      
      return NextResponse.json(
        { 
          error: 'Email service not configured. Please contact support.',
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }
    
    // Validate required fields
    const { name, email, subject, message, contactMethod, phone } = body;
    
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!subject) missingFields.push('subject');
    if (!message) missingFields.push('message');
    if (!contactMethod) missingFields.push('contactMethod');
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Create transporter with simplified configuration
    // Gmail usually works better with 'service: "gmail"' instead of host/port
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // These are Gmail-specific settings that help with deliverability
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Transporter created, verifying connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    // Create email content
    const mailOptions = {
      from: `"Website Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself (the SMTP_USER)
      replyTo: email, // So you can reply directly to the submitter
      subject: `Contact Form: ${subject}`,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ''}
Contact Method: ${contactMethod}
Subject: ${subject}

Message:
${message}

---
Sent from your website contact form
Time: ${new Date().toLocaleString()}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #4b5563; }
        .message { background: white; padding: 15px; border: 1px solid #d1d5db; border-radius: 4px; }
        .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📨 New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">From:</div>
                <div><strong>${name}</strong> &lt;${email}&gt;</div>
            </div>
            ${phone ? `
            <div class="field">
                <div class="label">Phone:</div>
                <div>${phone}</div>
            </div>` : ''}
            <div class="field">
                <div class="label">Preferred Contact Method:</div>
                <div>${contactMethod.charAt(0).toUpperCase() + contactMethod.slice(1)}</div>
            </div>
            <div class="field">
                <div class="label">Subject:</div>
                <div><strong>${subject}</strong></div>
            </div>
            <div class="field">
                <div class="label">Message:</div>
                <div class="message">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
                <p>This message was sent from your website contact form on ${new Date().toLocaleString()}</p>
                <p>You can reply directly to ${email} to respond.</p>
            </div>
        </div>
    </div>
</body>
</html>
      `
    };
    
    console.log('Attempting to send email...');
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR in contact form API:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Provide specific error messages
    let userMessage = 'Failed to send message. Please try again.';
    let statusCode = 500;
    
    if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
      userMessage = 'Email authentication failed. Please check your email credentials.';
      statusCode = 401;
    } else if (error.code === 'ECONNECTION' || error.message.includes('ENOTFOUND')) {
      userMessage = 'Cannot connect to email server. Please check your internet connection.';
      statusCode = 503;
    } else if (error.code === 'EENVELOPE') {
      userMessage = 'Invalid email address provided.';
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code
        } : undefined
      },
      { status: statusCode }
    );
  }
}

// GET endpoint for testing
export async function GET(request) {
  console.log('=== Testing SMTP Connection ===');
  
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'SMTP credentials not configured',
        env: {
          SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
          SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET'
        }
      }, { status: 500 });
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });
    
    await transporter.verify();
    
    return NextResponse.json({
      status: 'SUCCESS',
      message: 'SMTP connection is working',
      email: process.env.SMTP_USER,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      message: 'SMTP connection failed',
      error: error.message,
      code: error.code,
      email: process.env.SMTP_USER,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}