const express = require('express');
const app = express();
const port = 3000;
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
const axios = require('axios');
app.use(express.urlencoded({ extended: true }));
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: 1024 * 1024 * 10, type: 'application/json' }))
var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "7da807abf7bd67",
      pass: "42d4e4a3cc34a7"
    }
  });
var cors = require('cors');
app.use(cors())




const uploads = multer({ dest: __dirname + "/uploads" })

const https = require('https');
let keycloakId;
const path = require('path');

// set static directories
app.use(express.static(path.join(__dirname, 'public')));
const User = require('./models/User');

app.get('/', (req, res) => {
    keycloakId = req.query.id;
    res.render(path.join(__dirname + '/public/views/index.ejs'));
});

app.post('/submit', async (req, res) => {
    console.log(req.query)
    await User.insertUserData(req.body.file1, req.body.file2, req.body.file3 , req.query.id, 'pendding');
    await transport.sendMail({
        from: "Open Test",
        to: "test@test.com",
        subject: "testing",
        html: `
        <p>A new user has been registered</p>
        <a href="http://vue-dashboard-19-vaps-sit.apps.nt-non-ocp.neotek.sa/user/${keycloakId}">View User</a>
        `
    })
    res.json({ success: true });

    // res.redirect("https://apic-nonpr-459450ca-portal-web-cp4i-nonprod.apps.nt-non-ocp.neotek.sa/mfa-developer-portal/test-cat/");
})

app.get('/download-pdf/:userId', async (req, res) => {
    const user = await User.findOne({ _id: req.params.userId });
    // Decode Base64 string to binary data
    const pdfBuffer = Buffer.from(user.file, 'base64');

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="downloaded.pdf"');

    // Send the PDF buffer as the response
    res.send(pdfBuffer);
});

app.put("/update-user/:keycloakId" , async (req , res) => {
    await User.updateUserData(req.params.keycloakId , req.body);
    if (req.body.status == 'Rejected') {
        await transport.sendMail({
            from: "Open Test",
            to: req.query.email,
            subject: "testing",
            html: `
            <p>You Have been Rejected</p>
            `
        })
    } else if (req.body.status == 'Revoked') {
        await transport.sendMail({
            from: "Open Test",
            to: req.query.email,
            subject: "testing",
            html: `
            <p>You Have been Reveoked</p>
            `
        })
    } else if (req.body.status == 'Approved') {
        await transport.sendMail({
            from: "Open Test",
            to: req.query.email,
            subject: "testing",
            html: `
            <p>You Have been Approved</p>
            `
        })
    }

    res.status(200).json({Message : "User Revoke Reason is updated Successfully"});
})
app.get("/view-user/:keycloakId", async (req, res) => {
    console.log(req.params.keycloakId);
    const userFiles = await User.findByID(req.params.keycloakId);
    res.json({data: userFiles})
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

const agent = new https.Agent({
    rejectUnauthorized: false
});