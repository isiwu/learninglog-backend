import "core-js/stable";
import "regenerator-runtime/runtime";
import nodeMailer from 'nodemailer';
import User from './models/user';

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
  let html;

  if (!req.headers.xhr) {
    html = `<!DOCTYPE html>
      <html>
      <body style='background-color:#f0f0f0;'>
      <div style='width:45%;margin:60px auto;background-color:#FFFFFF;padding: 40px'>
        <h2 style='color: green;'>Hi,</h2>
        <p style='font-size:24px; font-family:"Times New Roman", Times, serif;'>${msg[0]}</p>
        <p style='font-size:24px; font-family:"Times New Roman", Times, serif;margin-bottom:20px;'>${msg[1]}</p>
        ${button}
      </div>
      </body>
      </html>`;
  } else {
    html = `<!DOCTYPE html>
      <html>
      <body style='background-color:#f0f0f0;'>
      <div style='width:45%;margin:60px auto;background-color:#FFFFFF;padding: 40px'>
        <h2 style='color: green;'>Hi,</h2>
        <p style='font-size:24px; font-family:"Times New Roman", Times, serif;'>${msg[0]}</p>
        <p style='font-size:24px; font-family:"Times New Roman", Times, serif;margin-bottom:20px;'>${msg[1]}</p>
      </div>
      </body>
      </html>`;
  }
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
  subject,
  html,
  };

  return transporter.sendMail(mail)
  .then(() => {
    return true;
  })
  .catch(error => {
    console.log(`Unable to mail voter: ${error.message}`);
    return false;
  });
},
isAPIRequest = (req) => {
  if (req.headers.xhr) return true;
  else return false;
},
genUniqueCode = async (length) => {
  let randomUniqueCode, codeExists;

  //ENSURE LENGTH
  // eslint-disable-next-line no-constant-condition
  while (true) {
    randomUniqueCode = Math.floor(Math.random() * Date.now());

    if (randomUniqueCode.length >= length) break;
  }

  const uniqueCode = randomUniqueCode.slice(0, length);

  //ENSURE CODE UNIQUENESS
  try {
    codeExists = await User.exists({verifyCode: uniqueCode});
    console.log(codeExists);
  } catch (error) {
    console.log(`Error fetching user info in genUniqueCode controller due to: ${error.message}`);
  }

  if (codeExists) genUniqueCode(length);
  else return uniqueCode;
};

export {getData, sendMail, isAPIRequest, genUniqueCode};