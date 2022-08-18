import nodeMailer from 'nodemailer';

const getData = (body) => {
  const data = {};

  for (const key in body) {
    if (Object.hasOwnProperty.call(body, key)) {
      if (key === 'password') continue;
      
      data[key] = body[key];
    }
  }

  return data;
},

sendMail = (req, subject, button, ...msg) => {
  const transporter = nodeMailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: process.env.SENDGRID_USER,
      pass: process.env.SENDGRID_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    }
  }),

  mail = {
  from: 'onyedikachiemmanuel86@gmail.com',
  to: req.body.email,
  subject: subject,
  html: `
    <!DOCTYPE html>
    <html>
    <body style='background-color:#f0f0f0;'>
    <div style='width:45%;margin:60px auto;background-color:#FFFFFF;padding: 40px'>
      <h2 style='color: green;'>Hi,</h2>
      <p style='font-size:24px; font-family:"Times New Roman", Times, serif;'>${msg[0]}</p>
      <p style='font-size:24px; font-family:"Times New Roman", Times, serif;margin-bottom:20px;'>${msg[1]}</p>
      ${button}
    </div>
    </body>
    </html>`
  };

  return transporter.sendMail(mail)
  .then(() => {
    return true;
  })
  .catch(error => {
    console.log(`Unable to mail voter: ${error.message}`);
    return false;
  });
};

export {getData, sendMail};