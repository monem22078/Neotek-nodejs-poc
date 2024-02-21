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
    await User.insertUserData(req.body.file1, req.body.file2, req.body.file3, req.query.id, 'pendding');
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

app.put("/update-user/:keycloakId", async (req, res) => {
    await User.updateUserData(req.params.keycloakId, req.body);
    const userName = req.query.userName;
    const emailContents = generateEmailContent(userName);
    if (req.body.status == 'Rejected') {
        await transport.sendMail({
            from: "Open Test",
            to: req.query.email,
            subject: "testing",
            html: `
            <p>`+ emailContents.rejectionEmailContent + `</p>
            `
        })
    } else if (req.body.status == 'Revoked') {
        await transport.sendMail({
            from: "Open Test",
            to: req.query.email,
            subject: "testing",
            html: `
            <p>`+ emailContents.revorevocationEmailContent + `</p>
            `
        })
    } else if (req.body.status == 'Approved') {
        await transport.sendMail({
            from: "Open Test",
            to: req.query.email,
            subject: "testing",
            html: `
            <p>`+ emailContents.rejectionEmailContent + `</p>
            `
        })
    }

    res.status(200).json({ Message: "User Revoke Reason is updated Successfully" });
})
app.get("/view-user/:keycloakId", async (req, res) => {
    console.log(req.params.keycloakId);
    const userFiles = await User.findByID(req.params.keycloakId);
    res.json({ data: userFiles })
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

const agent = new https.Agent({
    rejectUnauthorized: false
});

function generateEmailContent(userName) {
    const emailContents = {
        approvalEmailContent: ` 
                    Dear ${userName},
                    
                    Congratulations! Your request for approval has been processed successfully.
                    
                    Feel free to explore all the features and benefits available to you at https://yourportal.com. Should you have any questions or require assistance, our support team at x@xx.com will be more than happy to assist you.
                    
                    We look forward to your valuable contributions.
                    
                    Best regards,
                    `,
        rejectionEmailContent: `
                    Dear ${userName},
                    
                    We regret to inform you that your request for approval has been declined. After careful consideration, we have determined that your application does not meet our current criteria for user approval. The specific reason for the rejection is reasonForRejection.
                    
                    If you have any questions or need further clarification, please reach out to our support team at support@email.com.
                    
                    Thank you for your understanding.
                    
                    Best regards,
                    `,
        revorevocationEmailContent: `
                    Dear ${userName},
                    
                    We regret to inform you that your user privileges have been revoked. After careful review, we have made the decision to revoke your access to our platform, effective immediately.
                    
                    If you have any questions or need further information, please reach out to our support team at support@email.com.
                    
                    Thank you for your understanding.
                    
                    Best regards,
                    `
    };
    return emailContents;
}